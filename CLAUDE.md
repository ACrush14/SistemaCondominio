# Contexto do Projeto — CondoManage (SistemaCondominio)

Este arquivo existe para dar contexto rápido a quem (humano ou IA) for continuar o desenvolvimento. Ele documenta decisões e descobertas que não são óbvias só de ler o código. **Se você é uma IA retomando este projeto sem ter visto o histórico da conversa que gerou essas mudanças, leia este arquivo inteiro antes de mexer em qualquer coisa** — várias decisões aqui existem por causa de bugs reais encontrados na prática, não são só estilo.

## O que é o projeto

Sistema de gestão de condomínios com três perfis de dashboard (Síndico, Porteiro, Morador) e um assistente de IA ("Mania") para agendamento de reservas por linguagem natural. É um projeto de aprendizado — o objetivo é entender integração frontend/backend na prática, não só entregar um produto pronto. As telas dos dashboards são desenhadas primeiro no Google Stitch (mockups) e depois mapeadas para dados/rotas reais antes de implementar.

## Estrutura real (importante: não é o que parece)

O repositório tem duas pastas que parecem ser "o backend" e "o frontend", mas **só uma delas roda em produção**:

- **`backend/`** — Express + PostgreSQL (porta 3333). Tem controllers, rotas, JWT, bcrypt — parece o backend "de verdade". **Mas o `vercel.json` só builda `frontend/`**, então isso nunca vai para o ar no deploy. Praticamente órfão hoje — nada do frontend chama ele mais.
- **`frontend/src/app/api/*`** — rotas do Next.js (Route Handlers). **É este o backend que realmente roda**, tanto em dev quanto no deploy da Vercel.

**Regra prática:** ao mexer em qualquer funcionalidade, confira se a página realmente chama alguma rota, e se essa rota é do Next.js (`frontend/src/app/api/...`) ou do Express (`backend/src/...`). Não assuma que o Express está "no ar" — na prática, não está.

## Persistência de dados

**Postgres real (Neon) — migração concluída para:** `usuarios`, `ocorrencias`, `encomendas`, `reservas`, `comunicados`, `liberacoes_visita`. Todas essas rotas em `frontend/src/app/api/**` consultam o Postgres através de `frontend/src/lib/store/db.ts` (um `Pool` do pacote `pg`, ancorado em `globalThis`). Senhas de usuários são hasheadas com `bcryptjs`.

**Ainda em memória (não migrado):** `frontend/src/app/api/visitantes/route.ts` — registro manual de visitante feito pelo porteiro (nome, documento, placa, unidade). É um array solto no módulo, nem usa o padrão `globalThis`. Diferente do fluxo de QR Code (ver seção própria abaixo) — são duas coisas relacionadas mas separadas, não confundir.

A connection string mora em `DATABASE_URL`:
- Localmente, em `frontend/.env.local` (gitignored).
- Em produção, no projeto Vercel `sistemacondominio` (ambiente **Production** apenas — configurar também **Preview** esbarrou num erro de `git_branch_required`/`branch_not_found` do Vercel CLI, não resolvido; não afeta produção).

### Duas descobertas importantes de bugs reais (releia antes de criar tabela ou mexer em datas)

1. **Isolamento de módulo por rota do Next.js/Turbopack.** Cada arquivo de rota (`route.ts` e `[id]/route.ts`) é empacotado de forma isolada — um `export const` comum gerava **uma cópia diferente por rota**, mesmo importando o mesmo caminho de arquivo (um PATCH em `/api/x/[id]` não era visto pelo GET em `/api/x`). Corrigido ancorando em `globalThis` (mesmo truque que o Next.js recomenda pra evitar múltiplas instâncias do Prisma em dev). Isso é ortogonal ao uso do Postgres — é por isso que `db.ts` (o `Pool` de conexão) *também* usa `globalThis`, não só as antigas stores em memória.

2. **`TIMESTAMP` sem fuso horário é ambíguo — use `TIMESTAMPTZ` sempre que for comparar datas em JavaScript.** Descoberto ao implementar a expiração do QR Code: uma coluna `TIMESTAMP` guarda só "os números do relógio", sem dizer em que fuso. Quando o `pg` lê esse valor de volta pro JS, ele assume o fuso horário **local do processo Node**, que pode não bater com o fuso que o Postgres usou pra gravar — isso fez um código de QR **já expirado passar como válido** (bug real, encontrado e corrigido nesta sessão). Todas as colunas `criado_em TIMESTAMP` das tabelas antigas (`usuarios`, `ocorrencias`, etc.) usam só `TO_CHAR(...)` pra formatar em texto dentro do próprio SQL — nunca são comparadas em JS, então o bug não se manifestou nelas. Mas **qualquer coluna nova que precise ser comparada contra "agora" em código JavaScript deve ser `TIMESTAMPTZ`**, não `TIMESTAMP`. `liberacoes_visita.expira_em` já foi corrigida para `TIMESTAMPTZ`.

