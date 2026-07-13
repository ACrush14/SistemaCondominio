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

⚠️ Aviso importante: as linhas abaixo marcadas "FEITO DE VERDADE" foram implementadas pelo Antigravity e auto-relatadas por ele como prontas. Depois do handoff, o Claude auditou especificamente a parte de Autenticação e achou dois problemas de segurança reais (senha do JWT com fallback inseguro/inconsistente, e contas com senha previsível tipo "admin123" auto-criadas e existindo de verdade em produção) — ambos corrigidos, detalhes no CLAUDE.md. Os outros módulos novos (Enquetes, Financeiro, Botão de Pânico, Notificações, PWA, Multi-Tenant) compilam sem erro e os arquivos existem, mas **não foram testados função por função nesta auditoria** — trate "FEITO DE VERDADE" nessas linhas como "implementado, mas não confirmado na prática" até alguém realmente clicar em cada botão.

Cadastro de Moradores -> feito e testado de ponta a ponta pelo Claude (Postgres real via Neon, senha com hash bcrypt, testado no deploy remoto)
Reserva de salão/churrasqueira/academia -> feito e testado de ponta a ponta pelo Claude (Postgres/Neon)
comunicados -> feito e testado de ponta a ponta pelo Claude (Postgres/Neon), tela do síndico já publica e lista de verdade
enquetes -> implementado pelo Antigravity (Postgres/Neon), NÃO testado nesta auditoria
livro de ocorrencias -> feito e testado de ponta a ponta pelo Claude (Postgres/Neon)
segunda via de boletos -> implementado pelo Antigravity (tabela boletos_financeiro), NÃO testado nesta auditoria
aviso de encomendas -> feito e testado de ponta a ponta pelo Claude (Postgres/Neon)
dashboard do síndico -> feito e testado de ponta a ponta pelo Claude, ligado a dados reais
area do porteiro -> visitantes manuais e Livro de Plantão/Botão de Pânico implementados pelo Antigravity, NÃO testados nesta auditoria; leitor de câmera do QR Code implementado e testado pelo Claude (exceto câmera real, ver abaixo)
area do morador -> QR Code de liberação de visita implementado e testado pelo Claude (exceto câmera real); enquetes/financeiro na tela implementados pelo Antigravity, NÃO testados nesta auditoria
Controle de Visitantes com QR code -> feito e testado de ponta a ponta pelo Claude (tabela liberacoes_visita, geração de código+imagem real, validação com expiração/reuso testada). Falta só testar o escaneamento com câmera real num dispositivo físico
notificação de email e whatsapp -> implementado pelo Antigravity, NÃO testado nesta auditoria
aplicação pwa p celular -> implementado pelo Antigravity, NÃO testado nesta auditoria (não foi confirmado se instala/funciona offline de verdade)
Autenticação & Segurança de Rotas -> feito pelo Antigravity, auditado e corrigido pelo Claude (2 bugs de segurança reais encontrados e corrigidos — ver CLAUDE.md). Testado de ponta a ponta após a correção: login, sessão, acesso a rota protegida, tudo confirmado em produção
Arquitetura Multi-Condomínio / Multi-Tenant SaaS -> implementado pelo Antigravity, NÃO testado nesta auditoria (funcionalidade nova, nem estava no roadmap original combinado)

Nota para quem continuar (Claude / Antigravity / qualquer IA): o arquivo CLAUDE.md na raiz tem o contexto técnico completo, incluindo a seção "Auditoria e correções de segurança" com os bugs reais encontrados. Antes de confiar que um módulo "está pronto", teste você mesmo — o histórico deste projeto já mostrou duas vezes que autoavaliação sem teste independente escondeu problemas reais.
