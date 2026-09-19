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
- **Os 2 Links Exclusivos de Cada Barbeiro**:
  1. **Link do App do Barbeiro** (`/barbeiro`): Link do portal exclusivo para o barbeiro abrir no celular, fazer login na sua conta pessoal e instalar o aplicativo PWA direto na tela inicial.
  2. **Link Direto para Clientes** (`/agendar?barbeiro=[ID]`): Link exclusivo que o barbeiro envia aos seus clientes (no WhatsApp, Instagram, bio). Ao clicar, o cliente já cai diretamente no fluxo de agendamento com o banner VIP do profissional e ele já vem **100% pré-selecionado**, pulando a escolha de barbeiro.
- **Onde esses links ficam disponíveis**:
  - **No Painel do Administrador** (`/admin` -> aba *Acessos dos Barbeiros*): Em cada card de barbeiro cadastrado há a seção **"Links deste Barbeiro"** com botões de *Copiar Link*, disparo direto no *WhatsApp* com mensagem formatada e botão de *Testar*.
  - **No Painel do Próprio Barbeiro** (`/barbeiro`): O barbeiro visualiza o card de instalação do seu app no topo e o banner com seu link exclusivo de clientes com botões de *Copiar*, *WhatsApp* e *Testar*.
- **Atribuições**:
  - Acesso restrito à sua própria agenda e métricas pessoais.
  - Acompanhamento de comissões líquidas calculadas automaticamente a cada corte concluído.
  - Instalação do app dedicado na tela inicial do celular.

### 4.4 Cliente (`customer`)
- **Rotas de Acesso**: `/`, `/agendar`, `/meus-agendamentos` (e `/meus-horarios`, `/historico`), `/servicos`, `/equipe`, `/agendamento/:codigo`.
- **Experiência do Cliente e Histórico**:
  - Ao realizar o primeiro agendamento (ou subsequentes), os dados do cliente (telefone, nome e código do agendamento) são armazenados no `localStorage` do navegador via `customerStorage.ts`.
  - Na tela **"Meus Agendamentos"** (`/meus-agendamentos`), o cliente visualiza:
    1. **Agendamento Ativo / Agendado**: Cartão VIP com moldura dourada e status de confirmação, contendo data formatada, horário, profissional barbeiro (com foto e especialidade), serviço, código da reserva, botão de compartilhamento no WhatsApp, link para o comprovante e opção de cancelamento.
    2. **Histórico de Agendamentos Realizados**: Lista com todos os cortes e atendimentos passados (concluídos, cancelados ou ausentes), valores pagos e o botão **"Repetir Agendamento"** que permite agendar com o mesmo barbeiro com 1 clique.
    3. **Resiliência Multi-Aparelho**: Campo de busca rápida por número de WhatsApp/Telefone ou por código de reserva (`LIB-XXXX`), permitindo consultar agendamentos mesmo ao trocar de celular ou computador.
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
    ├── lib/
    │   ├── api.ts                   # Camada de comunicação de rede unificada
    │   ├── firebase.ts              # Inicialização do Firebase SDK
    │   ├── firestoreService.ts      # Serviços Firestore com hidratação e fallback
    │   └── customerStorage.ts       # Persistência local de agendamentos e telefone do cliente
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
        ├── MyAppointmentsPage.tsx   # Painel do Cliente com agendamento ativo e histórico
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
4. **Links de Agendamento por Barbeiro com Nome Legível**:
   - Quando a rota `/agendar?barbeiro=[NOME_DO_BARBEIRO]` é acessada (ex: `https://lider-barbers-pi.vercel.app/agendar?barbeiro=André Santana`), o sistema identifica o barbeiro pelo nome completo, primeiro nome, apelido ou ID de forma resiliente e insensível a acentos/maiúsculas (`normalizeString`). O barbeiro vem pré-selecionado com banner VIP e foto, e os horários são carregados diretamente para ele.
