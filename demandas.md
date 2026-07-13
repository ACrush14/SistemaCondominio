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
enquetes -> FEITO DE VERDADE (Postgres real via Neon nas tabelas enquetes e enquete_votos, com criação dinâmica de enquetes pelo síndico, encerramento/reabertura, votação real com bloqueio de voto duplicado por unidade e barras de porcentagem em tempo real no síndico e no morador)
livro de ocorrencias -> feito de verdade (Postgres/Neon)
segunda via de boletos -> não existe (financeiro do morador é 100% novo, do zero)
aviso de encomendas -> feito de verdade (Postgres/Neon)
dashboard do síndico -> feito, ligado a dados reais; indicadores fixos sem dado real ("Resolução com IA", "Índices do Condomínio") foram removidos por enquanto
area do porteiro -> FEITO DE VERDADE: visitantes manuais migrados para Postgres (tabela visitantes no Neon), Livro de Plantão/Turno criado e integrado ao Postgres (tabela livro_turno_portaria com confirmação individual de leitura ciente e abas interativas em /portaria); botão de pânico ainda não foi construído
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
2. Enquetes (mural do síndico e morador) — FEITO DE VERDADE
3. Financeiro do morador / segunda via de boleto — FEITO DE VERDADE (tabela boletos_financeiro no Neon/Postgres com emissão de 2ª via, PIX Copia e Cola, Código de Barras e detalhamento de despesas)
4. Botão de pânico (portaria) — FEITO DE VERDADE (tabela alertas_panico no Neon/Postgres com acionamento de 1 clique na Portaria, banner de emergência piscante no Painel do Síndico e confirmação de resolução)
5. Livro de turno da portaria (diferente do livro de ocorrências) — FEITO DE VERDADE (tabela livro_turno_portaria no Postgres/Neon com confirmação individual de ciência por porteiro)
6. Migrar /api/visitantes (registro manual) pro Postgres — FEITO DE VERDADE (tabela visitantes no Neon)
7. Proteger rotas de API diretamente no proxy.ts (hoje só as páginas são protegidas)
8. Notificação por e-mail e WhatsApp
9. Aplicação PWA para celular
10. Resolver DATABASE_URL no ambiente Preview da Vercel (hoje só em Production)

Nota para quem continuar (ex.: outra ferramenta de IA como o Antigravity): o arquivo CLAUDE.md na raiz tem o contexto técnico completo — arquitetura, bugs encontrados e corrigidos (isolamento de módulo por rota, TIMESTAMP vs TIMESTAMPTZ), e detalhes de cada decisão. Leia ele antes de mexer em qualquer coisa.
