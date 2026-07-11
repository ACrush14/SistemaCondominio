# Contexto do Projeto — CondoManage (SistemaCondominio)

Este arquivo existe para dar contexto rápido a quem (humano ou IA) for continuar o desenvolvimento. Ele documenta decisões e descobertas que não são óbvias só de ler o código.

## O que é o projeto

Sistema de gestão de condomínios com três perfis de dashboard (Síndico, Porteiro, Morador) e um assistente de IA ("Mania") para agendamento de reservas por linguagem natural. É um projeto de aprendizado — o objetivo é entender integração frontend/backend na prática, não só entregar um produto pronto. As telas dos dashboards são desenhadas primeiro no Google Stitch (mockups) e depois mapeadas para dados/rotas reais antes de implementar.

## Estrutura real (importante: não é o que parece)

O repositório tem duas pastas que parecem ser "o backend" e "o frontend", mas **só uma delas roda em produção**:

- **`backend/`** — Express + PostgreSQL (porta 3333). Tem controllers, rotas, JWT, bcrypt — parece o backend "de verdade". **Mas o `vercel.json` só builda `frontend/`**, então isso nunca vai para o ar no deploy. Hoje é usado por, no máximo, uma ou duas chamadas soltas do frontend (ex.: assistente de IA do síndico) que apontam pra `http://localhost:3333` — ou seja, quebradas em produção.
- **`frontend/src/app/api/*`** — rotas do Next.js (Route Handlers). **É este o backend que realmente roda**, tanto em dev quanto no deploy da Vercel.

**Regra prática:** ao mexer em qualquer funcionalidade, confira se a página realmente chama alguma rota, e se essa rota é do Next.js (`frontend/src/app/api/...`) ou do Express (`backend/src/...`). Não assuma que o Express está "no ar" — na prática, não está.

## Persistência de dados (estado atual, deliberadamente temporário)

As rotas do Next.js guardam dados em arrays em memória, em `frontend/src/lib/store/{usuarios,ocorrencias,encomendas}.ts`.

Descoberta importante: o Next.js (com Turbopack) empacota cada arquivo de rota (`route.ts` e `[id]/route.ts`) de forma isolada — um `export const` comum nesses arquivos de store gerava **uma cópia diferente do array por rota**, mesmo importando o mesmo caminho de arquivo. Ou seja, um PATCH em `/api/x/[id]` não era visto pelo GET em `/api/x`. A correção foi ancorar os arrays no `globalThis` (mesmo truque usado pelo Next.js para evitar múltiplas instâncias do Prisma em dev — ver os três arquivos em `lib/store/` para o padrão exato).

**Limitação que continua valendo:** isso é memória de processo, não banco de dados. Reinicia o servidor (ou um cold start em serverless na Vercel), os dados voltam ao estado inicial (seed). Essa limitação foi deixada de propósito — ver "Plano em fases" abaixo.

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
- **Item 2 — não iniciado**: migrar a persistência para um Postgres de verdade (ex.: Neon, Supabase), acessível pelas rotas do Next.js — porque é isso que realmente roda no deploy.

## Como rodar localmente

```bash
cd frontend
npm install
npm run dev   # http://localhost:3001
```

O `backend/` (Express) também pode rodar (`cd backend && npm run dev`, porta 3333), mas hoje isso é praticamente órfão — só use se for reativar/migrar alguma lógica de lá para o Next.js.

## Prints das telas

Capturados com Playwright (instalado temporariamente, script descartado depois — se precisar gerar novos, reinstale com `npm install -D playwright && npx playwright install chromium`, capture, e desinstale de novo antes de commitar, para não quebrar o build da Vercel). Ficam em `docs/screenshots/`.
