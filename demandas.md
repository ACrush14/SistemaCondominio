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

Nota para quem continuar (Claude / Antigravity / qualquer IA): o arquivo CLAUDE.md na raiz tem o contexto técnico completo, incluindo a seção "Auditoria e correções de segurança" com os bugs reais encontrados. Antes de confiar que um módulo "está pronto", teste você mesmo — o histórico deste projeto já mostrou duas vezes que autoavaliação sem teste independente escondeu problemas reais.
