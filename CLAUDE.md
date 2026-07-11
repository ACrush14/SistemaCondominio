# Contexto do Projeto — CondoManage (SistemaCondominio)

Este arquivo existe para dar contexto rápido a quem (humano ou IA) for continuar o desenvolvimento. Ele documenta decisões e descobertas que não são óbvias só de ler o código.

## O que é o projeto

Sistema de gestão de condomínios com três perfis de dashboard (Síndico, Porteiro, Morador) e um assistente de IA ("Mania") para agendamento de reservas por linguagem natural. É um projeto de aprendizado — o objetivo é entender integração frontend/backend na prática, não só entregar um produto pronto. As telas dos dashboards são desenhadas primeiro no Google Stitch (mockups) e depois mapeadas para dados/rotas reais antes de implementar.

## Estrutura real (importante: não é o que parece)

O repositório tem duas pastas que parecem ser "o backend" e "o frontend", mas **só uma delas roda em produção**:

- **`backend/`** — Express + PostgreSQL (porta 3333). Tem controllers, rotas, JWT, bcrypt — parece o backend "de verdade". **Mas o `vercel.json` só builda `frontend/`**, então isso nunca vai para o ar no deploy. Hoje é usado por, no máximo, uma ou duas chamadas soltas do frontend (ex.: assistente de IA do síndico) que apontam pra `http://localhost:3333` — ou seja, quebradas em produção.
- **`frontend/src/app/api/*`** — rotas do Next.js (Route Handlers). **É este o backend que realmente roda**, tanto em dev quanto no deploy da Vercel.

**Regra prática:** ao mexer em qualquer funcionalidade, confira se a página realmente chama alguma rota, e se essa rota é do Next.js (`frontend/src/app/api/...`) ou do Express (`backend/src/...`). Não assuma que o Express está "no ar" — na prática, não está.

## Persistência de dados (migração em andamento — 2026-07-11)

