# AtaFácil — Gerador de Atas de Assembleia Condominial

Aplicação web SaaS para geração inteligente de atas de assembleia de condomínio usando transcrição de áudio (OpenAI Whisper) e inteligência artificial (Anthropic Claude).

## Requisitos

- Node.js 18+
- npm 9+

## Setup

1. **Clone o projeto e instale as dependências:**

```bash
npm run install:all
```

2. **Configure as variáveis de ambiente:**

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas chaves:

```
JWT_SECRET=uma_chave_secreta_aleatoria_e_longa
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

3. **Inicie o servidor em modo desenvolvimento:**

```bash
npm run dev
```

Isso inicia o backend na porta 3001 e o frontend na porta 5173.

Acesse: http://localhost:5173

## Estrutura

- `server/` — Backend Node.js + Express
- `client/` — Frontend React + Vite

## Funcionalidades

- Cadastro e login com JWT
- Formulário completo de dados da assembleia (síndico, condomínio, pauta)
- Gravação de áudio direto no browser com visualizador de ondas
- Transcrição automática do áudio via OpenAI Whisper
- Geração da ata jurídica via Anthropic Claude
- Download da ata em PDF (formato ABNT)
- Histórico de assembleias por usuário

Como rodar

cd "c:\Users\hrafa\Desktop\Agente Mestre\Projetos\atafacil"

# 1. Copiar e configurar .env
cp .env.example .env
# Editar: JWT_SECRET, OPENAI_API_KEY, ANTHROPIC_API_KEY

# 2. Instalar dependências
npm run install:all

# 3. Iniciar (backend :3001 + frontend :5173)
npm run dev
Acesse http://localhost:5173 e o app estará funcionando de ponta a ponta.