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

Status (atualizado em 2026-07-13 — TODAS AS ETAPAS ENTREGUES E FUNCIONAIS):

Cadastro de Moradores -> FEITO DE VERDADE (Postgres real via Neon, senha com hash bcrypt, testado no deploy remoto)
Reserva de salão/churrasqueira/academia -> FEITO DE VERDADE (Postgres/Neon)
comunicados -> FEITO DE VERDADE (Postgres/Neon), tela do síndico já publica e lista de verdade
enquetes -> FEITO DE VERDADE (Postgres real via Neon nas tabelas enquetes e enquete_votos, criação dinâmica pelo síndico, encerramento/reabertura, votação real com bloqueio de voto duplicado por unidade e barras de porcentagem em tempo real)
livro de ocorrencias -> FEITO DE VERDADE (Postgres/Neon)
segunda via de boletos -> FEITO DE VERDADE (tabela boletos_financeiro no Neon/Postgres com emissão de 2ª via, PIX Copia e Cola, Código de Barras e detalhamento de despesas)
aviso de encomendas -> FEITO DE VERDADE (Postgres/Neon)
dashboard do síndico -> FEITO DE VERDADE, ligado a dados reais; todos os módulos interativos funcionais
area do porteiro -> FEITO DE VERDADE: visitantes manuais migrados para Postgres (tabela visitantes), Livro de Plantão/Turno com confirmação individual de leitura ciente, Botão de Pânico com alerta em tempo real
area do morador -> FEITO DE VERDADE: QR Code de liberação de visita real (tabela liberacoes_visita no Neon), votação em enquetes, visualização de boletos e segunda via
Controle de Visitantes com QR code -> FEITO DE VERDADE (tabela liberacoes_visita no Neon, geração de código+imagem real, validação com expiração/reuso testada).
notificação de email e whatsapp -> FEITO DE VERDADE (tabela notificacoes_enviadas no Neon/Postgres, rotas /api/condominio/notificacoes, botão de disparo rápido na Portaria e Central Interativa no Painel do Síndico)
aplicação pwa p celular -> FEITO DE VERDADE (manifest.json completo, Service Worker sw.js para cache offline, ícones pwa e PwaRegistry registrado no layout.tsx)
Autenticação & Segurança de Rotas -> FEITO DE VERDADE (login real com bcrypt, sessão JWT em cookie httpOnly; frontend/src/proxy.ts barra TANTO páginas quanto TODAS as rotas /api/* retornando 401 JSON quando não autenticado)
Arquitetura Multi-Condomínio / Multi-Tenant SaaS -> FEITO DE VERDADE (tabela condominios no Neon/Postgres, rotas GET/POST /api/condominios, seletor visual no cabeçalho do síndico e modal completo para alternar prédios ativos e cadastrar novos edifícios no SaaS)

Nota para quem continuar (Claude / Antigravity): o arquivo CLAUDE.md na raiz tem o contexto técnico 100% detalhado com todo o passo a passo de implementação, schemas de todas as tabelas, rotas de API, arquitetura Next.js 16 (uso obrigatório de proxy.ts sem middleware.ts) e decisões arquiteturais.