**Usuários/Moradores já é Postgres de verdade.** `frontend/src/app/api/usuarios/route.ts` e `[id]/route.ts` consultam um Postgres gerenciado no [Neon](https://neon.tech) através de `frontend/src/lib/store/db.ts` (um `Pool` do pacote `pg`, ancorado em `globalThis` pelo mesmo motivo abaixo). Senhas são hasheadas com `bcryptjs` antes de gravar. A connection string mora em `DATABASE_URL`:
- Localmente, em `frontend/.env.local` (gitignored).
- Em produção, configurada no projeto Vercel `sistemacondominio` (ambiente **Production** apenas — a tentativa de configurar também o ambiente **Preview** esbarrou num erro de `git_branch_required`/`branch_not_found` do Vercel CLI, não resolvido ainda; não afeta o site de produção).

**Ocorrências e Encomendas ainda são arrays em memória**, em `frontend/src/lib/store/{ocorrencias,encomendas}.ts`. Mesmo esquema de tabelas já existe tanto no Neon quanto num Postgres local (ver abaixo) — falta só reescrever as rotas, no mesmo molde do que foi feito para `usuarios`.

Descoberta importante (vale para qualquer rota que ainda use array em memória, e foi o motivo do `db.ts` também usar `globalThis`): o Next.js (com Turbopack) empacota cada arquivo de rota (`route.ts` e `[id]/route.ts`) de forma isolada — um `export const` comum nesses arquivos gerava **uma cópia diferente por rota**, mesmo importando o mesmo caminho de arquivo. Um PATCH em `/api/x/[id]` não era visto pelo GET em `/api/x`. A correção foi ancorar em `globalThis` (mesmo truque que o Next.js recomenda para evitar múltiplas instâncias do Prisma em dev).

**Limitação que ainda vale pra ocorrências/encomendas:** memória de processo, não banco. Reinicia o servidor (ou cold start serverless), os dados voltam ao seed inicial.

### Sobre o Postgres local (`condominiodb`, na sua própria máquina)

Existe um Postgres instalado localmente (serviço Windows `postgresql-x64-18`, porta 5432) com um banco `condominiodb`, um usuário dedicado `condomanage_app` (privilégio só nesse banco, não superusuário) e as mesmas 3 tabelas (`usuarios`, `ocorrencias`, `encomendas`) criadas manualmente via `psql` como exercício de aprendizado. **Ele não é mais o banco em uso** — o `DATABASE_URL` atual aponta pro Neon. Esse Postgres local ficou como um ambiente próprio isolado, sem relação com o que está no ar; útil se algum dia quiser voltar a rodar tudo localmente sem depender de internet, mas não é sincronizado com o Neon.

Detalhe também encontrado e corrigido nesse processo: a tabela `usuarios` desse Postgres local tinha um schema com "drift" — uma coluna `role` (enum, obrigatória) e uma `perfil` (varchar) coexistindo, de alguma versão anterior do projeto que nunca foi limpa. Foi dropada e recriada do zero com o schema correto (o mesmo replicado no Neon).

## Autenticação (estado atual: cosmética, sem proteção real)

- Não existe guard de rota nenhum — qualquer `/reservas`, `/ocorrencias`, etc. é acessível direto pela URL sem login.
- O login tem lógica hardcoded tanto no cliente (`frontend/src/app/login/page.tsx`) quanto na rota `frontend/src/app/api/auth/login/route.ts` — credenciais especiais (`joao@tailson.com`, emails contendo "sindico"/"admin"/"porteiro") são tratadas como casos especiais antes de qualquer verificação real.
- O `backend/src/middlewares/authMiddleware.js` (Express, não usado em produção) também nunca rejeita requisições — na ausência de token válido, injeta um usuário morador fake.

Isso não foi endereçado ainda — é trabalho futuro, não um bug desta sessão.

## Plano em fases (combinado com o usuário)

- **Item 1 — concluído**: ligar peças que já existiam mas estavam desconectadas, dentro da camada Next.js. Isso incluiu:
  - Corrigir um bug de "split-brain" em ocorrências (POST ia para o Express, GET lia do Next.js — nunca se encontravam).
  - Criar rotas de encomendas no Next.js (só existiam mockadas no Express).
  - Corrigir DELETE de moradores/usuários (era um stub sem efeito).
  - Remover `frontend/src/app/page.tsx`, que duplicava o login e vencia um conflito de rota em `/` contra `frontend/src/app/(dashboard)/page.tsx` (Dashboard do Síndico), deixando esse dashboard inacessível.
  - Ligar KPIs do Dashboard do Síndico e o card de encomendas da Área do Morador a dados reais.
- **Item 2 — em andamento**: migrar a persistência para um Postgres de verdade, acessível pelas rotas do Next.js.
  - ✅ Cliente de conexão (`lib/store/db.ts`) e migração de `usuarios` (GET/POST/DELETE) pro Postgres, com senha hasheada.
  - ✅ Banco na nuvem (Neon) criado e configurado como `DATABASE_URL` local e na Vercel (Production).
  - ✅ Deploy testado ponta a ponta: usuário criado pelo site de produção, confirmado direto no banco via `psql`, depois removido.
  - ⏳ Migrar `ocorrencias` e `encomendas` pro mesmo padrão (ainda em memória).
  - ⏳ Resolver o `DATABASE_URL` no ambiente Preview da Vercel (hoje só está em Production).

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
- Variáveis de ambiente do projeto (`DATABASE_URL` etc.) foram configuradas via `vercel env add`, não pelo dashboard — útil saber que o CLI já está autenticado nessa máquina caso precise mexer de novo (`vercel env ls` pra conferir o que já está setado).
- Aviso de depreciação visto nos logs do `pg`/`pg-connection-string` sobre `sslmode` (`prefer`/`require`/`verify-ca` virando aliases): não quebra nada hoje, mas uma versão futura da lib vai exigir `sslmode=verify-full` explícito ou `uselibpqcompat=true`. Não tratado ainda.

## Prints das telas

Capturados com Playwright (instalado temporariamente, script descartado depois — se precisar gerar novos, reinstale com `npm install -D playwright && npx playwright install chromium`, capture, e desinstale de novo antes de commitar, para não quebrar o build da Vercel). Ficam em `docs/screenshots/`.
