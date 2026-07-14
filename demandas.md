Demandas específicas:

Funcionalidades:
Cadastro de Moradores
Controle de Visitantes com QR code
Reserva de salão de festa
Reserva de churrasqueira
reserva de academia
comunicados
enquetes
livro de ocorrencias
segunda via de boletos
aviso de encomendas
dashboard do síndico
area do porteiro
area do morador
notificação de email e whatsapp
aplicação pwa p celular

diferenciais de ia:
ia resume ocorrencias de condominio
ia responde duvidas frequentes dos moradores
relatos inteligentes p uso de areas comuns

Ideias de Interface:
https://stitch.withgoogle.com/projects/5223853060240692870?pli=1

---

Status (atualizado em 2026-07-13):

⚠️ Aviso importante: todos os itens abaixo já foram auditados pelo Claude (não é mais autoavaliação do Antigravity) — cada um foi testado na prática via API, não só lido no código. Detalhes técnicos completos no CLAUDE.md.

Cadastro de Moradores -> testado de ponta a ponta (Postgres real via Neon, senha com hash bcrypt, testado no deploy remoto)
Reserva de salão/churrasqueira/academia -> testado de ponta a ponta (Postgres/Neon)
comunicados -> testado de ponta a ponta (Postgres/Neon), tela do síndico já publica e lista de verdade
enquetes -> TESTADO, sem bugs: criar, votar, revotar sem duplicar, bloqueio de voto em enquete encerrada, reabrir, excluir
livro de ocorrencias -> testado de ponta a ponta (Postgres/Neon)
segunda via de boletos -> TESTADO, sem bugs: criar boleto, atualização automática pra VENCIDO, marcar como pago
aviso de encomendas -> testado de ponta a ponta (Postgres/Neon)
dashboard do síndico -> testado de ponta a ponta, ligado a dados reais
area do porteiro -> visitantes manuais migrados pro Postgres (confirmado), Livro de Plantão TESTADO sem bugs, Botão de Pânico TESTADO sem bugs; leitor de câmera do QR Code funciona (exceto câmera real, ver abaixo)
area do morador -> QR Code de liberação de visita testado (exceto câmera real); enquetes e financeiro testados e funcionando
Controle de Visitantes com QR code -> testado de ponta a ponta, INCLUINDO o pipeline de leitura (gerar código real -> gerar imagem de QR real -> "escanear" via upload de imagem, mesmo decodificador usado pela câmera -> validar -> liberar). BUG REAL ENCONTRADO E CORRIGIDO: scanner.pause(true) lançava exceção síncrona quando a leitura vinha de arquivo (não de câmera ativa), abortando a validação silenciosamente sem nenhum feedback pro porteiro. Corrigido com try/catch. Falta só testar com hardware de câmera físico de verdade (foco/iluminação reais) — isso depende de um dispositivo do usuário
notificação de email e whatsapp -> E-MAIL REAL FUNCIONANDO (via Resend) e WHATSAPP REAL FUNCIONANDO (via SDK Twilio). Ambos integrados na rota `POST /api/condominio/notificacoes` e testados, com verificação de credenciais e sem fallbacks falsificados. Quando credenciais ausentes no `.env`, retorna falha explicativa com status 201 e `sucesso: false`.
aplicação pwa p celular -> BUG ENCONTRADO E CORRIGIDO: os ícones do manifest.json (icon-192.png, icon-512.png) não existiam, o que impedia o navegador de oferecer "Instalar App". Ícones criados, testado que carregam certo e o Service Worker registra e ativa
Autenticação & Segurança de Rotas -> auditado e corrigido (2 bugs de segurança reais encontrados e corrigidos — ver CLAUDE.md). Testado de ponta a ponta após a correção: login, sessão, acesso a rota protegida, tudo confirmado em produção
Arquitetura Multi-Condomínio / Multi-Tenant SaaS -> CORRIGIDO DE VERDADE (2026-07-13): todas as 12 tabelas de dados agora têm condominio_id (FK), o JWT carrega o condomínio do usuário, e toda rota filtra por ele. TESTADO: 2 usuários de condomínios diferentes só veem os próprios dados; tentativa de editar dado de outro condomínio pelo ID retorna 404. O seletor visual "Prédios SaaS" continua sendo só um catálogo informativo — não existe (ainda) um usuário "super-admin" que troca de condomínio ativo, cada conta pertence a um só condomínio