### Sobre o Postgres local (`condominiodb`, na máquina do usuário)

Existe um Postgres instalado localmente (serviço Windows `postgresql-x64-18`, porta 5432) com um banco `condominiodb`, um usuário dedicado `condomanage_app` (privilégio só nesse banco, não superusuário). **Ele não é mais o banco em uso** — o `DATABASE_URL` atual aponta pro Neon. Ficou como ambiente de estudo isolado, não sincronizado com o Neon. **Cuidado:** o usuário tem uma extensão de banco de dados no VS Code que às vezes aponta pra esse Postgres local por engano em vez do Neon — se for pedir pra rodar um `CREATE TABLE`/`ALTER TABLE`, confirme que caiu no banco certo (o Neon é quem alimenta o app de verdade, local e em produção).

## Autenticação — real, implementada nesta sessão (2026-07-12)

Login e proteção de rotas **não são mais cosméticos**. Como funciona:

- **Login** (`frontend/src/app/api/auth/login/route.ts`): busca o usuário por email no Postgres, confere a senha com `bcrypt.compare` contra `senha_hash`. Sem atalhos hardcoded (removidos do `frontend/src/app/login/page.tsx` também).
- **Sessão**: um JWT (`jsonwebtoken`) assinado com `JWT_SECRET` (mesma lógica de `.env.local`/Vercel do `DATABASE_URL`), guardado num cookie **`sessao`**, marcado `httpOnly` (JavaScript da página não consegue ler/roubar) e `secure` em produção (só trafega em HTTPS).
- **`frontend/src/proxy.ts`** — o "porteiro" que barra acesso às páginas sem sessão válida, redirecionando pra `/login`. **Atenção ao nome do arquivo**: nessa versão do Next.js (16.x), a convenção antiga `middleware.ts` foi **renomeada para `proxy.ts`** (função exportada também precisa se chamar `proxy`, não `middleware`) — usar o nome antigo faz o Next.js ignorar o arquivo silenciosamente (página fica em branco, sem erro claro). Ver `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` se precisar mexer nisso de novo. Bônus dessa versão: Proxy roda em runtime Node.js por padrão (não no "Edge Runtime" restrito), então não precisa de biblioteca alternativa tipo `jose` — só `jsonwebtoken` mesmo, em todo lugar.
- **Logout** (`frontend/src/app/api/auth/logout/route.ts`): limpa o cookie. Ligado ao botão "Sair do Sistema" do `Sidebar.tsx` (antes não fazia nada).

**Limitação conhecida, não resolvida ainda:** o `matcher` do `proxy.ts` protege as **páginas** (`/`, `/reservas`, `/ocorrencias`, `/area-morador`, `/portaria`, `/usuarios`), mas **não** as rotas de API (`/api/...`) diretamente — hoje ainda é possível chamar `/api/usuarios` ou qualquer outra rota por fora, sem sessão, e ela responde normalmente. Se for endurecer a segurança, esse é o próximo passo óbvio.

`backend/src/middlewares/authMiddleware.js` (Express) continua irrelevante — não roda em produção.

## QR Code de liberação de visitantes — implementado nesta sessão (2026-07-12)

Fluxo: o morador gera um QR Code (validade 24h) na Área do Morador; o porteiro escaneia com a câmera na tela de Portaria pra liberar o acesso.

- **Tabela `liberacoes_visita`** (Neon): `codigo` (único, curto, ex. `IX8SR45N`), `nome_visitante`, `unidade`, `morador`, `status` (`PENDENTE`/`USADO`), `expira_em` (`TIMESTAMPTZ` — ver bug acima), `criado_em`.
- **`POST /api/condominio/visitas`** — gera um código aleatório novo com validade de 24h.
- **`POST /api/condominio/visitas/validar`** — recebe o código lido, confere: não existe (404), já usado (409), expirado (410), ou válido (200, marca como `USADO`).
- **Gerar a imagem do QR**: biblioteca `qrcode`, função `QRCode.toDataURL(codigo)` chamada no cliente (`area-morador/page.tsx`), renderiza um PNG em base64 direto num `<img>`.
- **Ler via câmera**: biblioteca `html5-qrcode`, componente `Html5QrcodeScanner` montado numa `<div id="leitor-qr">` (`portaria/page.tsx`). Ele mesmo cuida da permissão de câmera e da interface de escaneamento.
- Essa tabela/fluxo é **separado** da tabela/rota antiga `visitantes` (registro manual pelo porteiro, sem QR, ainda em memória — ver seção de Persistência acima).

