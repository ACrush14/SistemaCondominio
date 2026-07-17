# 🏢 CondoManage — Sistema Completo de Gestão Inteligente de Condomínios com IA

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL%20(Neon)-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![Mercado Pago](https://img.shields.io/badge/Mercado%20Pago%20PIX-00B1EA?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge)

<p align="center">
  <b>Uma plataforma corporativa e residencial moderna para Síndicos, Portaria e Moradores, com Inteligência Artificial integrada e persistência 100% real em PostgreSQL.</b>
</p>

</div>

---

## 🌟 Visão Geral do Projeto

O **CondoManage** é uma solução de gestão condominial full-stack concebida para modernizar a rotina de condomínios verticais e horizontais. A plataforma integra em um único ecossistema o painel administrativo do Síndico, a operação de segurança da portaria, o controle interativo de áreas comuns, cobrança real via PIX e a **IA Mania**, uma assistente conversacional inteligente (Google Gemini) capaz de agendar reservas por meio de linguagem natural.

Todo o backend roda como Route Handlers do Next.js (App Router) sobre um banco **PostgreSQL real** hospedado no [Neon](https://neon.tech) — não há dados fake, mockados ou em memória em nenhuma tela.

🔗 **Aplicação em produção**: [sistemacondominio-nine.vercel.app](https://sistemacondominio-nine.vercel.app) — testável remotamente, no celular ou no PC. Instalável como app (PWA) em Android/iOS/desktop.

---

## 📸 Capturas de Tela

| Painel do Síndico | Área do Morador (Financeiro/PIX) |
|---|---|
| ![Painel do Síndico](docs/screenshots/painel-sindico.png) | ![Área do Morador](docs/screenshots/area-morador.png) |

| Central da Portaria | Reservas de Áreas Comuns |
|---|---|
| ![Portaria](docs/screenshots/portaria.png) | ![Reservas](docs/screenshots/reservas.png) |

| Ocorrências e Avisos | Moradores & Usuários |
|---|---|
| ![Ocorrências](docs/screenshots/ocorrencias.png) | ![Usuários](docs/screenshots/usuarios.png) |

| Menu responsivo no celular |
|---|
| ![Menu mobile](docs/screenshots/mobile-menu.png) |

---

## ✨ Principais Funcionalidades

### 🔐 1. Autenticação, Multi-Tenant e Controle de Acesso
- **Login real**: senha conferida com `bcrypt` contra o Postgres, sessão via **JWT** em cookie `httpOnly` (nenhuma tela do dashboard é acessível sem login).
- **Auto-cadastro público de moradores** (`/cadastro`), com validação de servidor e perfil sempre forçado para `MORADOR` (não dá pra se auto-promover a Síndico).
- **"Esqueci minha senha"** por e-mail, com código de 6 dígitos, expiração de 15 minutos e proteção contra enumeração de e-mails.
- **Multi-Condomínio (SaaS) de verdade**: cada conta pertence a um condomínio (`condominio_id`), e todas as 12 tabelas de dados são isoladas por tenant — um usuário de um prédio nunca vê dado de outro. Contas de síndico podem estar vinculadas a mais de um condomínio e alternar entre eles de verdade.
- **Restrição de telas e rotas por perfil**: Síndico, Porteiro e Morador só acessam o que faz sentido pro papel deles — tentativas fora do escopo são bloqueadas tanto na tela quanto na API (`403`), não é só uma questão de esconder botão.
- **Soft-delete em toda a base**: revogar um usuário, cancelar uma reserva, excluir uma enquete ou um condomínio nunca apaga o histórico de verdade — só marca como inativo, preservando auditoria e dados relacionados.

---

### 🤖 2. Inteligência Artificial real (Google Gemini)
Três pontos de IA, todos usando a API real do Gemini (`gemini-2.5-flash`), com limite diário de uso por usuário pra evitar estouro de custo:
- **IA Mania** — assistente conversacional flutuante, disponível em qualquer tela (`🤖 Falar com a IA Mania`), que entende agendamentos em linguagem natural:
  > *"Quero reservar o salão de festas dia 25, das 15h às 20h, para 20 pessoas"*
  
  Extrai automaticamente área, data, horário e convidados, e **já confere no banco** se a data está dentro da janela permitida e se não há conflito de horário antes de sugerir a confirmação.
- **Resumo automático de ocorrências**: todo relato de morador ganha um resumo profissional gerado por IA no Livro de Ocorrências.
- **Assistente Executivo do Síndico**: lê em tempo real ocorrências pendentes, alertas de pânico ativos e encomendas não retiradas do Postgres, e responde perguntas do síndico priorizando o que é mais urgente.

---

### 📅 3. Gestão de Reservas de Áreas Comuns
- Salão de Festas, Churrasqueira e Piscina/Academia, com agenda semanal visual.
- Checagem real de conflito de horário no banco (tanto pela IA Mania quanto pela criação manual) e limite de 30 dias de antecedência.
- Cancelamento é soft-delete: libera o horário pra nova reserva sem apagar o histórico.

---

### 💳 4. Financeiro com PIX real (Mercado Pago)
- 2ª via de boletos com código de barras e **PIX Copia e Cola real**, gerado via API de Orders do Mercado Pago.
- QR Code do PIX renderizado no navegador a partir do código copia-e-cola.
- Confirmação de pagamento por **webhook real** (assinatura validada por HMAC), sem depender de o morador clicar em "confirmar sozinho" — dar baixa manual é restrito ao Síndico.
- Geração automática recorrente de boletos mensais via Vercel Cron.

---

### 🛡️ 5. Portaria: QR Code, Código Numérico, Pânico e Livro de Plantão
- **Liberação de visitantes** por QR Code (câmera) ou **código numérico de 6 dígitos** (mais simples de testar entre aparelhos reais), com expiração de 24h.
- **Botão de Pânico**: alerta 1-clique que dispara um banner vermelho em tempo real no painel do Síndico até ser resolvido.
- **Livro de Plantão**: passagem de turno entre porteiros com registro de prioridade e confirmação de ciência.

---

### 🗳️ 6. Enquetes & Votações em Tempo Real
- Criação de enquetes pelo Síndico, votação única por unidade (revotar atualiza, não duplica), resultados percentuais ao vivo, encerrar/reabrir/excluir.

---

### 📲 7. Notificações reais por E-mail e WhatsApp
- E-mail via **Resend**, WhatsApp via **Twilio** — ambos com envio de verdade (não apenas simulado), com auditoria permanente de cada disparo no Postgres.

---

### 📱 8. Aplicação PWA e 100% Responsiva
- Instalável como app nativo em Android, iOS e Desktop (`manifest.json` + Service Worker com cache offline).
- Layout responsivo em todas as telas, incluindo a barra lateral: em celular ela vira uma gaveta deslizante acionada por um botão de menu, sem cobrir o conteúdo.

---

### 🌙 9. Design Premium com Modo Claro e Modo Escuro
- Dark Mode com paleta *Slate/Navy* profunda, cartões translúcidos e alta legibilidade, alternável a qualquer momento pelo botão no rodapé da barra lateral.

---

## 🛠️ Arquitetura e Tecnologias

Todo o sistema — frontend **e** backend — vive em uma única aplicação **Next.js 16** (App Router), em `frontend/`. Não existe um servidor Express separado: as rotas de API (`frontend/src/app/api/**`) são Route Handlers do próprio Next.js, e é isso que roda tanto em desenvolvimento quanto no deploy da Vercel.

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Route Handlers, `proxy.ts` como middleware de autenticação/autorização)
- **UI**: React 19 + TypeScript + Tailwind CSS
- **Banco de dados**: PostgreSQL real via [Neon](https://neon.tech) (`pg.Pool`), com migrações versionadas via `node-pg-migrate`
- **Autenticação**: JWT (`jsonwebtoken`) em cookie `httpOnly` + `bcryptjs` para hash de senha
- **IA**: Google Gemini (`@google/genai`)
- **Pagamentos**: Mercado Pago (API de Orders, PIX real)
- **Notificações**: Resend (e-mail) + Twilio (WhatsApp)
- **Monitoramento**: Sentry (`@sentry/nextjs`)
- **Testes**: Vitest (testes unitários de regras de negócio)
- **QR Code**: `qrcode` (gerar) + `html5-qrcode` (ler via câmera)

> Detalhes completos de schema, decisões de arquitetura, bugs reais encontrados e corrigidos, e histórico de auditorias de segurança estão documentados em [`CLAUDE.md`](CLAUDE.md) — é o changelog técnico vivo do projeto.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js** 18+
- Uma connection string de um banco **PostgreSQL** (o projeto usa [Neon](https://neon.tech), mas qualquer Postgres serve)

### 1. Clonar o Repositório
```bash
git clone https://github.com/ACrush14/SistemaCondominio.git
cd SistemaCondominio/frontend
```

### 2. Configurar variáveis de ambiente
Crie um arquivo `frontend/.env.local` com, no mínimo:
```bash
DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require
JWT_SECRET=uma-string-aleatoria-longa
```
As demais variáveis (`GEMINI_API_KEY`, `RESEND_API_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `TWILIO_*`, `NEXT_PUBLIC_SENTRY_DSN`, `CRON_SECRET`) são opcionais em dev — cada integração falha de forma honesta (sem fingir sucesso) quando a variável correspondente não está configurada.

### 3. Instalar dependências e rodar as migrações
```bash
npm install
npm run migrate:up
```

### 4. Rodar o servidor de desenvolvimento
```bash
npm run dev
```
> Acesse a aplicação em **http://localhost:3001/**.

### 5. (Opcional) Rodar os testes
```bash
npm run test
```

---

## 🌐 Deploy na Vercel

O projeto já está configurado pra deploy direto na Vercel a partir da pasta `frontend/` (ver `frontend/vercel.json`):

1. Acesse [vercel.com](https://vercel.com/) e importe o repositório.
2. Em **Root Directory**, selecione `frontend`.
3. Configure as variáveis de ambiente necessárias (ver seção acima) no ambiente **Production**.
4. Deploy automático a cada push em `main`.

---

## 👥 Equipe de Referência do Residencial

- **Síndico Geral**: Anderson de Lima (*Administração*)
- **Assistente Virtual**: IA Mania (*Disponível 24/7 via Chatbot NLP, powered by Google Gemini*)

---

<div align="center">
  <p>Desenvolvido como projeto de aprendizado prático de integração full-stack.</p>
</div>
