# INSTRUÇÕES DO AGENTE — LÍDER BARBERS

Este arquivo é injetado automaticamente nas instruções de sistema do assistente de IA em cada sessão.

## ⚠️ DIRETRIZES FUNDAMENTAIS OBRIGATÓRIAS

### 1. LEITURA PRÉVIA OBRIGATÓRIA DA DOCUMENTAÇÃO
Antes de executar qualquer alteração no código ou responder a solicitações de modificação do usuário:
- **Você DEVE ler o arquivo `/DOCUMENTACAO-PROJETO.md`** utilizando a ferramenta `view_file`.
- Isso garante que você sempre trabalhe a partir do **estado real do projeto**, conhecendo a hierarquia de papéis (`owner`, `admin`, `barber`, `customer`), rotas, modelo de dados em `/data/db.json` e componentes existentes, sem fazer suposições.

### 2. ATUALIZAÇÃO OBRIGATÓRIA DA DOCUMENTAÇÃO APÓS MODIFICAÇÕES
Sempre que concluir uma alteração no código e antes de encerrar o seu turno:
- **Você DEVE atualizar o arquivo `/DOCUMENTACAO-PROJETO.md`** para registrar:
  1. A nova alteração efetuada na seção **Histórico de Alterações** (com data, escopo e módulos afetados).
  2. Qualquer nova rota, endpoint, campo no modelo de dados ou componente adicionado/modificado nas seções correspondentes da documentação.

### 3. REGRAS ARQUITETURAIS DO PROJETO
- **Full-Stack Express + React**: O dev server roda em `server.ts` na porta 3000 vinculada a `0.0.0.0`.
- **Persistência**: O banco de dados opera em `/data/db.json`. Não adicione bancos externos sem solicitação explícita.
- **PWA & Mobile-First**: O app é um PWA instalável com ícones e Service Worker em `/public`.
- **Privacidade & Isolamento**:
  - Clientes não devem ver links ou botões de login de funcionários na interface pública.
  - Links dedicados de equipe:
    - Dono: `/proprietario` (ou `/app-dono`)
    - Administrador: `/admin` (ou `/app-admin`)
    - Barbeiro: `/barbeiro` (ou `/portal-barbeiro`)
- **Estilo**: Tailwind CSS v4, tema escuro sofisticado com tons dourados (`#d4af37`), ícones de `lucide-react` e animações de `motion/react`.
