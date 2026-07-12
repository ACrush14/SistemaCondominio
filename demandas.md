Demandas específicas:

Funcionalidades:
Cadastro de Moradores
Controle de Visitatntes com QR code
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

Status (atualizado em 2026-07-12):

Cadastro de Moradores -> feito de verdade (Postgres real via Neon, senha com hash, testado no deploy remoto)
Reserva de salão/churrasqueira/academia -> feito de verdade (Postgres/Neon)
comunicados -> feito de verdade (Postgres/Neon), tela do síndico já publica e lista de verdade
enquetes -> não existe ainda, só aparece como mockup na tela do síndico
livro de ocorrencias -> feito de verdade (Postgres/Neon)
segunda via de boletos -> não existe (financeiro do morador é 100% novo, do zero)
aviso de encomendas -> feito de verdade (Postgres/Neon)
dashboard do síndico -> feito, ligado a dados reais; indicadores fixos sem dado real ("Resolução com IA", "Índices do Condomínio") foram removidos por enquanto
area do porteiro -> visitantes manuais (registro sem QR) ainda em memória; leitor de câmera pro QR Code já existe (ver abaixo); botão de pânico e livro de turno do Stitch ainda não foram construídos
area do morador -> versão simples existe; QR Code de liberação de visita já é real (ver abaixo); financeiro e enquete do Stitch ainda não
Controle de Visitantes com QR code -> FEITO (tabela liberacoes_visita no Neon, geração de código+imagem real, validação com expiração/reuso testada). Falta só testar o escaneamento com câmera de verdade num dispositivo físico — não foi possível testar isso no ambiente onde foi construído (sem hardware de câmera)
notificação de email e whatsapp -> não existe ainda
aplicação pwa p celular -> não existe ainda
Autenticação -> FEITO (login real com bcrypt, sessão JWT em cookie httpOnly, todas as rotas do dashboard protegidas via frontend/src/proxy.ts). Falta proteger as rotas de API diretamente (hoje só as páginas são barradas)

Infra que não estava na lista original mas virou pré-requisito de tudo isso:
- Banco de dados Postgres real (Neon), configurado local e na Vercel
- Deploy testável remotamente (celular/PC): https://sistemacondominio-nine.vercel.app

Pendências restantes (o que falta atacar agora, em ordem sugerida):
1. Testar o QR Code com câmera real (celular/PC do usuário) — único item bloqueado por falta de hardware de teste
2. Enquetes (mural do síndico)
3. Financeiro do morador / segunda via de boleto (novo, do zero)
4. Botão de pânico (portaria)
5. Livro de turno da portaria (diferente do livro de ocorrências)
6. Migrar /api/visitantes (registro manual) pro Postgres — ainda em memória
7. Proteger rotas de API diretamente no proxy.ts (hoje só as páginas são protegidas)
8. Notificação por e-mail e WhatsApp
9. Aplicação PWA para celular
10. Resolver DATABASE_URL no ambiente Preview da Vercel (hoje só em Production)

Nota para quem continuar (ex.: outra ferramenta de IA como o Antigravity): o arquivo CLAUDE.md na raiz tem o contexto técnico completo — arquitetura, bugs encontrados e corrigidos (isolamento de módulo por rota, TIMESTAMP vs TIMESTAMPTZ), e detalhes de cada decisão. Leia ele antes de mexer em qualquer coisa.