**O que foi testado e o que não foi:**
- ✅ Geração do código, validação com sucesso, rejeição de código reusado, rejeição de código expirado, rejeição de código inexistente — todos testados via chamada direta à API (`curl`/`fetch`), confirmados no banco.
- ✅ Geração do QR Code de verdade (imagem) testada visualmente no navegador.
- ✅ O leitor de câmera carrega sem erro e mostra a tela de permissão de câmera corretamente.
- ❌ **Não testado**: apontar uma câmera de verdade pra um QR Code gerado e confirmar que o fluxo completo (escanear → validar → liberar) funciona ponta a ponta. O ambiente onde isso foi construído não tem hardware de câmera nem consegue fazer upload de arquivo de imagem pra testar via automação. **Isso precisa ser testado num dispositivo real (celular/notebook com câmera) antes de considerar essa funcionalidade 100% pronta.**

## Plano em fases (histórico)

- **Item 1 — concluído**: ligar peças que já existiam mas estavam desconectadas na camada Next.js (bug de split-brain em ocorrências, rotas de encomendas, DELETE de usuários, conflito de rota em `/`, KPIs do síndico).
- **Item 2 — concluído**: migrar toda a persistência principal pro Postgres real (Neon) — `usuarios`, `ocorrencias`, `reservas`, `comunicados`, `encomendas`. Deploy testado ponta a ponta em produção.
- **Item 3 — concluído**: autenticação real (JWT + cookie httpOnly + proxy.ts). Ver seção própria acima.
- **Item 4 — concluído (exceto teste de câmera real)**: QR Code de liberação de visitantes. Ver seção própria acima.

**Pendências restantes** (ver também `demandas.md` para a lista completa e o histórico do que o usuário pediu originalmente):
1. Testar o leitor de QR Code com câmera real (bloqueador do item 4 acima)
2. Enquetes (mural do síndico) — não existe, só mockup
3. Financeiro do morador / 2ª via de boleto — não existe, do zero
4. Botão de Pânico (portaria) — não existe
5. Livro de Turno da portaria (diferente do livro de ocorrências do síndico) — não existe
6. Migrar `/api/visitantes` (registro manual) pro Postgres — ainda em memória
7. Proteger as rotas de API diretamente no `proxy.ts` (hoje só as páginas são protegidas — ver limitação na seção de Autenticação)
8. Notificação por e-mail e WhatsApp — não existe
9. Aplicação PWA para celular — não existe
10. Resolver `DATABASE_URL` no ambiente Preview da Vercel (hoje só está em Production)

## Como rodar localmente

```bash
cd frontend
npm install
npm run dev   # http://localhost:3001
```

O `backend/` (Express) também pode rodar (`cd backend && npm run dev`, porta 3333), mas hoje isso é praticamente órfão — só use se for reativar/migrar alguma lógica de lá para o Next.js.

## Deploy em produção

- URL: **https://sistemacondominio-nine.vercel.app**
- Projeto Vercel: `sistemacondominio`, na conta `acrush14` / escopo `andersoncrushlink-7788s-projects`. Deploy automático a cada push em `main` (integração com GitHub).
- `frontend/` está "linkado" ao projeto via Vercel CLI (`vercel link`), o que criou `frontend/.vercel/` (gitignored automaticamente pelo próprio CLI).
- Variáveis de ambiente configuradas via `vercel env add` (não pelo dashboard): `DATABASE_URL` e `JWT_SECRET`, ambas só no ambiente **Production** (`vercel env ls` pra conferir). O CLI já está autenticado nessa máquina.
- Aviso de depreciação nos logs do `pg`/`pg-connection-string` sobre `sslmode` (`prefer`/`require`/`verify-ca` virando aliases): não quebra nada hoje, mas uma versão futura da lib vai exigir `sslmode=verify-full` explícito ou `uselibpqcompat=true`. Não tratado ainda.

## Prints das telas

Capturados com Playwright (instalado temporariamente, script descartado depois — se precisar gerar novos, reinstale com `npm install -D playwright && npx playwright install chromium`, capture, e desinstale de novo antes de commitar, para não quebrar o build da Vercel). Ficam em `docs/screenshots/`.
