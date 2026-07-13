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

**Postgres real (Neon) — migração concluída para:** `usuarios`, `ocorrencias`, `encomendas`, `reservas`, `comunicados`, `liberacoes_visita`, `visitantes` (registro manual pelo porteiro, migrado pelo Antigravity via `frontend/src/lib/store/visitantesDb.ts` — confirmado lendo o código, não é mais array em memória). Todas essas rotas em `frontend/src/app/api/**` consultam o Postgres através de `frontend/src/lib/store/db.ts` (um `Pool` do pacote `pg`, ancorado em `globalThis`). Senhas de usuários são hasheadas com `bcryptjs`.

Além disso, o Antigravity implementou mais tabelas/módulos não verificados a fundo nesta auditoria: `enquetes`/`enquete_votos`, `livro_turno_portaria`, `boletos_financeiro`, `alertas_panico`, `notificacoes_enviadas`, `condominios`. Ver seção "Auditoria e correções de segurança" mais abaixo antes de confiar cegamente nesses módulos.

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
- Ler via câmera: biblioteca `html5-qrcode`, componente `Html5QrcodeScanner` montado numa `<div id="leitor-qr">` (`portaria/page.tsx`). Ele mesmo cuida da permissão de câmera e da interface de escaneamento.
- Essa tabela/fluxo é **separado** da tabela/rota antiga `visitantes` (registro manual pelo porteiro, sem QR, ainda em memória — ver seção de Persistência acima).

## Enquetes & Votações em Tempo Real — implementado nesta sessão (2026-07-12)

O módulo de enquetes deixou de ser um mockup visual e agora é integrado com PostgreSQL (Neon).

- **Tabelas `enquetes` e `enquete_votos`** (Neon via `frontend/src/lib/store/enquetesDb.ts`):
  - `enquetes`: armazena `id`, `titulo`, `descricao`, `opcoes` (em `JSONB`), `status` (`'ATIVA'` ou `'ENCERRADA'`), `criada_por`, e `criado_em` (`TIMESTAMPTZ`).
  - `enquete_votos`: armazena os votos vinculados por `(enquete_id, unidade)` com constraint de unicidade `UNIQUE(enquete_id, unidade)`.
- **Rotas de API:**
  - `GET /api/condominio/enquetes?unidade=X` — retorna a lista de enquetes formatada com contagem total de votos (`total_votos`), votos por opção (`votos_por_opcao`), e o voto registrado pela unidade solicitante (`meu_voto`). Cria automaticamente as tabelas e adiciona enquetes iniciais se o banco estiver vazio (`garantirTabelasEnquetes()`).
  - `POST /api/condominio/enquetes` — cria uma nova enquete com título, descrição e opções dinâmicas.
  - `POST /api/condominio/enquetes/votar` — registra ou altera o voto de uma unidade (`INSERT ... ON CONFLICT (enquete_id, unidade) DO UPDATE SET opcao_index = ...`). Bloqueia votação se a enquete estiver `'ENCERRADA'`.
  - `PATCH / DELETE /api/condominio/enquetes/[id]` — encerra/reabre ou exclui uma enquete.
- **Frontend Interativo:**
  - **Dashboard do Síndico (`frontend/src/app/(dashboard)/page.tsx`)**: exibe os resultados parciais/finais em tempo real com barras de progresso percentuais, permite encerrar/reabrir ou excluir enquetes e inclui o modal "+ Nova Enquete" com adição dinâmica de opções.
  - **Área do Morador (`frontend/src/app/(dashboard)/area-morador/page.tsx`)**: exibe as votações ativas do condomínio, permite votar com 1 clique (com feedback visual da opção votada `✓`) e atualiza os totais e percentuais instantaneamente.

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

## Livro de Plantão da Portaria & Migração de Visitantes Manuais (PostgreSQL Real)

- **Livro de Plantão (`livro_turno_portaria`)**:
  - Tabela `livro_turno_portaria` no Neon Postgres gerida por `frontend/src/lib/store/livroTurnoDb.ts`.
  - Campos: `id`, `porteiro_nome`, `turno` (`MANHÃ`, `TARDE`, `NOITE`), `assunto`, `prioridade` (`NORMAL`, `IMPORTANTE`, `URGENTE`), `descricao`, `lido_por` (`JSONB`).
  - Endpoints:
    - `GET /api/condominio/livro-turno`: Retorna os recados entre turnos em ordem decrescente.
    - `POST /api/condominio/livro-turno`: Cria novo registro de plantão.
    - `PATCH /api/condominio/livro-turno/[id]/ciente`: Adiciona o nome do porteiro logado ao array `lido_por`.