5. **Histórico do Cliente & Agendamento Ativo**:
   - Qualquer agendamento realizado salva automaticamente o número de telefone e o código no navegador do cliente (`customerStorage.ts`). Na rota `/meus-agendamentos`, o cliente visualiza instantaneamente seu agendamento atual (destaque dourado, data, hora, barbeiro, serviço e opção de cancelamento) e seu histórico completo de cortes passados, com botão para repetir agendamento em 1 toque.

---

## 8. Histórico de Alterações

| Data (UTC/Local) | Autor | Descrição da Alteração | Módulos Impactados |
| :--- | :--- | :--- | :--- |
| **2026-09-18** | IA Assistant | **Otimização de Espaçamento e Unificação em Linha Única do Título da Página Inicial (`HomePage.tsx`, `PWAInstallButton.tsx`)**: Atendendo ao feedback de layout e densidade visual do usuário: (1) **Título em Linha Única ("A ARTE DO CORTE,")**: A primeira parte do título foi unificada com classe `whitespace-nowrap` e ajuste fino do tamanho de fonte responsivo (`text-[25px] xs:text-[27px] sm:text-4xl md:text-5xl lg:text-6xl`), garantindo que em qualquer celular a frase "A ARTE DO CORTE," fique integralmente em uma única linha sem quebras desnecessárias, seguida harmoniosamente da segunda linha em degradê dourado "A PRECISÃO DA NAVALHA."; (2) **Redução Drástica do Espaço em Branco (Densidade Visual Aprimorada)**: Diminuição do padding vertical do Hero (`pt-5 pb-7 sm:py-16 lg:py-20`), redução do espaçamento entre títulos, texto e botões de ação (`space-y-3.5 sm:space-y-5`, `pt-0.5`), diminuição do gap do grid mobile para 20px (`gap-5`) e limitação da altura da foto do Hero em celulares (`max-h-[350px] aspect-[4/3] sm:aspect-[4/5]`); (3) **Compactação das Seções de Serviços, Barbeiros e Rodapé**: Redução do padding superior/inferior das seções para `py-8 sm:py-16`, diminuição das margens dos cabeçalhos (`mb-6 sm:mb-10`) e dos botões de catálogo; (4) **Banner PWA Autocontido**: O componente `PWAInstallButton` agora encapsula sua própria seção e se oculta completamente sem deixar faixas vazias ou bordas órfãs quando não estiver ativo ou já instalado. | `HomePage.tsx`, `PWAInstallButton.tsx`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-18** | IA Assistant | **Implementação do Seletor de Modo Claro e Modo Escuro (Light / Dark Mode)**: Implementação completa de alternância de tema entre Modo Escuro (identidade dourada clássica sobre fundo escuro `#0d0e11`) e Modo Claro (layout luminoso, de alto contraste `#f8fafc` / `#ffffff`, bordas sutis `#e2e8f0` e tipografia nítida `#0f172a` com acentos em ouro queimado de alta legibilidade). (1) **Contexto Global de Tema (`ThemeContext.tsx`)**: Gerencia o estado (`dark` | `light`), escuta preferências do sistema (`prefers-color-scheme`), aplica classes e atributos na raiz `document.documentElement` (`class="light"` ou `class="dark"`) e persiste a escolha no `localStorage` sob a chave `lider_barbers_theme`; (2) **Componente Seletor de Tema (`ThemeToggle.tsx`)**: Disponível em versão compacta de ícone (Sol/Lua com animação de rotação suave) e versão segmentada completa ("Modo Escuro" / "Modo Claro"); (3) **Integração nas Telas**: Presente no cabeçalho principal (`Header.tsx`), no menu lateral móvel, no rodapé (`Footer.tsx`) e nos painéis do Administrador (`AdminDashboard.tsx`), Dono (`OwnerDashboard.tsx`) e Barbeiro (`BarberDashboard.tsx`); (4) **Camada de Estilos Globais (`index.css`)**: Regras abrangentes de adaptação garantindo legibilidade perfeita, contraste WCAG AA, preservação dos botões dourados e suporte a todos os formulários, tabelas e modais. | `ThemeContext.tsx`, `ThemeToggle.tsx`, `App.tsx`, `Header.tsx`, `Footer.tsx`, `AdminDashboard.tsx`, `OwnerDashboard.tsx`, `BarberDashboard.tsx`, `index.css`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-18** | IA Assistant | **Personalização Mobile dos Agendamentos no Admin, Ocultação Inteligente do Instalador PWA e Ocultação de Comissões**: (1) **Cards Personalizados de Agendamento para Modo Celular (`AdminDashboard.tsx`)**: Redesenho completo da aba de agendamentos do Administrador para dispositivos móveis (`block md:hidden`). Em telas de celulares, a tabela convencional é substituída por cartões elegantes, ricos em informações e de fácil interação tátil: código com botão de cópia em 1 toque, badge de status iluminado, dados do cliente com botões diretos de **WhatsApp** (com mensagem personalizada pronta) e **Ligação**, bloco de serviço & preço em dourado, horário com nome do barbeiro, seletor de situação com toque amplo e botão instantâneo de atalho `✓ Concluir` para atendimentos confirmados. Em telas de computador (`hidden md:block`), a tabela detalhada permanece ativa; (2) **Ocultação Automática do Card de Download do App (`RoleAppDownloadCard.tsx`)**: O card de instalação do PWA agora detecta automaticamente se o aplicativo já está instalado no celular (via modo `display-mode: standalone` ou hook `usePWAInstall`) ou se o usuário optou por fechar o banner com o novo botão "Fechar", persistindo a preferência em `localStorage` para não poluir a tela; (3) **Remoção de Campos e Exibições de Comissão (`AdminBarberAccountsTab.tsx`, `BarberRevenueTab.tsx`, `DedicatedRolePortalLogin.tsx`, `AdminDashboard.tsx`)**: Remoção dos campos de porcentagem de comissão, botões de alteração de taxa e menções a comissões na gestão de barbeiros e no portal do barbeiro, focando o relatório no faturamento líquido e simplificando o fluxo de cadastro. | `AdminDashboard.tsx`, `RoleAppDownloadCard.tsx`, `AdminBarberAccountsTab.tsx`, `BarberRevenueTab.tsx`, `DedicatedRolePortalLogin.tsx`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-18** | IA Assistant | **Refinamento Visual da Interface de Agendamento e Home**: (1) **Remoção do Banner Superior de Link Exclusivo & Reposicionamento do Card de Profissional**: No fluxo de agendamento (`BookingFlow.tsx`), foi removido o banner volumoso de topo e realocado o card compacto de seleção de Profissional (pré-selecionado ou manual) diretamente para o topo da etapa de agendamento, posicionado logo acima do resumo do serviço selecionado, eliminando duplicidade visual; (2) **Remoção do Banner de Notificação de Preenchimento Automático do Voucher**: No bloco de dados de contato do cliente, foi removida a faixa informativa de texto `Seus dados foram preenchidos automaticamente...`, mantendo o badge discreto e elegante `Salvo anteriormente`; (3) **Remoção da Tag/Badge do Hero da Página Inicial**: Na página inicial (`HomePage.tsx`), foi removido o badge superior `✨ Tradição, Visagismo & Alta Precisão` acima do título principal, conferindo uma apresentação mais limpa e direta. | `BookingFlow.tsx`, `HomePage.tsx`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-18** | IA Assistant | **Otimização de Build para Vercel (`vercel.json`)**: Configuração explícita de `"framework": "vite"`, `"buildCommand": "vite build"` e `"outputDirectory": "dist"` no arquivo `/vercel.json`. Isso evita que a Vercel trave na etapa de inicialização tentando inferir o runtime de backend ou executando scripts adicionais de compilação do Node, permitindo que a Vercel compile a aplicação React estática em segundos e sirva os arquivos diretamente da pasta `dist/` com roteamento SPA preservado. | `vercel.json`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-18** | IA Assistant | **Blindagem Definitiva de Fuso Horário do Brasil (`America/Sao_Paulo`) e Filtro Visual de Horários Passados**: (1) **Padronização Universal do Fuso Horário de Brasília**: Implementada a função universal `getBrazilDateTime()` utilizando `Intl.DateTimeFormat` com fuso horário estrito `timeZone: 'America/Sao_Paulo'` tanto no cliente (`BookingFlow.tsx`), no Firestore (`firestoreService.ts`) quanto no servidor Node/Express (`server.ts`). Isso elimina qualquer discrepância de horário decorrente de servidores ou contêineres rodando em UTC ou fuso dos EUA (ex: Costa Oeste/Leste), garantindo que às 17:45 no Brasil, os minutos atuais sejam calculados com exatidão (`17 * 60 + 45 = 1065 min`); (2) **Filtro Visual Duplo (`visibleSlots`) no Componente**: Adicionada filtragem defensiva e impermeável na renderização do grid de horários no front-end (`BookingFlow.tsx`). Mesmo em caso de latência de rede ou cache antigo de requisições, qualquer horário que já tenha passado em relação ao horário oficial de Brasília é matematicamente descartado antes de desenhar o botão na tela; (3) **Avanço Intuitivo para o Dia Seguinte**: Se todos os horários do dia atual já tiverem passado (ou já estiverem agendados), o sistema exibe mensagem clara e o botão de atalho destacado "Ver Horários de Amanhã"; (4) **Reinício do Dev Server**: O servidor de desenvolvimento foi devidamente reiniciado para aplicar imediatamente todas as rotinas em tempo real. | `BookingFlow.tsx`, `firestoreService.ts`, `server.ts`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-18** | IA Assistant | **Bloqueio Absoluto de Horários Passados e Ocupados (Filtro em Tempo Real & Validação Anti-Conflito)**: (1) **Exclusão de Horários Passados**: Correção do cálculo de disponibilidade de horários tanto no Firestore (`getAvailabilityFS` em `firestoreService.ts`), no backend Express (`calculateAvailableSlots` em `server.ts` com suporte a fuso horário do Brasil `America/Sao_Paulo`) quanto no front-end (`BookingFlow.tsx`). Quando a data selecionada for hoje, qualquer horário que já tenha passado (com margem de segurança de tolerância) é sumariamente excluído e não aparece como opção para o cliente. Se todos os horários do dia atual já tiverem passado, é exibido aviso explicativo e botão para avançar para o dia seguinte ("Ver Horários de Amanhã") em 1 toque; (2) **Ocultação de Horários Já Agendados**: Ajuste da regra de filtragem de conflitos para que qualquer agendamento com `status !== 'cancelled'` (ou seja, `confirmed`, `completed`, `pending` etc.) bloqueie imediatamente o horário daquele profissional, impedindo que o horário apareça disponível na grade; (3) **Validação no Momento do Agendamento**: Tanto `createAppointmentFS` quanto o endpoint `POST /api/appointments` e a checagem prévia no `BookingFlow.tsx` barram tentativas de agendar horários passados ou horários que colidam com outro agendamento ativo, além de corrigir a atribuição automática em reservas com a opção "Qualquer Barbeiro" para sempre selecionar um profissional genuinamente livre. | `firestoreService.ts`, `server.ts`, `BookingFlow.tsx`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-18** | IA Assistant | **Recebimento Instantâneo de Agendamentos em Tempo Real & Persistência Permanente dos Dados do Cliente**: (1) **Tempo Real para Barbeiros e Administradores**: Implementação de sincronização instantânea em tempo real utilizando listeners `onSnapshot` do Firebase Firestore (`subscribeToAppointmentsFS` e `subscribeToAppointments`), complementados por ciclo de polling automático em segundo plano a cada 7 segundos e detectores de foco de tela (`visibilitychange` e `window.focus`). O barbeiro agora recebe qualquer novo agendamento no exato segundo em que o cliente reserva, sem necessidade de atualizar o aplicativo ou recarregar o navegador. Inclui sinal sonoro harmônico de sino (Dual-Tone Chime via Web Audio API), notificação de destaque com o nome do cliente e badge visual "Tempo Real Ativo"; (2) **Persistência dos Dados do Cliente**: Implementação de pré-preenchimento e persistência contínua dos dados de contato do cliente (`saveCustomerProfile`, `formatPhoneBR` em `customerStorage.ts`). Ao efetuar o primeiro agendamento, o nome e WhatsApp do cliente são gravados. Em todos os agendamentos futuros, os campos já aparecem 100% preenchidos e validados com aviso confirmatório, evitando que o cliente tenha que redigitar suas informações repetidamente. | `BarberDashboard.tsx`, `AdminDashboard.tsx`, `BookingFlow.tsx`, `customerStorage.ts`, `firestoreService.ts`, `api.ts`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-18** | IA Assistant | **Refinamento e Redesenho do Topo da Área de Agendamentos (`MyAppointmentsPage.tsx`)**: Ajuste responsivo de alta precisão para mobile. Substituído o cabeçalho volumoso com fontes serifadas pesadas (`font-black text-xl`), badge deformado e botão truncado por uma barra sutil, proporcional e minimalista (`text-xs font-bold text-neutral-300` e botão compacto `+ Novo Agendamento` com `border border-[#d4af37]/40`). Eliminada qualquer quebra de linha indesejada ou estouro de largura na tela de smartphones, garantindo que o **Card Dourado do Agendamento Ativo** brilhe como foco principal imediato. Harmonizada também a tipografia do cabeçalho da seção de Histórico de Atendimentos. | `MyAppointmentsPage.tsx`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-18** | IA Assistant | **Simplificação Visual e Foco Total no Card de Agendamento (`MyAppointmentsPage.tsx`)**: Remoção do cabeçalho volumoso ("Área do Cliente / Olá, [Nome]") e do bloco fixo superior de consulta ("Consultar por Telefone/Código"), atendendo ao pedido do usuário para que a tela ficasse limpa e focada no card do agendamento. O cliente agora entra na página e vê imediatamente no topo a linha limpa de status ("HORÁRIO AGENDADO" + botão "+ Novo Agendamento") seguida diretamente do **Card Dourado do Agendamento Ativo** com todos os dados do corte, barbeiro e ações. A ferramenta de consulta manual foi preservada e realocada como opção recolhível discreta no rodapé da página. | `MyAppointmentsPage.tsx`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-18** | IA Assistant | **Histórico de Agendamentos e Visualização de Agendamento Ativo para Clientes**: Implementação de sistema completo para o cliente acompanhar seus atendimentos. Criado o módulo `src/lib/customerStorage.ts` para persistência no `localStorage` de telefone, nome e códigos de agendamentos. Criados os endpoints e métodos de consulta no servidor (`GET /api/appointments/customer`), Firestore (`getCustomerAppointmentsFS`) e API (`fetchCustomerAppointments`). Criada a nova página `src/pages/MyAppointmentsPage.tsx` acessível via `/meus-agendamentos` (com aliases `/meus-horarios`, `/historico`, `/minhas-reservas`), exibindo: (1) Card de destaque do **Horário Agendado / Ativo** com data, hora, barbeiro com foto, serviço, código da reserva, link de compartilhamento no WhatsApp e cancelamento; (2) **Histórico de Atendimentos Anteriores** com status (concluído, cancelado), data, valor e botão "Repetir Agendamento" com 1 clique; (3) Consulta flexível por número de telefone/WhatsApp ou código `LIB-XXXX`. Integrado nos menus em `Header.tsx`, `Footer.tsx`, no fluxo `BookingFlow.tsx` e no comprovante `BookingConfirmationPage.tsx`. | `MyAppointmentsPage.tsx`, `customerStorage.ts`, `server.ts`, `firestoreService.ts`, `api.ts`, `RouterContext.tsx`, `App.tsx`, `Header.tsx`, `Footer.tsx`, `BookingFlow.tsx`, `BookingConfirmationPage.tsx`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-18** | IA Assistant | **Links de Agendamento com Nome do Barbeiro na URL (`?barbeiro=Nome do Barbeiro`)**: Modificação do padrão de links de agendamento em todos os painéis (`AdminBarberAccountsTab.tsx`, `BarberDashboard.tsx`, `AdminDashboard.tsx`, `HomePage.tsx` e `BarbersPage.tsx`) para utilizarem o nome do barbeiro no parâmetro de URL (ex: `/agendar?barbeiro=André Santana`) em vez do identificador técnico (`barber-3`). No fluxo de agendamento (`BookingFlow.tsx`), foi implementada a função `findBarberByQuery` com normalização de acentos (`NFD`), insensibilidade a maiúsculas/minúsculas e correspondência resiliente por nome completo, primeiro nome, apelido e ID legados, além de sincronização reativa com os `searchParams` do `RouterContext.tsx`. | `BookingFlow.tsx`, `AdminBarberAccountsTab.tsx`, `BarberDashboard.tsx`, `AdminDashboard.tsx`, `HomePage.tsx`, `BarbersPage.tsx`, `RouterContext.tsx`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-17** | IA Assistant | **Identificação Clara do Barbeiro nos Cards e Links de Compartilhamento**: Resolução do problema em que os cards de acesso dos barbeiros no painel do administrador (`AdminBarberAccountsTab.tsx`) não exibiam claramente o nome do profissional. Foi feita a unificação e enriquecimento bidirecional dos dados entre catálogo de barbeiros (`barbers`) e contas de usuários (`users`) tanto no Firestore (`getAdminBarberAccountsFS`) quanto no servidor (`server.ts`) e no hook `loadData`. Cada card agora exibe de forma destacada a foto de perfil/avatar com iniciais, o **Nome Completo do Barbeiro**, seu apelido entre aspas, o badge com `ID`, status de login, e na seção de links: título personalizado com o nome do barbeiro ("Links Exclusivos: [Nome]", "1. App de [Nome]", "2. Link para Clientes (Cai direto com [Nome])"), prévia visível da URL com o parâmetro `?barbeiro=[ID]` e mensagens personalizadas no WhatsApp com o nome do profissional. | `AdminBarberAccountsTab.tsx`, `src/lib/firestoreService.ts`, `server.ts`, `src/types.ts`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-17** | IA Assistant | **Central de Links Exclusivos por Barbeiro (App da Equipe e Link Direto de Clientes)**: Implementação no painel de Acessos dos Barbeiros (`AdminBarberAccountsTab.tsx`) de cartões individuais com os dois links essenciais para cada profissional cadastrado: (1) **Link do App do Barbeiro** (`/barbeiro`) com botão de cópia e disparo no WhatsApp com mensagem de boas-vindas e credenciais; (2) **Link Direto de Clientes** (`/agendar?barbeiro=[ID]`) com botão de cópia, compartilhamento no WhatsApp e botão de teste direto, garantindo que o cliente abra a agenda com o barbeiro já pré-selecionado com selo VIP. Inclusão também do botão de compartilhamento via WhatsApp no topo do portal do próprio barbeiro (`BarberDashboard.tsx`) e do administrador (`AdminDashboard.tsx`). | `AdminBarberAccountsTab.tsx`, `BarberDashboard.tsx`, `AdminDashboard.tsx`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-17** | IA Assistant | **Correção de Erro de Execução (`Uncaught TypeError: Cannot read properties of undefined (reading 'toFixed')`)**: Implementação de `getAdminMetricsFS` no serviço de Firestore (`firestoreService.ts`) e conexão direta em `api.ts`, alinhando os campos retornados com a interface esperada pelo painel administrativo (`totalForecastRevenue`, `totalRealizedRevenue`, `barberMetrics`, etc.). Adição de tratamento defensivo universal (`Number(val || 0).toFixed(2)` e `(str || '').split(...)`) em todas as telas e componentes (`AdminDashboard.tsx`, `HomePage.tsx`, `ServicesPage.tsx`, `BookingFlow.tsx`, `BookingConfirmationPage.tsx`, `BarberDashboard.tsx`, `BarberRevenueTab.tsx` e `OwnerDashboard.tsx`), impedindo que valores nulos ou indefinidos quebrem a renderização. | `firestoreService.ts`, `api.ts`, `AdminDashboard.tsx`, `HomePage.tsx`, `ServicesPage.tsx`, `BookingFlow.tsx`, `BookingConfirmationPage.tsx`, `BarberDashboard.tsx`, `BarberRevenueTab.tsx`, `OwnerDashboard.tsx`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-17** | IA Assistant | **Recurso de Visualização de Senha (Toggle com Ícone de Olho)**: Implementação do botão com ícone de olho (`Eye` / `EyeOff` de `lucide-react`) em todos os formulários e campos de senha da aplicação (`DedicatedRolePortalLogin.tsx`, `AuthPage.tsx`, `OwnerDashboard.tsx` e `AdminBarberAccountsTab.tsx`), permitindo que o usuário visualize ou oculte os caracteres digitados. Adição de card indicador com a credencial inicial padrão e flexibilização de login por e-mail/apelido. | `DedicatedRolePortalLogin.tsx`, `AuthPage.tsx`, `OwnerDashboard.tsx`, `AdminBarberAccountsTab.tsx`, `src/lib/firestoreService.ts`, `server.ts`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-17** | IA Assistant | **Integração Completa do Banco de Dados Cloud (Firebase Firestore)**: Provisão e configuração do projeto Firebase `erudite-component-q9v0l`, criação e deploy de `firestore.rules`, especificação em `firebase-blueprint.json`, inicialização segura do SDK em `src/lib/firebase.ts`, criação da camada de serviço `src/lib/firestoreService.ts` com rotina de auto-seeding a partir de `/data/db.json`, e conexão de todos os métodos de agendamento, profissionais, serviços, bloqueios, métricas e autenticação em `src/lib/api.ts`. Agora os dados persistem em nuvem em tempo real e sincronizam instantaneamente entre todos os celulares e computadores, inclusive no deploy da Vercel. | `firebase-blueprint.json`, `firestore.rules`, `src/lib/firebase.ts`, `src/lib/firestoreService.ts`, `src/lib/api.ts`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-17** | IA Assistant | Resolução do erro 404 de rotas na Vercel e provedores estáticos: criação de `vercel.json` com regra de rewrite para `/index.html`, criação de `public/_redirects`, criação de fallback `public/404.html` e aprimoramento do `RouterContext.tsx` com suporte resiliente a hash routes (`#/proprietario`) e redirecionamentos por query parameter (`?p=`). | `vercel.json`, `public/_redirects`, `public/404.html`, `RouterContext.tsx`, `DOCUMENTACAO-PROJETO.md` |
| **2026-09-17** | IA Assistant | Criação e formalização da documentação viva oficial do projeto (`DOCUMENTACAO-PROJETO.md`) e configuração do `AGENTS.md` para forçar leitura e atualização contínua em todos os turnos. | `DOCUMENTACAO-PROJETO.md`, `AGENTS.md` |
| **2026-09-17** | IA Assistant | Implementação do isolamento de acessos: remoção de botões de login do rodapé/menu de clientes, criação de portais e links dedicados para Dono (`/proprietario`), Administrador (`/admin`) e Barbeiro (`/barbeiro`) com suporte e instruções para instalação do PWA em cada função. | `Header.tsx`, `Footer.tsx`, `OwnerDashboard.tsx`, `AdminDashboard.tsx`, `BarberDashboard.tsx`, `AuthPage.tsx`, `DedicatedRolePortalLogin.tsx`, `RoleAppDownloadCard.tsx`, `InstallAppModal.tsx` |
| **2026-09-17** | IA Assistant | Configuração do suporte PWA com `manifest.json`, Service Worker em `sw.js`, ícones em múltiplos tamanhos e hook `usePWAInstall`. | `/public/manifest.json`, `/public/sw.js`, `usePWAInstall.ts` |
| **2026-09-17** | IA Assistant | Desenvolvimento do módulo financeiro do Dono e Administrador, com relatórios de comissões por barbeiro, faturamento bruto/líquido e exportação. | `OwnerDashboard.tsx`, `AdminDashboard.tsx`, `BarberRevenueTab.tsx`, `server.ts` |
