# DOCUMENTAÇÃO OFICIAL DO PROJETO — LÍDER BARBERS

> **AVISO OBRIGATÓRIO PARA ASSISTENTES DE IA**:
> 1. **LEITURA PRÉVIA OBRIGATÓRIA**: Antes de executar qualquer nova alteração solicitada pelo usuário, você DEVE ler este arquivo na íntegra para compreender o estado real do projeto, sua arquitetura, regras de negócio e evitar suposições equivocadas.
> 2. **ATUALIZAÇÃO OBRIGATÓRIA**: Após executar qualquer alteração e antes de finalizar o seu turno, você DEVE atualizar este documento, registrando no **Histórico de Alterações** o que foi feito, o motivo e qualquer impacto na arquitetura ou nos dados.

---

## 1. Visão Geral do Sistema

O **Líder Barbers** é uma plataforma full-stack moderna e de alto desempenho para gestão completa e agendamento online de barbearias, desenvolvida com estética premium (tema escuro com detalhes em dourado `#d4af37`), arquitetura PWA instalável para smartphones (Android e iOS) e separação rígida de papéis operacionais.

### Objetivos Principais
- **Experiência Limpa para o Cliente**: Agendamento rápido em menos de 1 minuto, sem necessidade de download ou login burocrático, com horários calculados em tempo real e confirmação instantânea.
- **Isolamento de Portais**: Acesso público livre de poluição visual de links administrativos; portais dedicados e protegidos para Dono, Administrador e Barbeiro.
- **Gestão Operacional & Financeira**: Faturamento em tempo real, cálculo automatizado de comissões por barbeiro, controle de pausas/folgas e gestão de catálogo de serviços.
- **PWA Multi-Perfil**: Atalhos e telas de instalação específicas para que cada membro da equipe adicione o aplicativo do seu respectivo perfil diretamente na tela inicial do celular.

---

## 2. Arquitetura Técnica & Stack Tecnológica

### 2.1 Backend
- **Ambiente**: Node.js com TypeScript (executado via `tsx` em desenvolvimento e compilado via `esbuild` em produção).
- **Servidor Web**: Express (`server.ts`) operando na porta obrigatória `3000` (host `0.0.0.0`).
- **Middleware Vite**: Integrado ao Express em modo desenvolvimento (`createServer({ server: { middlewareMode: true }, appType: 'spa' })`) e servindo a pasta `dist/` em modo de produção com fallback SPA.
- **Persistência em Nuvem (Firebase Firestore)**: Banco de dados em nuvem Google Cloud Firestore integrado (`erudite-component-q9v0l`), permitindo persistência em tempo real compartilhada entre dispositivos (celulares, tablets, computadores), garantindo funcionamento total na Vercel (onde não há servidor Node residente) e no ambiente containerizado.
- **Persistência Local de Backup**: Arquivo JSON no disco (`/data/db.json`) utilizado como semente (seed) e fallback resiliente.