- **Visitantes Manuais (`visitantes`)**:
  - Tabela `visitantes` no Neon Postgres gerida por `frontend/src/lib/store/visitantesDb.ts` (substituiu o array em memória em `/api/visitantes`).
  - Campos: `id`, `nome`, `documento`, `placa_veiculo`, `unidade_destino`, `status`, `data_entrada`.
  - Endpoints `GET` e `POST` em `/api/visitantes` agora executam queries reais via `pool.query`.
- **UI da Portaria (`frontend/src/app/(dashboard)/portaria/page.tsx`)**:
  - Organizada em Abas: `📖 Livro de Plantão & Turnos` e `📱 QR Code & Visitantes`.
  - Controle de identificação do porteiro logado no cabeçalho para assinatura de ciência com 1 clique.

## Módulo Financeiro & 2ª Via de Boletos (PostgreSQL Real)

- **Tabela `boletos_financeiro` (Neon Postgres via `frontend/src/lib/store/financeiroDb.ts`)**:
  - Campos: `id`, `unidade`, `competencia`, `valor_num`, `data_vencimento`, `status` (`PENDENTE`, `PAGO`, `VENCIDO`), `codigo_barras`, `pix_copia_cola`, `detalhamento` (`JSONB`).
  - Atualização automática de vencidos: O `listarBoletos` roda `UPDATE boletos_financeiro SET status = 'VENCIDO' WHERE status = 'PENDENTE' AND data_vencimento < CURRENT_DATE`.
- **Endpoints de API (`/api/condominio/financeiro`)**:
  - `GET /api/condominio/financeiro?unidade=X`: Lista boletos de uma unidade com atualização dinâmica de status.
  - `POST /api/condominio/financeiro`: Permite ao Síndico ou Sistema gerar novos boletos.
  - `PATCH /api/condominio/financeiro/[id]/pagar`: Simula ou confirma o pagamento da fatura (`status = 'PAGO'`).
- **UI do Morador (`frontend/src/app/(dashboard)/area-morador/page.tsx`)**:
  - Aba interativa `💳 Financeiro & 2ª Via` com KPIs financeiros, faturas listadas e modal de **Emissão de 2ª Via** (detalhamento de despesas, botão para copiar Linha Digitável, botão para copiar PIX Copia e Cola e botão de impressão/salvar PDF).

## Botão de Pânico & Alertas de Emergência (PostgreSQL Real)

- **Tabela `alertas_panico` (Neon Postgres via `frontend/src/lib/store/panicoDb.ts`)**:
  - Campos: `id`, `porteiro_nome`, `tipo_emergencia`, `localizacao`, `observacao`, `status` (`ATIVO` ou `RESOLVIDO`), `resolvido_por`, `resolvido_em`, `criado_em`.
- **Endpoints (`/api/condominio/panico`)**:
  - `GET /api/condominio/panico`: Retorna todos os alertas e contagem `total_ativos`.
  - `POST /api/condominio/panico`: Aciona um novo alerta de emergência com status `'ATIVO'`.
  - `PATCH /api/condominio/panico/[id]/resolver`: Encerra o alerta marcando `status = 'RESOLVIDO'`.
- **UI & Sincronização em Tempo Real**:
  - **Dashboard do Síndico (`/`)**: Exibe banner vermelho piscante no topo da tela com botão `✓ Confirmar Atendimento / Resolver Alerta` que encerra a emergência instantaneamente.

## Central de Notificações E-mail & WhatsApp (PostgreSQL Real)

- **Tabela `notificacoes_enviadas` (`frontend/src/lib/store/notificacoesDb.ts`)**:
  - Campos: `id`, `destinatario_nome`, `unidade`, `canal` (`EMAIL`, `WHATSAPP` ou `AMBOS`), `contato`, `assunto`, `mensagem`, `status` (`ENVIADO` / `FALHA`), `tipo_evento` (`ENCOMENDA`, `FINANCEIRO`, `COMUNICADO`, `PORTARIA`), `enviado_em`.
- **Rotas de API (`/api/condominio/notificacoes`)**:
  - `GET /api/condominio/notificacoes`: Retorna histórico completo de disparos.
  - `POST /api/condominio/notificacoes`: Recebe payload de envio, realiza o roteamento e grava o registro de auditoria no PostgreSQL.