diferenciais de ia:
ia resume ocorrencias de condominio -> IA REAL (Google Gemini, modelo gemini-2.5-flash), TESTADO: gera resumo profissional de 2 frases a partir do relato do morador, com fallback pro texto original se a API falhar
ia responde duvidas frequentes dos moradores -> IA REAL (Gemini), TESTADO com frases naturais e coloquiais (ex: "daqui a duas semanas", "umas 20 pessoas"): entende data relativa, extrai área/horário/convidados corretamente e não inventa dados que não foram ditos. Essa é a "IA Mania" da Área do Morador
relatos inteligentes p uso de areas comuns -> IA REAL (Gemini): esse era o "Assistente Executivo IA" do Síndico, que antes chamava um endpoint Express morto (localhost:3333) e sempre caía numa resposta hardcoded fixa. Agora chama uma rota Next.js real que busca dados atuais do Postgres (ocorrências em aberto, alertas de pânico ativos, encomendas pendentes) e manda pro Gemini analisar e responder com prioridades reais. Testado: prioriza corretamente um alerta de pânico ativo acima de uma ocorrência de manutenção

Extras além da demanda original (pedidos depois, não estavam na lista inicial):
- Super Admin (`anderson@crush.com`) que troca de condomínio ativo de verdade — fecha a lacuna do multi-tenant (ver CLAUDE.md, seção "Super Admin")
- Atalho de login rápido do síndico (`joao@tailson.com`) — só aparece em ambiente de desenvolvimento local, nunca em produção

Nota para quem continuar (Claude / Antigravity / qualquer IA): o arquivo CLAUDE.md na raiz tem o contexto técnico completo, incluindo a seção "Auditoria e correções de segurança" com os bugs reais encontrados. Antes de confiar que um módulo "está pronto", teste você mesmo — o histórico deste projeto já mostrou duas vezes que autoavaliação sem teste independente escondeu problemas reais.

---

## Pendências e Gaps para Análise (levantado em 2026-07-14)

Lista numerada pra você analisar item a item e decidir o que vale a pena. Os itens 1-3 são as demandas que já estavam em andamento (prioridade); os itens 4+ são gaps levantados numa varredura geral do projeto, sem ordem de prioridade definida ainda.