### 2.2 Frontend
- **Framework**: React 19 com TypeScript.
- **Bundler & Build Tool**: Vite 6.
- **Estilização**: Tailwind CSS v4 (`@tailwindcss/vite` e `@import "tailwindcss";` em `src/index.css`), seguindo tipografia clássica (Cinzel / Sans) e paleta escura (#0d0e11, #12141c, #1a1d2c) com acentos dourados (#d4af37, #f5d77f) e sem gradientes clichês ou bordas desbalanceadas.
- **Animações**: `motion` (importado de `motion/react`).
- **Ícones**: `lucide-react`.

### 2.3 PWA (Progressive Web App)
- **Manifesto**: `/public/manifest.json` com ícones em resoluções 192x192, 512x512 e maskable.
- **Service Worker**: `/public/sw.js` com cache offline de assets fundamentais e estratégia de cache-first com fallback de rede.
- **Instalador Inteligente**: Hook customizado `/src/hooks/usePWAInstall.ts` para captura do evento `beforeinstallprompt`, suportando gatilhos nativos no Android/Chrome e instruções guiadas passo a passo para Safari no iOS.

---

## 3. Modelo de Dados (`/data/db.json`)

O arquivo `/data/db.json` centraliza o estado do sistema:

| Entidade | Descrição | Principais Campos |
| :--- | :--- | :--- |
| `settings` | Configurações gerais da barbearia | `name`, `tagline`, `logo_url`, `hero_image_url`, `phone`, `address` |
| `services` | Catálogo de serviços oferecidos | `id`, `name`, `description`, `price`, `duration_minutes`, `icon_name`, `category`, `active` |
| `barbers` | Profissionais visíveis para agendamento | `id`, `name`, `nickname`, `bio`, `photo_url`, `specialties`, `active`, `phone`, `email`, `rating`, `reviews_count`, `commission_rate`, `has_login`, `login_email` |
| `barber_schedules` | Grade semanal de atendimento de cada barbeiro | `id`, `barber_id`, `day_of_week` (0 a 6), `start_time`, `end_time`, `break_start`, `break_end`, `active` |
| `barber_time_off` | Bloqueios e folgas pontuais | `id`, `barber_id`, `date` (YYYY-MM-DD), `reason`, `full_day`, `start_time`, `end_time` |
| `appointments` | Agendamentos registrados | `id`, `code` (ex: LIB-1234), `service_id`, `barber_id`, `customer_name`, `customer_phone`, `customer_email`, `notes`, `date`, `start_time`, `end_time`, `price`, `status` (`confirmed`, `completed`, `no_show`, `cancelled`), `created_at` |
| `users` | Contas de acesso autenticadas | `id`, `email`, `password`, `name`, `role` (`owner`, `admin`, `barber`), `phone`, `active`, `barber_id`, `commission_rate`, `created_at` |

---

## 4. Matriz de Perfis e Permissões (RBAC)

### 4.1 Proprietário Geral (`owner`)
- **Rotas de Acesso**: `/proprietario`, `/app-dono`, `/dono`.
- **Credenciais Iniciais Padrão**:
  - E-mail principal: `dono@liderbarbers.com.br` (também aceita `allinesoares050@gmail.com` ou `dono`)
  - Senha: `dono`
- **Recurso de Visualização**: Todos os campos de senha possuem botão com ícone de olho (`Eye`/`EyeOff`) para exibir ou ocultar os caracteres digitados.
- **Atribuições**:
  - Visão macro de faturamento bruto e líquido consolidado de toda a rede.
  - Cadastro, edição de dados, redefinição de senha e inativação de contas de **Administradores**.
  - Central de Links para envio de acessos da equipe via WhatsApp ou cópia direta.
  - Instalação e gestão do PWA exclusivo de Dono.

### 4.2 Administrador da Barbearia (`admin`)
- **Rotas de Acesso**: `/admin`, `/app-admin`.
- **Credenciais Iniciais Padrão**: `admin@liberdade.com.br` / `admin`.
- **Atribuições**:
  - O Administrador também é um profissional barbeiro na unidade (`barber_id` correspondente), atendendo clientes e possuindo seu próprio link direto de agendamento (`/agendar?barbeiro=user-admin`).
  - Gestão dos barbeiros da unidade: criação de conta de acesso, ajuste de percentual de comissão (%), horários de atendimento e folgas.
  - Gestão de serviços: criação, alteração de valores, duração e fotos/ícones.
  - Relatório de comissões por período (Hoje, Esta Semana, Este Mês) e exportação de dados.
  - Gestão da agenda geral com filtros de status (`confirmed`, `completed`, `no_show`, `cancelled`).

### 4.3 Barbeiro (`barber`)
- **Rotas de Acesso**: `/barbeiro`, `/portal-barbeiro`, `/app-barbeiro`.
- **Credenciais de Teste**: `marcos@liberdade.com.br` / `barber`, `diego@liberdade.com.br` / `barber`, `andre@liberdade.com.br` / `barber`.
- **Atribuições**:
  - Acesso restrito à sua própria agenda e métricas pessoais.
  - Acompanhamento de comissões líquidas calculadas automaticamente a cada corte concluído.
  - Botão de **Copiar Link Exclusivo do Barbeiro** (`/agendar?barbeiro=[ID]`) para compartilhar com seus clientes nas redes sociais ou WhatsApp.
  - Instalação do app dedicado na tela inicial do celular.

### 4.4 Cliente (`customer`)
- **Rotas de Acesso**: `/`, `/agendar`, `/servicos`, `/barbeiros`, `/confirmacao`.
- **Experiência**:
  - Totalmente pública, sem login obrigatório para agendar.
  - Nenhuma opção ou botão de login de funcionários é visível no rodapé ou no cabeçalho público, evitando confusão para clientes.

---

## 5. Mapeamento de Rotas e Endpoints

### 5.1 Rotas Frontend (SPA)
- `/`: Página inicial com destaques, apresentação da barbearia, chamada para agendamento e depoimentos.
- `/servicos`: Lista completa de serviços agrupados por categoria (Cabelo, Barba, Combos, Tratamentos).
- `/barbeiros`: Equipe de profissionais com bios, avaliações e botão de agendamento direto.
- `/agendar`: Fluxo passo a passo de agendamento (1: Serviço, 2: Barbeiro, 3: Data e Horário, 4: Dados do Cliente).
- `/confirmacao`: Resumo do agendamento concluído com código gerado, botão de WhatsApp e Google Calendar.
- `/proprietario` (e `/app-dono`): Painel Geral do Dono (com tela de login dedicada quando não autenticado).
- `/admin` (e `/app-admin`): Painel de Gestão da Barbearia do Administrador (com login dedicado).
- `/barbeiro` (e `/portal-barbeiro`): Portal do Barbeiro para controle de agenda e comissões (com login dedicado).
- `/auth`: Tela universal de autenticação com seletor de perfil e atalhos de instalação do PWA.

### 5.2 Endpoints da API REST (`server.ts`)
- **Autenticação**:
  - `POST /api/auth/login`: Autentica usuário com e-mail e senha, retornando perfil e token de sessão simulado.
  - `GET /api/auth/me`: Retorna os dados do usuário autenticado no header `Authorization: Bearer <ID>`.
- **Serviços**:
  - `GET /api/services`: Lista todos os serviços ativos (ou todos para admins).
  - `POST /api/services`: Cria novo serviço (requer role `admin` ou `owner`).
  - `PUT /api/services/:id`: Atualiza serviço existente.
  - `DELETE /api/services/:id`: Remove ou desativa serviço.
- **Barbeiros & Agendas**:
  - `GET /api/barbers`: Lista profissionais e especialidades.
  - `POST /api/barbers`: Cria novo profissional e sincroniza conta de acesso.
  - `PUT /api/barbers/:id`: Atualiza profissional e comissão.
  - `GET /api/barbers/:id/schedule`: Retorna grade semanal de trabalho.
  - `PUT /api/barbers/:id/schedule`: Atualiza grade semanal de horários.
  - `GET /api/barbers/:id/time-off`: Lista folgas e bloqueios agendados.
  - `POST /api/barbers/:id/time-off`: Cria folga/bloqueio.
  - `DELETE /api/barbers/time-off/:id`: Remove folga.
- **Disponibilidade & Agendamentos**:
  - `GET /api/availability`: Calcula slots livres com base na duração do serviço, horário do barbeiro, intervalos de almoço, agendamentos já existentes e folgas.
  - `GET /api/appointments`: Lista agendamentos com filtros por data, barbeiro e status.
  - `POST /api/appointments`: Cria novo agendamento, gera código único (`LIB-XXXX`) e valida conflitos de horário.
  - `PATCH /api/appointments/:id/status`: Altera status (`confirmed`, `completed`, `no_show`, `cancelled`).
- **Administração & Dono**:
  - `GET /api/owner/overview`: Retorna métricas globais de faturamento bruto/líquido, total de agendamentos e detalhamento por profissional.
  - `GET /api/owner/admins`: Lista administradores cadastrados com status.
  - `POST /api/owner/admins`: Cadastra novo administrador (com vinculação como barbeiro).
  - `PUT /api/owner/admins/:id`: Atualiza administrador (inclusive alteração de senha e status).
  - `GET /api/admin/barbers-accounts`: Lista contas de barbeiros vinculadas.
  - `POST /api/admin/barbers-accounts`: Cria ou atualiza conta de login do barbeiro.
  - `GET /api/admin/barbers-revenue`: Retorna faturamento e comissões detalhadas por profissional e período.
- **Configurações**:
  - `GET /api/settings`: Retorna configurações da loja (nome, telefone, endereço, logos).
  - `PUT /api/settings`: Atualiza configurações da loja.

---

## 6. Estrutura de Pastas do Projeto

```
/
├── .env.example                     # Declaração de variáveis de ambiente
├── AGENTS.md                        # Instruções de sistema persistentes para a IA
├── DOCUMENTACAO-PROJETO.md          # Esta documentação oficial e viva do projeto
├── package.json                     # Scripts de dev/build/start e dependências
├── server.ts                        # Servidor Express, API REST e integração com Vite
├── tsconfig.json                    # Configuração do TypeScript
├── vite.config.ts                   # Configuração do Vite e Tailwind CSS v4
├── data/
│   └── db.json                      # Base de dados JSON persistida em disco
├── public/
│   ├── manifest.json                # Manifesto PWA com metadados e ícones
│   ├── sw.js                        # Service Worker para suporte PWA e offline
│   ├── pwa-192x192.png              # Ícone do aplicativo 192px
│   ├── pwa-512x512.png              # Ícone do aplicativo 512px
│   └── apple-touch-icon.png         # Ícone para dispositivos iOS
└── src/
    ├── main.tsx                     # Ponto de entrada do React
    ├── App.tsx                      # Componente raiz, roteador e layouts
    ├── types.ts                     # Interfaces e tipos globais TypeScript
    ├── index.css                    # Folha de estilos global com Tailwind v4
    ├── context/
    │   ├── AuthContext.tsx          # Gerenciamento de sessão, login, logout e role
    │   ├── RouterContext.tsx        # Navegação SPA personalizada sem bibliotecas externas
    │   └── SettingsContext.tsx      # Dados da loja sincronizados em tempo real
    ├── hooks/
    │   └── usePWAInstall.ts         # Hook para gerenciamento do prompt de instalação PWA
    ├── components/
    │   ├── Header.tsx               # Barra de navegação com tema escuro e drawer mobile
    │   ├── Footer.tsx               # Rodapé informativo para o público geral
    │   ├── DedicatedRolePortalLogin.tsx # Tela de login elegante para links diretos de papéis
    │   ├── RoleAppDownloadCard.tsx  # Card para baixar e instalar o app específico da função
    │   ├── InstallAppModal.tsx      # Modal com instruções detalhadas para Android e iOS
    │   ├── PWAInstallButton.tsx     # Botão genérico de instalação PWA
    │   ├── AdminBarberAccountsTab.tsx # Gestão de contas e comissões dos barbeiros
    │   ├── AdminSettingsTab.tsx     # Configurações de serviços e da loja
    │   └── BarberRevenueTab.tsx     # Relatórios financeiros e extrato de comissões
    └── pages/
        ├── HomePage.tsx             # Landing page moderna com CTA e depoimentos
        ├── ServicesPage.tsx         # Catálogo de serviços com botões de agendamento
        ├── BarbersPage.tsx          # Apresentação dos barbeiros e agendamento direto
        ├── BookingFlow.tsx          # Assistente de agendamento em 4 etapas
        ├── BookingConfirmationPage.tsx # Tela de confirmação e ações pós-agendamento
        ├── OwnerDashboard.tsx       # Painel do Dono (faturamento global, admins, links)
        ├── AdminDashboard.tsx       # Painel do Administrador (agenda, barbeiros, serviços)
        ├── BarberDashboard.tsx      # Painel do Barbeiro (minha agenda, minhas comissões)
        └── AuthPage.tsx             # Login de fallback com seletor de papéis
```

---

## 7. Diretrizes e Regras de Negócio Críticas

1. **Cálculo de Comissões**:
   - Cada atendimento concluído (`status === 'completed'`) gera comissão calculada com base no percentual (`commission_rate`) atribuído àquele barbeiro (padrão: 50%).
   - Faturamento Líquido do Barbeiro = `preço_servico * (commission_rate / 100)`.
   - Faturamento da Casa = `preço_servico * (1 - (commission_rate / 100))`.
2. **Conflito de Horários**:
   - Não é permitido agendar se já existir um compromisso confirmado (`confirmed`) no mesmo intervalo de tempo para o mesmo barbeiro.
   - O intervalo de almoço/pausa configurado em `barber_schedules` bloqueia os horários correspondentes.
   - Folgas cadastradas em `barber_time_off` bloqueiam o dia inteiro ou o intervalo especificado.
3. **Privacidade do Cliente**:
   - Clientes não possuem visão de comissões, faturamento interno ou dados de outros clientes.
   - Links administrativos não devem ser expostos na interface pública do cliente.
4. **Links de Agendamento por Barbeiro**:
   - Quando a rota `/agendar?barbeiro=[ID]` é acessada, o passo de seleção do profissional é automaticamente preenchido com o barbeiro correspondente, agilizando a conversão para o profissional.

---

## 8. Histórico de Alterações

| Data (UTC/Local) | Autor | Descrição da Alteração | Módulos Impactados |
| :--- | :--- | :--- | :--- |
| **2026-09-17** | IA Assistant | **Correção de Erro de Execução (`Uncaught TypeError: Cannot read properties of undefined (reading 'toFixed')`)**: Implementação de `getAdminMetricsFS` no serviço de Firestore (`firestoreService.ts`) e conexão direta em `api.ts`, alinhando os campos retornados com a interface esperada pelo painel administrativo (`totalForecastRevenue`, `totalRealizedRevenue`, `barberMetrics`, etc.). Adição de tratamento defensivo universal (`Number(val || 0).toFixed(2)` e `(str || '').split(...)`) em todas as telas e componentes (`AdminDashboard.tsx`, `HomePage.tsx`, `ServicesPage.tsx`, `BookingFlow.tsx`, `BookingConfirmationPage.tsx`, `BarberDashboard.tsx`, `BarberRevenueTab.tsx` e `OwnerDashboard.tsx`), impedindo que valores nulos ou indefinidos quebrem a renderização. | `firestoreService.ts`, `api.ts`, `AdminDashboard.tsx`, `HomePage.tsx`, `ServicesPage.tsx`, `BookingFlow.tsx`, `BookingConfirmationPage.tsx`, `BarberDashboard.tsx`, `BarberRevenueTab.tsx`, `OwnerDashboard.tsx`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-17** | IA Assistant | **Recurso de Visualização de Senha (Toggle com Ícone de Olho)**: Implementação do botão com ícone de olho (`Eye` / `EyeOff` de `lucide-react`) em todos os formulários e campos de senha da aplicação (`DedicatedRolePortalLogin.tsx`, `AuthPage.tsx`, `OwnerDashboard.tsx` e `AdminBarberAccountsTab.tsx`), permitindo que o usuário visualize ou oculte os caracteres digitados. Adição de card indicador com a credencial inicial padrão e flexibilização de login por e-mail/apelido. | `DedicatedRolePortalLogin.tsx`, `AuthPage.tsx`, `OwnerDashboard.tsx`, `AdminBarberAccountsTab.tsx`, `src/lib/firestoreService.ts`, `server.ts`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-17** | IA Assistant | **Integração Completa do Banco de Dados Cloud (Firebase Firestore)**: Provisão e configuração do projeto Firebase `erudite-component-q9v0l`, criação e deploy de `firestore.rules`, especificação em `firebase-blueprint.json`, inicialização segura do SDK em `src/lib/firebase.ts`, criação da camada de serviço `src/lib/firestoreService.ts` com rotina de auto-seeding a partir de `/data/db.json`, e conexão de todos os métodos de agendamento, profissionais, serviços, bloqueios, métricas e autenticação em `src/lib/api.ts`. Agora os dados persistem em nuvem em tempo real e sincronizam instantaneamente entre todos os celulares e computadores, inclusive no deploy da Vercel. | `firebase-blueprint.json`, `firestore.rules`, `src/lib/firebase.ts`, `src/lib/firestoreService.ts`, `src/lib/api.ts`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-17** | IA Assistant | Resolução do erro 404 de rotas na Vercel e provedores estáticos: criação de `vercel.json` com regra de rewrite para `/index.html`, criação de `public/_redirects`, criação de fallback `public/404.html` e aprimoramento do `RouterContext.tsx` com suporte resiliente a hash routes (`#/proprietario`) e redirecionamentos por query parameter (`?p=`). | `vercel.json`, `public/_redirects`, `public/404.html`, `RouterContext.tsx`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-17** | IA Assistant | Criação e formalização da documentação viva oficial do projeto (`DOCUMENTACAO-PROJETO.md`) e configuração do `AGENTS.md` para forçar leitura e atualização contínua em todos os turnos. | `DOCUMENTACAO-PROJETO.md`, `AGENTS.md` |
| **2026-09-17** | IA Assistant | Implementação do isolamento de acessos: remoção de botões de login do rodapé/menu de clientes, criação de portais e links dedicados para Dono (`/proprietario`), Administrador (`/admin`) e Barbeiro (`/barbeiro`) com suporte e instruções para instalação do PWA em cada função. | `Header.tsx`, `Footer.tsx`, `OwnerDashboard.tsx`, `AdminDashboard.tsx`, `BarberDashboard.tsx`, `AuthPage.tsx`, `DedicatedRolePortalLogin.tsx`, `RoleAppDownloadCard.tsx`, `InstallAppModal.tsx` |
| **2026-09-17** | IA Assistant | Configuração do suporte PWA com `manifest.json`, Service Worker em `sw.js`, ícones em múltiplos tamanhos e hook `usePWAInstall`. | `/public/manifest.json`, `/public/sw.js`, `usePWAInstall.ts` |
| **2026-09-17** | IA Assistant | Desenvolvimento do módulo financeiro do Dono e Administrador, com relatórios de comissões por barbeiro, faturamento bruto/líquido e exportação. | `OwnerDashboard.tsx`, `AdminDashboard.tsx`, `BarberRevenueTab.tsx`, `server.ts` |