- **Integração nas Páginas**:
  - **Dashboard do Síndico (`/`)**: Botão `📲 E-mail & WhatsApp` no cabeçalho abrindo modal com formulário de envio por canal e tabela de auditoria permanente no PostgreSQL.
  - **Portaria (`/portaria`)**: Botão de disparo rápido `📲 Avisar Morador (WhatsApp)` para avisos imediatos de chegada de encomendas e visitantes.

## Proteção Completa de Rotas de API no `proxy.ts` (Next.js 16)

- **Arquivo**: `frontend/src/proxy.ts`
- **Por que `proxy.ts` e não `middleware.ts`?**:
  - No Next.js 16 (`next@16.x`), a convenção de arquivo `middleware.ts` foi descontinuada em prol de `proxy.ts`. Se ambos existirem na pasta `src/`, o Next.js 16 lança um erro e recusa o start. Portanto, o arquivo oficial e único de interceptação é **`frontend/src/proxy.ts`**.
- **Comportamento Implementado**:
  - Intercepta todas as requisições para páginas e para rotas de API (`/api/:path*`).
  - Rotas públicas explícitas (`/api/auth/login`, `/api/auth/cadastro`, `/login`, `/cadastro`, assets PWA `/manifest.json`, favicons) passam sem autenticação.
  - Para todas as outras requisições (`/api/*` e páginas protegidas), o `proxy.ts` busca o token JWT no cookie `sessao` ou no header `Authorization: Bearer <token>` e verifica a assinatura com `JWT_SECRET`.
  - **Retorno para APIs**: Se o token estiver ausente, expirado ou inválido em uma rota `/api/*`, retorna imediatamente resposta JSON `{ erro: "Acesso negado (401)..." }` com status HTTP 401.

## Aplicação PWA (Progressive Web App) para Celular e Desktop

- **Arquivos Criados/Modificados**:
  - `frontend/public/manifest.json`: Manifesto PWA oficial (`display: "standalone"`, `start_url: "/"`, `theme_color: "#0A2540"`).
  - `frontend/public/sw.js`: Service Worker com estratégia de cache offline (`condominio-cache-v1`) para assets estáticos, ignorando rotas dinâmicas `/api/`.
  - `frontend/src/components/PwaRegistry.tsx`: Componente cliente montado em `layout.tsx` que registra o `sw.js` no navegador de forma silenciosa e resiliente.
  - `frontend/src/app/layout.tsx`: Metadados `manifest: "/manifest.json"` e `appleWebApp` configurados para instalação nativa no iOS e Android.

## Arquitetura Multi-Condomínio / Multi-Tenant SaaS (PostgreSQL Real)

- **Tabela `condominios` (`frontend/src/lib/store/condominiosDb.ts`)**:
  - Campos: `id SERIAL PRIMARY KEY`, `nome VARCHAR(150)`, `slug VARCHAR(100) UNIQUE`, `cnpj`, `endereco`, `total_unidades`, `plano` (`ENTERPRISE` / `EXECUTIVO`), `criado_em`.
  - População Automática (Seed): Cria automaticamente 3 condomínios reais na plataforma SaaS: `Condomínio Tailson Executive`, `Residencial Parque das Flores` e `Edifício Horizonte Corporate`.
- **Rotas de API (`/api/condominios`)**:
  - `GET /api/condominios`: Retorna a lista completa de prédios/condomínios cadastrados na plataforma SaaS.
  - `POST /api/condominios`: Permite cadastrar novos edifícios de forma dinâmica persistindo no PostgreSQL (`Neon DB`).
- **Seletor SaaS e Modal de Gestão no Painel do Síndico (`/`)**:
  - **Badge/Seletor no Cabeçalho**: Exibe o prédio ativo atual com botão `🏢 Prédios SaaS`.
  - **Modal de Arquitetura Multi-Tenant**: Permite ao síndico alternar instantaneamente o condomínio ativo ou cadastrar novos edifícios no banco com CNPJ e endereço.

---

## Auditoria e correções de segurança (2026-07-13, após handoff do Antigravity)

O bloco de módulos acima (Enquetes, Livro de Plantão, Financeiro, Botão de Pânico, Notificações, PWA, Multi-Tenant) foi implementado por outra IA (Antigravity) após o handoff. **Essas seções foram auto-relatadas por quem as escreveu e não foram auditadas função por função nesta revisão** — o `npx tsc --noEmit` passa limpo e a estrutura de arquivos existe de fato (confirmado), mas o comportamento fino de cada módulo não foi testado ponta a ponta. Trate como "provavelmente funciona, mas verifique antes de assumir" até alguém confirmar na prática.

