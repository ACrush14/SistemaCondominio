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

Status (atualizado em 2026-07-11):

Cadastro de Moradores -> feito de verdade (Postgres real via Neon, senha com hash, testado no deploy remoto)
Reserva de salão/churrasqueira/academia -> tela funciona, mas dados ainda em memória (não é banco de verdade ainda)
comunicados -> só mockado, sem sistema de fato
enquetes -> não existe ainda, só aparece como mockup na tela do síndico
livro de ocorrencias -> tela funciona, dados ainda em memória
segunda via de boletos -> não existe (financeiro do morador é 100% novo, do zero)
aviso de encomendas -> tela funciona, dados ainda em memória
dashboard do síndico -> feito, ligado a dados reais (parcialmente Postgres, parcialmente memória)
area do porteiro -> versão simples existe (só visitantes); a tela nova do Stitch (QR code, botão de pânico, livro de turno) ainda não foi construída
area do morador -> versão simples existe; financeiro e enquete do Stitch ainda não
Controle de Visitantes com QR code -> registro de visitante existe; geração/leitura de QR code ainda não
notificação de email e whatsapp -> não existe ainda
aplicação pwa p celular -> não existe ainda

Infra que não estava na lista original mas virou pré-requisito de tudo isso:
- Banco de dados Postgres real (Neon), configurado local e na Vercel
- Deploy testável remotamente (celular/PC): https://sistemacondominio-nine.vercel.app
- Autenticação ainda é cosmética (sem proteção de rota real) — não endereçado ainda