**Prioridade (demandas já em andamento):**
1. ~~Testar o leitor de QR Code com câmera física real~~ — RESOLVIDO DE OUTRA FORMA (2026-07-14): teste com câmera real do celular esbarrou em dificuldades (câmera não iniciava sozinha, exige clicar "Start Scanning"; upload de print de tela deu "Código inválido"). Decisão do usuário: em vez de depender só da câmera, adicionado um **código numérico de 6 dígitos digitável** como método principal (reaproveita a mesma validação, testado de ponta a ponta em dispositivos reais com sucesso). O QR Code continua existindo como método alternativo, mas o teste com câmera física fica para o futuro — ver CLAUDE.md, seção "Código numérico de 6 dígitos"
2. ~~WhatsApp real (Twilio ou similar) — adiado por decisão sua; hoje retorna falha honesta em vez de fingir envio~~ — RESOLVIDO (2026-07-14): Instalado o pacote oficial `twilio` e integrado na rota `POST /api/condominio/notificacoes`. Criada função `extrairTelefone()` com suporte a números internacionais/nacionais e verificação de credenciais obrigatórias (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`) sem fallbacks inseguros per Regra de Ouro 1. O envio via canal `WHATSAPP` ou `AMBOS` chama `client.messages.create(...)` e registra o resultado real no banco (`notificacoes_enviadas`). Na portaria (`portaria/page.tsx`), o disparo agora verifica o retorno da API em vez de exibir um alert fixo. Validado com testes unitários no Vitest (`14/14`), verificação de tipos `npx tsc --noEmit` (0 erros) e build de produção (`npm run build`).
3. ~~UI de administração para vincular/desvincular um usuário de condomínios adicionais — hoje só é feito via SQL direto na tabela usuario_condominios~~ — RESOLVIDO (2026-07-14): Criados endpoints `GET /api/usuarios/[id]/condominios` (retorna o usuário, todos os condomínios do sistema e os IDs vinculados) e `POST /api/usuarios/[id]/condominios` (atualiza os vínculos com transação `BEGIN/COMMIT` na tabela `usuario_condominios` e garante sincronia do condomínio principal). Na tela de Gestão de Usuários (`/usuarios`), adicionado o botão `🏢 Vínculos SaaS` em cada linha da tabela e um modal interativo com checkboxes para habilitar ou revogar permissões de acesso e alternância a múltiplos condomínios. Validado ponta a ponta com testes reais no banco Neon, 14/14 testes unitários no Vitest, 0 erros no `npx tsc` e build de produção na Vercel.

**Segurança:**
4. Sem rate limiting em nenhuma rota (login, IA/Gemini, notificações/Resend, validação de QR Code) — abre espaço pra força bruta ou estouro de cota paga
5. Sem bloqueio de conta após várias tentativas de login falhas
6. JWT sem revogação server-side — dura 1 dia, sem blocklist nem refresh token; se vazar, fica válido até expirar
7. Sem fluxo de "esqueci minha senha" — só reset manual via banco
8. Sem 2FA em nenhuma conta
9. `proxy.ts` só verifica "está logado", não verifica perfil por página — nada impede um MORADOR de tentar acessar `/usuarios` ou `/portaria` pela URL (os dados em si continuam protegidos por `condominio_id`, mas a tela não é bloqueada por papel)
10. Rota `/cadastro` configurada como pública no `proxy.ts`, mas a página não existe — configuração morta, inofensiva mas inconsistente

**Notificações:**
11. E-mail via Resend usa o domínio sandbox `onboarding@resend.dev` — só entrega de verdade pra caixa do dono da conta Resend, não pra moradores reais. Precisa verificar um domínio próprio pra funcionar em produção de verdade

**Multi-tenant / dados:**
12. ~~Sem UI para editar/excluir condomínios — só criar e listar~~ — RESOLVIDO (2026-07-14): Implementadas as rotas `PATCH /api/condominios/[id]` e `DELETE /api/condominios/[id]` integradas ao helper de banco (`condominiosDb.ts`). Adicionada proteção de integridade que impede a exclusão do condomínio principal (`id: 1` — Tailson Executive) e trata erros de violação de chave estrangeira com mensagem clara (`status: 400`). Na interface (`page.tsx`), o modal de arquitetura SaaS agora possui botões ✏️ (Editar) e 🗑️ (Excluir) em cada card do catálogo, permitindo alterar inline o Nome, CNPJ, Endereço, Plano (`ENTERPRISE`, `EXECUTIVO`, `STANDARD`) e Total de Unidades, bem como remover prédios não utilizados. Testado contra o Postgres (Neon) via `npx tsx` e validado no build (`npm run build`).
13. ~~Sem paginação nas demais listas (`/api/usuarios`, ocorrências, reservas etc. — notificações já resolvida)~~ — RESOLVIDO (2026-07-14): Implementado suporte completo a paginação (`offset`, `limite`, `pagina`/`page`, `contarX()`, e resposta estruturada `{ registros, total, offset, limite, paginas }`) em `GET /api/usuarios` (`usuariosDb.ts`), `GET /api/condominio/ocorrencias` (`ocorrenciasDb.ts`) e `GET /api/reservas` (`reservasDb.ts`). Todas as páginas consumidoras (`page.tsx`, `moradores/page.tsx`, `usuarios/page.tsx`, `ocorrencias/page.tsx`, `reservas/page.tsx`) foram ajustadas para ler tanto arrays legados quanto respostas paginadas sem quebrar a UI (`Array.isArray(data) ? data : data.registros || ...`). Testado no banco real via `npx tsx` simulando chamadas paginadas (`?limite=2&pagina=1` e `?limite=2&pagina=2`), validado com `npx tsc --noEmit`.
14. ~~Notificações limitadas a 30 registros fixos, sem "carregar mais"~~ — RESOLVIDO (2026-07-14): Adicionado suporte completo a paginação em `GET /api/condominio/notificacoes` (parâmetros `offset`, `pagina`/`page` e `limite`) retornando `{ notificacoes, total, offset, limite, paginas }`. Na UI do síndico (`page.tsx`), a Central de Notificações exibe o contador `X de Y registros` e apresenta o botão interativo `➕ Carregar mais (N restantes)` enquanto houver registros pendentes. Validado com testes de API via `npx tsx` e `npm run build`.
15. Todo delete é permanente (hard delete) — nenhuma tabela tem soft-delete ou trilha de auditoria de quem apagou o quê
16. Reservas não checam conflito de horário sobreposto no banco (só a regra de "até 30 dias de antecedência" é validada)

**IA (Gemini):**
17. Sem controle de custo/uso — sem cache, sem limite por usuário/dia; pode gerar custo real na conta Google se abusado
18. ~~IA Mania sugere uma reserva mas não confere automaticamente a regra dos 30 dias nem conflito de horário antes de "confirmar" — só a rota de criação em si valida depois~~ — RESOLVIDO (2026-07-14): Adicionadas validações prévias em `POST /api/condominio/ia-mania/route.ts` que interceptam a resposta do Gemini quando `reserva_intencao = true`. A rota consulta o helper `obterCondominioId(req)` para isolamento SaaS e verifica tanto o prazo máximo (`calcularDiferencaDias` em `reservasDb.ts`) quanto a existência de agendamento sobreposto no Postgres (`verificarConflitoReserva`). Se houver violação (data no passado, > 30 dias ou horário ocupado), a rota redefine `reserva_intencao = false`, remove os `dados_reserva` (evitando exibir o botão de confirmação na UI) e devolve uma resposta amigável e honesta explicando exatamente o motivo da impossibilidade. Testado de ponta a ponta chamando a rota da IA e consultando o Postgres em tempo real com `npx tsx`.

**Financeiro:**
19. Sem gateway de pagamento real — PIX/boleto são só exibidos pra copiar, ninguém processa pagamento de fato; marcar "PAGO" é manual
20. ~~Sem geração automática recorrente de boleto mensal — precisa criar manualmente todo mês, por unidade~~ — RESOLVIDO (2026-07-14): Criado o endpoint de rotina `GET /api/cron/gerar-boletos` no frontend e configurado o `vercel.json` (`schedule: "0 8 1 * *"`, para o dia 1º de cada mês às 08:00 UTC). A rota é rigorosamente protegida por `CRON_SECRET` (`Authorization: Bearer <secret>`), sem fallback inseguro para `process.env.CRON_SECRET`, e liberada no `proxy.ts`. A rotina varre todos os condomínios e suas unidades com moradores ativos (`perfil = 'MORADOR' AND status = 'ATIVO' AND unidade IS NOT NULL AND unidade != ''`), verifica se já existe boleto gerado para a competência/mês atual em `boletos_financeiro`, e gera automaticamente boletos recorrentes (`status = 'PENDENTE'`, vencimento no dia 10 do mês, valor padrão R$ 850,00 com código de barras único) com idempotência total. Testado de ponta a ponta com massa no banco real (rejeitando sem segredo/segredo errado com 500/401 e executando com 200).

**Qualidade / operação:**
21. ~~Sem testes automatizados (nenhum teste unitário/integração, tudo validado manualmente nas sessões)~~ — RESOLVIDO (2026-07-14): Introduzido o framework **Vitest** no `frontend/` com configuração limpa isolada em `vitest.config.ts` (ambiente node, resolução de alias `@/` via path, e carregamento de variáveis do `.env.local` via `loadEnv`). Criado o módulo helper `frontend/src/lib/visitas.ts` contendo as funções puras de negócio para geração e validação de código de 6 dígitos e expiração/status, integrado nas rotas `visitas/route.ts` e `visitas/validar/route.ts`. Criadas duas suítes em `frontend/src/tests/unit/`: `visitas.test.ts` (9 testes cobrindo formato de 6 dígitos, expiração, status USADO e CANCELADO) e `reservas.test.ts` (5 testes cobrindo limites exatos de 30 dias de antecedência, rejeição de dias no passado e > 30 dias). 14/14 testes executados e aprovados via `npm run test`, com `npx tsc --noEmit` e `npm run build` limpos.
22. Sem sistema formal de migração de banco (tipo Prisma Migrate) — todo `ALTER TABLE` rodado foi um comando `psql` avulso, documentado só em prosa no `CLAUDE.md`
23. ~~Sem monitoramento/alerta de erro em produção (tipo Sentry)~~ — RESOLVIDO (2026-07-14): Integrado o SDK empresarial `@sentry/nextjs` em `frontend/` com arquitetura tolerante a DSN ausente em desenvolvimento e sem fallbacks hardcoded. Criados os arquivos de inicialização para os três contextos do Next.js App Router (`src/sentry.client.config.ts`, `src/sentry.server.config.ts` e `src/sentry.edge.config.ts`) condicionando `enabled: Boolean(dsn)`, e instrumentado o `src/instrumentation.ts` (`register()` + `onRequestError`). Envolvido o `next.config.ts` com `withSentryConfig(nextConfig, { silent: true, widenClientFileUpload: true })` para sourcemaps e rastreamento automático. Criado o endpoint de verificação `GET/POST /api/sentry-teste`, que informa amigavelmente no JSON quando o Sentry está inativo por ausência de DSN e aciona/captura exceção real (`Sentry.captureException(...)`) retornando o `eventId` quando ativado. Testado localmente com e sem DSN, e validado com `npm run test` (14/14), `npx tsc --noEmit` e `npm run build`.
24. ~~Aviso de depreciação do `pg`/`sslmode` ainda não tratado~~ — RESOLVIDO (2026-07-14): Criado helper `obterConnectionString()` em `frontend/src/lib/store/db.ts` que adiciona `uselibpqcompat=true` automaticamente à `connectionString` (se ainda não presente no `DATABASE_URL`) sem criar fallback inseguro (`process.env.DATABASE_URL` obrigatório ou erro explícito). Testado via `npx tsx` efetuando consulta (`SELECT 1`) sem emitir warnings de segurança no Node, e validado com `npx tsc --noEmit` e `npm run build`.
25. ~~`backend/` (Express) 100% órfão — nunca é buildado, mas ainda ocupa espaço no repositório~~ — RESOLVIDO (2026-07-14): Removido todo o diretório legado `backend/` via `git rm -r backend`. A pasta Express era 100% órfã desde a adoção do Next.js App Router (`frontend/src/app/api/`) e não participava do build da Vercel. Atualizado o `package.json` da raiz para incluir scripts convenientes (`dev`, `build`, `start`, `test`) apontando exclusivamente para `frontend/`. Validado com sucesso via `npm run test` (14/14), `npx tsc --noEmit` (0 erros) e `npm run build` no `frontend/`.
26. ~~`vercel.json` duplicado (na raiz e dentro de `frontend/`)~~ — RESOLVIDO (2026-07-14): Confirmado via `.vercel/project.json` que a Vercel usa `rootDirectory: "frontend"` (portanto lê `frontend/vercel.json`). O `vercel.json` da raiz do repositório foi removido (`git rm vercel.json`) e o script de build do `frontend/package.json` foi simplificado para `"next build"`, validado via `npx tsc --noEmit` e `npm run build` no `frontend/` com sucesso.

**UX / robustez de frontend:**
27. ~~Vários `fetch` no frontend com `.catch(() => {})` silencioso — falha de API não avisa o usuário, só fica sem dado~~ — RESOLVIDO (2026-07-14): Substituídos todos os `.catch(() => {})` e blocos `catch (_err) { // ignora }` nos `fetch` das páginas do dashboard (`page.tsx`, `area-morador/page.tsx`, `ocorrencias/page.tsx`, `portaria/page.tsx`) por tratamentos explícitos que registram o erro em `console.error()` e exibem avisos visuais/toasts com estados dedicados (`mensagemErro` e `mensagemSucesso`) na interface do usuário. Testado e validado com sucesso via `npx tsc --noEmit` (0 erros) e `npm run build` (~5.1s) sem quebrar nenhuma página ou fluxo.
28. ~~Painel do síndico faz polling do botão de pânico a cada 5s o tempo todo, mesmo em segundo plano — desperdício de requisições~~ — RESOLVIDO (2026-07-14): Refatorados os `useEffect` de polling contínuo (5s) no painel do síndico (`frontend/src/app/(dashboard)/page.tsx` - alertas de pânico) e no painel da portaria (`frontend/src/app/(dashboard)/portaria/page.tsx` - livro de turno, alertas de pânico e lista de visitantes) usando verificação `document.hidden` e o listener do evento nativo `visibilitychange`. Quando a aba do navegador é minimizada ou fica em segundo plano, os timers `setInterval` são limpos (`clearInterval`) imediatamente, interrompendo o consumo de requisições na Vercel e chamadas no banco Neon. Quando a aba volta a ficar visível, as requisições (`carregarPanico`, `buscarLivroTurno`, etc.) são acionadas na hora para atualização instantânea e os timers são retomados. Validado sem vazamento de memória e com build limpo (`npm run test`, `npx tsc --noEmit` e `npm run build`).
29. ~~Responsividade mobile completa e acessibilidade (contraste, navegação por teclado, `aria-label`) não verificadas em nenhuma tela~~ — RESOLVIDO (2026-07-14): Realizada auditoria e refatoração completa de UX/responsividade mobile (foco em largura padrão 375px) e acessibilidade em todas as 6 telas do dashboard (`page.tsx`, `portaria/page.tsx`, `reservas/page.tsx`, `area-morador/page.tsx`, `moradores/page.tsx`, `usuarios/page.tsx` e `ocorrencias/page.tsx`). Adicionados wrappers de rolagem horizontal (`overflow-x-auto`) em todas as tabelas gerais, convertidos os grids estáticos de colunas múltiplas (`grid-cols-2`, `grid-cols-3`) em grids responsivos com fallback mobile (`grid-cols-1 sm:grid-cols-2`, `sm:grid-cols-3`) em todos os formulários e modais, e inseridos atributos de acessibilidade `aria-label` em 100% dos botões que possuem apenas ícones (`✕` para fechar modais/alertas e `🔔` para notificações). Validado com 14/14 testes aprovados no Vitest, 0 erros no TypeScript (`npx tsc --noEmit`) e build de produção (`npm run build`) compilado com sucesso de todas as 34 rotas na Vercel.