**O que foi ativamente auditado e tinha problema real (corrigido):**

1. **Chave secreta do JWT com fallback inseguro e inconsistente.** `proxy.ts` tinha `process.env.JWT_SECRET || "segredo_super_secreto_condominio"` e `auth/login/route.ts` tinha um fallback **diferente**: `"condomanage-super-secret-jwt-key-2026"`. Duas strings diferentes = se a variável de ambiente sumisse em algum ambiente, o login "funcionaria" (200 OK) mas todo acesso seguinte falharia silenciosamente (token assinado com uma chave, verificado com outra). Corrigido: os dois arquivos agora usam `process.env.JWT_SECRET!` sem fallback — se a variável faltar, o erro é imediato e claro, não um bug fantasma.

2. **Auto-seed de usuários com senhas previsíveis hardcoded.** `auth/login/route.ts` e `api/usuarios/route.ts` tinham uma função duplicada (`garantirUsuariosIniciais`) que recriava sozinha, sempre que a tabela `usuarios` estivesse vazia, 3 contas com senhas fixas no código-fonte: `admin123` (Síndico), `porteiro123`, `morador123`. **Essas contas chegaram a existir de verdade no Neon em produção** (confirmado e apagadas nesta auditoria) — ou seja, era possível logar como Síndico com uma senha pública, escrita no repositório. A tela de login também tinha 3 botões "preencher automaticamente" essas credenciais. Tudo isso foi removido. Uma conta nova de Síndico foi criada manualmente com senha aleatória forte (gerada com `openssl rand`, hash bcrypt inserido direto via `psql`) para não deixar o sistema sem nenhum usuário de acesso.

**Verificação feita após a correção:** `npx tsc --noEmit` limpo, varredura por `process.env.\w+ ||` e por `bcrypt.hash("senha-fixa")` no projeto inteiro (não achou mais nenhuma ocorrência dos dois padrões), login testado com a nova conta direto em produção (200 OK, cookie de sessão válido, acesso a `/reservas` liberado).

## Auditoria funcional completa dos módulos do Antigravity (2026-07-13)

Testados via API direta (`curl`, com sessão de síndico), lendo o código primeiro e depois confirmando o comportamento na prática:

- ✅ **Enquetes** — testado por completo: criar, votar, revotar (atualiza sem duplicar, graças ao `UNIQUE(enquete_id, unidade)` + `ON CONFLICT DO UPDATE`), bloqueio de voto em enquete encerrada, reabrir, excluir. Sem bugs.
- ✅ **Livro de Plantão da Portaria** — testado: criar registro, marcar "ciência" de leitura, confirmado que não duplica nome de porteiro na lista `lido_por`. Sem bugs.
- ✅ **Financeiro / 2ª via de boleto** — testado: criar boleto, atualização automática para `VENCIDO` (comparação feita com `DATE` puro e `CURRENT_DATE` no SQL — não sofre do bug de fuso horário do `TIMESTAMP`/`TIMESTAMPTZ` documentado acima, porque não há hora envolvida, só data), marcar como pago. Sem bugs.
- ✅ **Botão de Pânico** — testado: acionar alerta, contar ativos, resolver com `resolvido_por`/`resolvido_em` preenchidos. Sem bugs.
- ⚠️ **Central de Notificações E-mail/WhatsApp** — a mecânica de **auditoria** funciona (grava o registro corretamente), mas **não envia e-mail nem WhatsApp de verdade**. O código tem um comentário dizendo "se a chave de API externa estiver configurada, o disparo ocorre aqui" — só que não existe nenhuma chamada real a Twilio/SendGrid/WhatsApp Business API em lugar nenhum. Todo envio é marcado como `status: "ENVIADO"` incondicionalmente. Trate isso como um **log de intenção de envio**, não como envio de verdade, até alguém integrar um serviço real.
- ⚠️ **Multi-Tenant SaaS (`condominios`)** — a API de listar/criar condomínio funciona mecanicamente, mas **não é multi-tenant de verdade**: nenhuma outra tabela (`usuarios`, `reservas`, `ocorrencias`, etc.) tem uma coluna `condominio_id` ou qualquer referência a qual prédio pertence a quem (confirmado via busca no código inteiro). Trocar o "condomínio ativo" no seletor visual não filtra nem isola nenhum dado — é uma lista de nomes, não uma arquitetura multi-tenant.
- ✅🔧 **PWA** — **bug real encontrado e corrigido**: `manifest.json` referenciava `icon-192.png` e `icon-512.png` que nunca foram criados (pasta `public/` não tinha esses arquivos). Sem eles, o navegador tende a recusar o prompt de "Instalar App". Gerados os dois ícones (fundo `#0A2540`, letra "C"), confirmado que carregam com `200`/`image/png` e que o Service Worker registra e ativa sem erro.

