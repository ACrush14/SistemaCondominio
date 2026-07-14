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
notificação de email e whatsapp -> E-MAIL REAL FUNCIONANDO (via Resend, testado ponta a ponta incluindo recebimento real na caixa de entrada). WhatsApp continua sem integração real (decisão do usuário: adiado por enquanto) — ao enviar por WhatsApp, o sistema agora retorna FALHA honestamente em vez de fingir sucesso
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
2. WhatsApp real (Twilio ou similar) — adiado por decisão sua; hoje retorna falha honesta em vez de fingir envio
3. UI de administração para vincular/desvincular um usuário de condomínios adicionais — hoje só é feito via SQL direto na tabela `usuario_condominios`

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
12. Sem UI para editar/excluir condomínios — só criar e listar
13. Sem paginação em nenhuma lista (`/api/usuarios`, ocorrências, notificações etc.)
14. Notificações limitadas a 30 registros fixos, sem "carregar mais"
15. Todo delete é permanente (hard delete) — nenhuma tabela tem soft-delete ou trilha de auditoria de quem apagou o quê
16. Reservas não checam conflito de horário sobreposto no banco (só a regra de "até 30 dias de antecedência" é validada)

**IA (Gemini):**
17. Sem controle de custo/uso — sem cache, sem limite por usuário/dia; pode gerar custo real na conta Google se abusado
18. IA Mania sugere uma reserva mas não confere automaticamente a regra dos 30 dias nem conflito de horário antes de "confirmar" — só a rota de criação em si valida depois

**Financeiro:**
19. Sem gateway de pagamento real — PIX/boleto são só exibidos pra copiar, ninguém processa pagamento de fato; marcar "PAGO" é manual
20. Sem geração automática recorrente de boleto mensal — precisa criar manualmente todo mês, por unidade

**Qualidade / operação:**
21. Sem testes automatizados (nenhum teste unitário/integração, tudo validado manualmente nas sessões)
22. Sem sistema formal de migração de banco (tipo Prisma Migrate) — todo `ALTER TABLE` rodado foi um comando `psql` avulso, documentado só em prosa no `CLAUDE.md`
23. Sem monitoramento/alerta de erro em produção (tipo Sentry)
24. Aviso de depreciação do `pg`/`sslmode` ainda não tratado
25. `backend/` (Express) 100% órfão — nunca é buildado, mas ainda ocupa espaço no repositório
26. `vercel.json` duplicado (na raiz e dentro de `frontend/`) — funciona, mas confunde se alguém mexer no errado

**UX / robustez de frontend:**
27. Vários `fetch` no frontend com `.catch(() => {})` silencioso — falha de API não avisa o usuário, só fica sem dado
28. Painel do síndico faz polling do botão de pânico a cada 5s o tempo todo, mesmo em segundo plano — desperdício de requisições
29. Responsividade mobile completa e acessibilidade (contraste, navegação por teclado, `aria-label`) não verificadas em nenhuma tela
