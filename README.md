# 🏢 CondoManage — Sistema Completo de Gestão Inteligente de Condomínios com IA

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![IA Mania](https://img.shields.io/badge/IA%20Mania-NLP%20%2F%20Smart%20Assistant-6366f1?style=for-the-badge)

<p align="center">
  <b>Uma plataforma corporativa e residencial moderna para Síndicos, Portaria e Moradores com Inteligência Artificial integrada.</b>
</p>

</div>

---

## 🌟 Visão Geral do Projeto

O **CondoManage** é uma solução de gestão condominial full-stack de última geração concebida para modernizar a rotina de condomínios verticais e horizontais. A plataforma integra em um único ecossistema o painel administrativo do Síndico, a operação de segurança da portaria, o controle interativo de áreas comuns e a **IA Mania**, uma assistente conversacional inteligente capaz de agendar reservas por meio de linguagem natural.

🔗 **Aplicação em produção**: [sistemacondominio-nine.vercel.app](https://sistemacondominio-nine.vercel.app) — testável remotamente, no celular ou no PC.

---

## 📸 Capturas de Tela

| Painel do Síndico | Reservas de Áreas Comuns |
|---|---|
| ![Painel do Síndico](docs/screenshots/painel-sindico.png) | ![Reservas](docs/screenshots/reservas.png) |

| Ocorrências e Avisos | Área do Morador (IA) |
|---|---|
| ![Ocorrências](docs/screenshots/ocorrencias.png) | ![Área do Morador](docs/screenshots/area-morador.png) |

| Portaria | Moradores & Usuários |
|---|---|
| ![Portaria](docs/screenshots/portaria.png) | ![Usuários](docs/screenshots/usuarios.png) |

---

## ✨ Principais Funcionalidades

### 👑 1. Painel Executivo do Síndico (Anderson de Lima)
- **KPIs em Tempo Real**: Monitoramento de taxa de ocupação, ocorrências pendentes, liberação de visitantes e reservas ativas.
- **Resumo Executivo Gerado por IA**: Análise automática do status geral do condomínio e priorização de demandas.
- **Gestão de Ocorrências & Avisos**: Acompanhamento detalhado de solicitações com status, prioridade e modal interativo para publicação de novos comunicados gerais.

---

### 🤖 2. IA Mania — Assistente Conversacional Inteligente (NLP)
- **Botão Flutuante Global**: Acessível em qualquer tela do sistema (`🤖 Falar com a IA Mania`).
- **Agendamento em Linguagem Natural**: A Mania entende frases completas em português, como:
  > *"Quero reservar para dia 25 das 15 até as 20 para 10 pessoas o salão de festas. vou precisar de cadeiras e mesas"*
- **Extração Automática de Dados**:
  - Identifica o espaço (**Salão de Festas**, **Churrasqueira** ou **Piscina**).
  - Calcula a data exata dentro da janela permitida de 30 dias.
  - Extrai horários de início e fim, número de convidados e observações/requisitos especiais.
- **Card Interativo no Chat**: Apresenta os dados extraídos para confirmação e grava diretamente no banco de dados com um clique.

---

### 📅 3. Gestão Avançada de Reservas (`/reservas`)
- **Espaços Comuns**:
  - 🎉 **Salão de Festas** (Capacidade: 50 pessoas)
  - 🥩 **Churrasqueira** (Capacidade: 25 pessoas)
  - 🏊 **Piscina** (Capacidade: 20 pessoas)
- **Agenda Semanal Interativa**: Grade visual de 7 dias com navegação entre semanas e indicador imediato de disponibilidade.
- **Regra de Agendamento Online (+30 Dias)**:
  - Agendamentos pelo aplicativo são limitados a uma janela de até 30 dias a partir da data atual.
  - Alerta oficial orientando que solicitações além de 30 dias devem ser consultadas diretamente com o Síndico.
- **Controles Precisos de Horário & Observações**:
  - Seleção independente de **Horário de Início** e **Horário de Fim**.
  - Opção interativa **"Dia Inteiro"** (estende automaticamente até as 23:00).
  - Campo dedicado para **Observações / Requisitos Especiais** (música, equipamentos adicionais, etc.).

---

### 🏢 4. Controle de Setores & Moradores Personalizável (`/usuarios`)
- **Personalização Dinâmica da Estrutura**:
  - Ajuste interativo de **Quantidade de Andares** e **Apartamentos por Andar**.
  - Cálculo automático e geração em tempo real de todos os setores do residencial.
- **Organização por Setores**:
  - 👑 **Setor Executivo (SINDICO)**: Anderson de Lima (Apto 501 / Administração).
  - 🛡️ **Setor Operacional (PORTEIRO)**: Fulano Alterado (Portaria Principal).
  - 🏢 **Setores Residenciais (1º ao 5º Andar / Aptos 101 ao 502)**: Alocação estruturada por andar com verificação de conformidade 100%.

---

### 🔐 5. Autenticação Real & Liberação de Visitantes por QR Code
- **Login de verdade**: senha conferida com `bcrypt` contra o Postgres, sessão via JWT em cookie `httpOnly` — nenhuma tela do dashboard é acessível sem login.
- **QR Code de Acesso Rápido**: o morador gera um código de liberação (validade 24h) na Área do Morador; a Portaria escaneia com a câmera do dispositivo pra validar e liberar a entrada.

---

### 🌙 6. Design Premium com Modo Claro e Modo Escuro
- **Dark Mode Elegante**: Transições suaves (`globals.css`) com paleta de cores *Slate/Navy* profunda (`#0b1323`), cartões translúcidos e alta legibilidade.
- **Alternador Inteligente no Menu Lateral**: Botão interativo no rodapé da barra lateral exibindo o status atual do tema.

---

## 🛠️ Arquitetura e Tecnologias

### Frontend (`/frontend`)
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router & Server/Client Components)
- **Biblioteca UI**: React 19 + TypeScript
- **Estilização**: Tailwind CSS 3.4
- **Ícones & Design System**: Custom SVG Icons & Design Glassmorphism

### Backend (`/backend`)
- **Runtime**: Node.js + ES Modules (`type: "module"`)
- **Framework API**: Express.js
- **Banco de Dados**: PostgreSQL (Driver `pg` + Pool de conexões) com fallback em memória persistente para alta disponibilidade
- **Segurança**: Criptografia de senhas com `bcrypt` e validação CORS

> **Nota sobre o estado atual da arquitetura:** o deploy na Vercel builda apenas a pasta `frontend/` (ver `vercel.json`), então o backend Express acima **não roda em produção hoje**. Quem realmente atende as requisições do app — em dev e no deploy — são as rotas do Next.js em `frontend/src/app/api/*`.
>
> **Persistência:** Usuários/Moradores, Ocorrências, Reservas, Comunicados, Encomendas e Liberações de Visita (QR Code) já gravam num Postgres real, gerenciado pelo [Neon](https://neon.tech). Só o registro manual de visitantes pela portaria (`/api/visitantes`) ainda está em memória.
>
> **Autenticação:** login real (senha conferida com `bcrypt` contra o Postgres) e sessão via JWT em cookie `httpOnly` — todas as telas do dashboard exigem login, sem exceção.
>
> Detalhes completos (schema, decisões, avisos de segurança) em [`CLAUDE.md`](CLAUDE.md).

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **PostgreSQL** (opcional para persistência SQL completa; o sistema possui fallback automático caso o banco local não esteja ativo)

### 1. Clonar o Repositório
```bash
git clone https://github.com/SEU_USUARIO/SistemaCondominio.git
cd SistemaCondominio
```

### 2. Executar o Backend API (Porta `3333`)
```bash
cd backend
npm install
npm run dev
```
> O servidor API iniciará em `http://localhost:3333` e criará as tabelas/usuários automaticamente no PostgreSQL ou memória.

### 3. Executar o Frontend Next.js (Porta `3001`)
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```
> Acesse a aplicação em **http://localhost:3001/**.

---

## 🌐 Guia de Publicação no GitHub & Deploy na Vercel

### A. Publicar no GitHub
1. Inicialize o repositório Git (se ainda não estiver inicializado):
   ```bash
   git init
   git add .
   git commit -m "feat: lançamento do CondoManage com IA Mania e controle de setores"
   ```
2. Conecte ao seu repositório no GitHub:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/SistemaCondominio.git
   git branch -M main
   git push -u origin main
   ```

### B. Deploy do Frontend na Vercel (Recomendado)
1. Acesse [vercel.com](https://vercel.com/) e faça login com sua conta do GitHub.
2. Clique em **Add New...** > **Project** e importe o repositório `SistemaCondominio`.
3. Em **Root Directory**, selecione a pasta `frontend`.
4. Em **Build and Output Settings**:
   - Framework Preset: **Next.js**
   - Build Command: `next build`
5. Clique em **Deploy**. Seu sistema estará online com domínio HTTPS gratuito em poucos segundos!

---

## 👥 Equipe e Liderança Oficial do Residencial
- **Síndico Geral**: Anderson de Lima (*Administração — Apto 501*)
- **Chefe de Portaria**: Fulano Alterado (*Portaria Principal*)
- **Assistente Virtual**: IA Mania (*Disponível 24/7 via Chatbot NLP*)

---

<div align="center">
  <p>Desenvolvido com excelência para modernizar a gestão de condomínios.</p>
</div>