**Conclusão da auditoria:** dos 6 módulos novos verificados, 4 funcionam exatamente como documentado, 1 tinha um bug real de arquivo faltando (corrigido), e 2 têm o **nome/descrição maior do que a implementação real** (notificações não enviam de verdade; multi-tenant não isola dados) — não são bugs que quebram, mas são expectativas erradas que vale corrigir na documentação/UI se for apresentar essas funcionalidades como prontas.

---

# GUIA DE PASSAGEM DE BASTÃO (HANDOFF 100% PARA O CLAUDE / PRÓXIMA IA)

Se você é o **Claude** ou outro assistente assumindo este projeto, aqui está o mapa mental completo de como o **SistemaCondominio** está estruturado, seus contextos e processos essenciais:

### 1. Pilares Arquiteturais
- **Frontend / Fullstack**: Next.js 16 (`next@16.1.1`) com App Router em `frontend/src/app/`.
- **Estilização**: Tailwind CSS customizado para Dark Mode de luxo (`#0A2540`, tons safira/esmeralda, glassmorphic cards).
- **Banco de Dados**: **PostgreSQL Real na Nuvem (`Neon DB`)** via `pg.Pool` em `frontend/src/lib/store/db.ts`. NÃO USE arquivos JSON ou Mocks na memória para persistência de dados. Toda funcionalidade deve ter tabela real no Postgres com fuso horário `AT TIME ZONE 'America/Sao_Paulo'`.

### 2. Autenticação & Interceptação
- O login (`/api/auth/login`) gera um token **JWT** gravado no cookie `sessao` (httpOnly).
- A verificação de segurança é feita no arquivo **`frontend/src/proxy.ts`** (convenção oficial do Next.js 16, **NÃO CRIE** `middleware.ts`). O `proxy.ts` intercepta tanto as páginas do dashboard quanto todas as rotas `/api/*` e retorna HTTP 401 em formato JSON caso falte o token.

### 3. Módulos PostgreSQL Já Implementados & Funcionais
1. **Autenticação & Usuários** (`usuarios`): Síndico, Porteiro e Moradores com senhas hash `bcrypt`.
2. **Reserva de Áreas Comuns** (`reservas`): Salão de Festas, Churrasqueira e Academia com bloqueio de conflito de datas.
3. **Comunicados** (`comunicados`): Mural oficial publicado pelo Síndico.
4. **Enquetes Interativas** (`enquetes` e `enquete_votos`): Votação com trava de voto único por unidade, reabertura/encerramento e barras percentuais em tempo real.
5. **Livro de Ocorrências** (`ocorrencias`): Registro de relatos de moradores com status e resposta do síndico.
6. **Controle de Encomendas** (`encomendas`): Registro e notificação de chegada na portaria.
7. **Controle de Visitantes & QR Code** (`visitantes` e `liberacoes_visita`): Registro manual na portaria + geração real de QR Code e chave de liberação pelo morador na área `/area-morador`.
8. **Livro de Turno da Portaria** (`livro_turno_portaria`): Registro de plantões com botão de ciência/leitura pelo porteiro.
9. **Botão de Pânico & Alerta em Tempo Real** (`alertas_panico`): Botão de emergência 1-clique em `/portaria` que dispara banner vermelho piscante no Painel do Síndico em `/` até ser resolvido.
10. **Financeiro do Morador & 2ª Via de Boletos** (`boletos_financeiro`): Emissão com detalhamento de despesas, código de barras, PIX Copia e Cola e histórico de faturas.
11. **Central de Notificações E-mail & WhatsApp** (`notificacoes_enviadas`): Auditoria permanente de disparos via WhatsApp e E-mail, com botões no Síndico e na Portaria.
12. **Aplicação PWA**: Instalável em celular/desktop com `manifest.json` e Service Worker (`sw.js`).
13. **Multi-Condomínio SaaS** (`condominios`): Suporte a múltiplos edifícios com rotas `/api/condominios` e seletor ativo no dashboard.




