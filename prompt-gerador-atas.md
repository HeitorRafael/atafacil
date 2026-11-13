# PROMPT PARA CLAUDE CODE — GERADOR DE ATAS DE ASSEMBLEIA

---

## 🎯 VISÃO GERAL DO PROJETO

Construa uma aplicação web completa chamada **AtaFácil** — um gerador inteligente de atas de assembleia condominial. O usuário (síndico ou administradora) faz login, preenche os dados da reunião, grava o áudio da assembleia direto no browser, e ao final recebe uma ata completa e formatada, pronta para download em PDF, gerada por IA com base na transcrição do áudio.

Este é um produto SaaS simples, focado em síndicos de condomínios residenciais no Brasil. A linguagem de toda a interface deve ser em **português brasileiro**, tom profissional mas acessível — o usuário pode ser um síndico morador, não necessariamente um profissional de TI.

---

## 🏗️ STACK TÉCNICA

- **Frontend:** React + Vite (SPA)
- **Estilização:** Tailwind CSS
- **Backend:** Node.js + Express
- **Banco de dados:** SQLite com Drizzle ORM (leve, sem infraestrutura externa)
- **Autenticação:** JWT armazenado em httpOnly cookie
- **Transcrição de áudio:** OpenAI Whisper API (`whisper-1`)
- **Geração da ata:** Anthropic Claude API (`claude-opus-4-5` ou `claude-sonnet-4-5`)
- **Geração de PDF:** `puppeteer` (renderiza HTML/CSS para PDF com alta fidelidade)
- **Gravação de áudio no browser:** `MediaRecorder API` (nativo, sem lib externa)
- **Variáveis de ambiente:** `.env` na raiz do projeto

---

## 📁 ESTRUTURA DE PASTAS

```
atafacil/
├── server/
│   ├── index.js              # Entry point Express
│   ├── routes/
│   │   ├── auth.js           # Login / cadastro
│   │   ├── meetings.js       # Criar reunião, salvar dados
│   │   └── generate.js       # Transcrição + geração de ata
│   ├── middleware/
│   │   └── auth.js           # Middleware JWT
│   ├── db/
│   │   ├── schema.js         # Schema Drizzle
│   │   └── index.js          # Conexão SQLite
│   └── services/
│       ├── whisper.js        # Integração OpenAI Whisper
│       ├── claude.js         # Integração Anthropic Claude
│       └── pdf.js            # Geração PDF com Puppeteer
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── NewMeeting.jsx    # Formulário + gravação
│   │   │   └── MeetingResult.jsx # Visualização + download
│   │   ├── components/
│   │   │   ├── AudioRecorder.jsx
│   │   │   ├── MeetingForm.jsx
│   │   │   └── AgreementPreview.jsx
│   │   ├── hooks/
│   │   │   └── useRecorder.js
│   │   └── App.jsx
│   └── index.html
├── .env.example
└── package.json
```

---

## 🔐 MÓDULO DE AUTENTICAÇÃO

### Cadastro (`/register`)
Campos obrigatórios:
- Nome completo
- E-mail (único no sistema)
- Senha (mínimo 8 caracteres)
- Confirmação de senha

Ao cadastrar, criar usuário no banco e redirecionar para o Dashboard.

### Login (`/login`)
- E-mail + senha
- Gera JWT com validade de 7 dias
- Armazena token em httpOnly cookie
- Redireciona para `/dashboard`

### Proteção de rotas
Todas as rotas exceto `/login` e `/register` devem ser protegidas pelo middleware JWT. Se o token for inválido ou expirado, redirecionar para `/login`.

---

## 📋 MÓDULO DE FORMULÁRIO — DADOS DA REUNIÃO

Esta é a tela central antes da gravação. Dividir em seções colapsáveis ou em steps visuais (wizard de 2 passos).

### SEÇÃO 1 — Dados do Condomínio
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Nome do condomínio | Texto | ✅ | Ex: "Residencial Bela Vista" |
| CNPJ do condomínio | Texto (máscara) | ❌ | Exibir tooltip: "Opcional, mas recomendado para validade jurídica" |
| Endereço completo | Texto | ✅ | Rua, número, complemento |
| Bairro | Texto | ✅ | |
| Cidade | Texto | ✅ | Pré-preencher com "Praia Grande" |
| Estado | Select | ✅ | Pré-selecionar "SP" |

### SEÇÃO 2 — Dados do Síndico
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Nome completo do síndico | Texto | ✅ | |
| CPF do síndico | Texto (máscara) | ✅ | Obrigatório — assina o documento |
| Tipo de síndico | Select | ✅ | "Síndico Morador" / "Síndico Profissional" |
| E-mail do síndico | Texto | ❌ | Para constar na ata |
| Telefone do síndico | Texto (máscara) | ❌ | |

### SEÇÃO 3 — Administradora (opcional)
Exibir toggle "Esta reunião tem administradora?" — ao ativar, mostrar:
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Nome da administradora | Texto | ✅ (se toggle ativo) | |
| CNPJ da administradora | Texto (máscara) | ❌ | |
| Nome do representante da administradora | Texto | ❌ | |

### SEÇÃO 4 — Dados da Assembleia
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Tipo de assembleia | Select | ✅ | "AGO — Assembleia Geral Ordinária" / "AGE — Assembleia Geral Extraordinária" |
| Data da assembleia | Date | ✅ | Pré-preencher com hoje |
| Horário da 1ª convocação | Time | ✅ | |
| Horário da 2ª convocação | Time | ❌ | Exibir tooltip: "A 2ª convocação ocorre caso não haja quórum na 1ª" |
| Local da reunião | Texto | ✅ | Ex: "Salão de festas do condomínio" |
| Presidente da mesa | Texto | ✅ | Quem conduz a reunião (pode ser o síndico) |
| Secretário da mesa | Texto | ✅ | Quem redige/assina a ata |
| Número de unidades do condomínio | Número | ✅ | Para cálculo de quórum |
| Número de condôminos presentes | Número | ✅ | Preenchido após início ou estimado |

### SEÇÃO 5 — Ordem do Dia (Pauta)
Campo dinâmico: lista de itens de pauta. Mínimo 1 item, máximo 15.
- Botão **"+ Adicionar item de pauta"**
- Cada item: campo de texto simples
- Botão de remover item (ícone de lixeira)
- Exemplos de pauta pré-definidos como chips clicáveis: "Prestação de contas", "Eleição de síndico", "Reajuste de taxa condominial", "Obras e melhorias", "Assuntos gerais"

---

## 🎙️ MÓDULO DE GRAVAÇÃO

Após o formulário ser preenchido e validado, exibir botão:

**[ 🔴 Iniciar Gravação da Reunião ]**

### Comportamento:
1. Ao clicar, exibir **modal de confirmação**: *"Você está prestes a iniciar a gravação da assembleia. Certifique-se de que todos os presentes estão cientes de que a reunião será gravada. Deseja continuar?"* — botões: **[Cancelar]** e **[Iniciar Gravação]**

2. Ao confirmar, solicitar permissão de microfone via `getUserMedia`. Se negado, exibir mensagem de erro clara com instrução de como liberar no browser.

3. Durante a gravação, exibir:
   - Indicador visual pulsante vermelho com texto "Gravando..."
   - Cronômetro em tempo real (HH:MM:SS)
   - Forma de onda de áudio animada (visualizer simples com `AnalyserNode` da Web Audio API)
   - Botão **[ ⏹ Finalizar Reunião ]** (vermelho, bem visível)

4. Ao clicar em "Finalizar Reunião", exibir **modal de confirmação**: *"Deseja encerrar a gravação? Após confirmar, a ata será gerada automaticamente."* — botões: **[Continuar Gravando]** e **[Confirmar e Gerar Ata]**

5. Se cancelar, a gravação **continua normalmente** sem interrupção.

### Implementação técnica da gravação:
- Usar `MediaRecorder` com formato `audio/webm;codecs=opus` (melhor suporte no Chrome) com fallback para `audio/webm`
- Coletar chunks em array durante a gravação
- Ao finalizar, criar `Blob` e enviar para o backend via `FormData` (multipart)
- Limite sugerido: alertar ao atingir 2 horas de gravação (mas não interromper automaticamente)

---

## ⚙️ MÓDULO DE PROCESSAMENTO — BACKEND

### Endpoint: `POST /api/generate/ata`

**Recebe:**
- Arquivo de áudio (multipart)
- JSON com todos os dados do formulário

**Pipeline:**

#### Passo 1 — Transcrição com OpenAI Whisper
```javascript
// services/whisper.js
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(audioBuffer, filename) {
  const response = await openai.audio.transcriptions.create({
    file: audioBuffer, // passado como File-like object
    model: 'whisper-1',
    language: 'pt',
    response_format: 'text',
    prompt: 'Transcrição de assembleia condominial brasileira.'
  });
  return response; // texto completo da transcrição
}
```

#### Passo 2 — Geração da Ata com Claude
```javascript
// services/claude.js
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateAta(transcricao, dadosReuniao) {
  const prompt = buildAtaPrompt(transcricao, dadosReuniao);
  
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });
  
  return message.content[0].text;
}
```

#### Prompt de geração da ata (interno ao `claude.js`):

```
Você é um especialista jurídico em direito condominial brasileiro com 20 anos de experiência redigindo atas de assembleia. Sua linguagem é precisa, formal, imparcial e em conformidade com a Lei nº 4.591/64 e o Código Civil Brasileiro (arts. 1.347 a 1.356).

Com base na TRANSCRIÇÃO DA REUNIÃO e nos DADOS FORNECIDOS abaixo, redija uma ata de assembleia completa, formal e juridicamente válida.

DADOS DA REUNIÃO:
${JSON.stringify(dadosReuniao, null, 2)}

TRANSCRIÇÃO DA REUNIÃO:
${transcricao}

INSTRUÇÕES DE FORMATAÇÃO:
1. Inicie com o cabeçalho completo: nome do condomínio, tipo de assembleia (AGO/AGE), data, horários e local
2. Liste os presentes com base no número informado (não invente nomes — use "X condôminos presentes, representando Y% das frações ideais")
3. Descreva a abertura da sessão, quem presidiu e quem secretariou
4. Para cada item da pauta, crie uma seção numerada com:
   - O tema em negrito
   - Resumo objetivo do que foi discutido
   - A deliberação final (se houve votação, descreva o resultado: aprovado por unanimidade / aprovado por maioria / rejeitado)
5. Encerre com o fecho formal: "Nada mais havendo a tratar, o Presidente declarou encerrada a assembleia às HH:MM horas..."
6. Adicione ao final os blocos de assinatura necessários:
   - Assinatura do Presidente da Mesa (com linha, nome e CPF)
   - Assinatura do Secretário da Mesa (com linha, nome)
   - Assinatura do Síndico (com linha, nome e CPF)
   - Campo "VISTO DA ADMINISTRADORA" se houver administradora nos dados

IMPORTANTE:
- Não invente deliberações que não estão na transcrição
- Se a transcrição for pouco clara em algum ponto, use linguagem como "discutiu-se sobre o tema" sem inventar decisões
- Trate com neutralidade eventuais conflitos mencionados na gravação
- O documento final deve ter entre 500 e 1500 palavras, dependendo da complexidade da reunião
- Retorne APENAS o texto da ata, sem comentários, sem markdown, sem prefácio
```

#### Passo 3 — Geração do PDF com Puppeteer

```javascript
// services/pdf.js
const puppeteer = require('puppeteer');

async function generatePDF(ataTexto, dadosReuniao) {
  const html = buildAtaHTML(ataTexto, dadosReuniao);
  
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: { top: '2.5cm', bottom: '2.5cm', left: '3cm', right: '2cm' },
    printBackground: true
  });
  
  await browser.close();
  return pdfBuffer;
}
```

**Template HTML da ata** (`buildAtaHTML`):
- Fonte: Georgia ou Times New Roman (serifa — padrão documental brasileiro)
- Tamanho: 12pt
- Espaçamento: 1.5
- Margem ABNT: 3cm esquerda, 2cm direita, 2.5cm topo e base
- Cabeçalho com nome do condomínio centralizado em negrito
- Rodapé com número de página e "Documento gerado pelo AtaFácil"
- Blocos de assinatura com linhas tracejadas, nome e cargo abaixo de cada linha
- Texto da ata em parágrafos com recuo de 1.25cm

---

## 📄 TELA DE RESULTADO

Após o processamento (que pode levar 30–120 segundos dependendo do áudio), exibir:

1. **Tela de loading** com progress steps visuais:
   - ✅ Áudio recebido
   - ⏳ Transcrevendo áudio... (Whisper)
   - ⏳ Redigindo ata com IA... (Claude)
   - ⏳ Gerando documento PDF...

2. **Tela de sucesso** com:
   - Preview do texto da ata (em caixa com scroll)
   - Botão destacado: **[ ⬇️ Baixar Ata em PDF ]** (não automático — o usuário clica)
   - Botão secundário: **[ 📋 Copiar texto da ata ]**
   - Mensagem de instrução: *"Após baixar, envie o PDF no grupo do WhatsApp do condomínio e guarde uma cópia impressa assinada pelos presentes."*

3. A ata e o PDF são salvos no banco vinculados ao usuário, para histórico futuro.

---

## 🗄️ SCHEMA DO BANCO DE DADOS

```javascript
// db/schema.js (Drizzle ORM)

users: {
  id, email, name, passwordHash, createdAt
}

meetings: {
  id,
  userId (FK),
  condominioNome,
  condominioEndereco,
  condominioCnpj,
  sindicoNome,
  sindicoCpf,
  sindicoTipo,
  administradoraNome,
  administradoraCnpj,
  tipoAssembleia,        // 'AGO' | 'AGE'
  dataReuniao,
  horaInicio,
  local,
  presidenteMesa,
  secretarioMesa,
  totalUnidades,
  presentesCount,
  pautaItems,            // JSON array de strings
  transcricao,           // texto completo do Whisper
  ataTexto,              // texto da ata gerada pelo Claude
  pdfPath,               // caminho do arquivo PDF salvo
  status,                // 'processing' | 'completed' | 'error'
  createdAt,
  updatedAt
}
```

---

## 🎨 DESIGN VISUAL

### Identidade visual
- **Nome:** AtaFácil
- **Paleta:** Azul-marinho escuro (`#0F2044`) como cor primária, branco e cinza-claro como fundo, dourado/âmbar (`#D4A017`) como acento para botões de ação
- **Tipografia:** Cabeçalhos em `DM Serif Display` (Google Fonts), corpo em `Inter`
- **Tom visual:** Sóbrio, confiável, documental — transmite seriedade jurídica sem ser intimidador

### UX / Micro-interações
- Formulário com validação em tempo real (campo vermelho + mensagem inline ao sair do campo sem preencher)
- Botão "Iniciar Gravação" só habilita quando todos os campos obrigatórios estão preenchidos
- Indicador de progresso no wizard (passo 1 de 2, passo 2 de 2)
- Animação suave de transição entre etapas
- Toast de erro claro se a API falhar (sem expor detalhes técnicos ao usuário)
- Responsivo para mobile (síndico pode estar usando o celular durante a reunião)

---

## 🔑 VARIÁVEIS DE AMBIENTE

```env
# .env
PORT=3001
JWT_SECRET=sua_chave_jwt_aqui
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=./data/atafacil.db
PDF_OUTPUT_DIR=./data/pdfs
```

---

## 📦 PACKAGE.JSON — DEPENDÊNCIAS PRINCIPAIS

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.20.0",
    "openai": "^4.0.0",
    "express": "^4.18.0",
    "drizzle-orm": "^0.30.0",
    "better-sqlite3": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "multer": "^1.4.5",
    "puppeteer": "^21.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^3.4.0",
    "drizzle-kit": "^0.20.0"
  }
}
```

---

## ✅ CRITÉRIOS DE ACEITAÇÃO (DEFINITION OF DONE)

- [ ] Usuário consegue se cadastrar e fazer login sem erros
- [ ] Formulário valida todos os campos obrigatórios antes de habilitar a gravação
- [ ] Gravação inicia, exibe cronômetro e visualizer de áudio
- [ ] Modal de confirmação ao tentar finalizar a gravação
- [ ] Cancelar o modal NÃO interrompe a gravação
- [ ] Áudio é enviado ao backend e transcrito pelo Whisper
- [ ] Claude recebe transcrição + dados e retorna ata completa e formatada
- [ ] PDF é gerado com formatação ABNT e blocos de assinatura corretos
- [ ] Usuário pode baixar o PDF clicando no botão (não download automático)
- [ ] Ata e metadados são salvos no banco vinculados ao usuário
- [ ] Tela de loading mostra progresso visual durante o processamento
- [ ] Interface funciona no mobile (síndico pode usar o celular)
- [ ] Erros de API são tratados e exibidos de forma amigável ao usuário

---

## 🚀 INSTRUÇÕES FINAIS PARA O CLAUDE CODE

1. Crie toda a estrutura de pastas e arquivos conforme descrito
2. Implemente o backend Express completo com todos os endpoints
3. Implemente o frontend React com todas as páginas e componentes
4. Configure o Drizzle e crie o banco SQLite com as migrations
5. Implemente o `.env.example` com todas as variáveis necessárias
6. Crie um `README.md` com instruções claras de setup (`npm install`, `npm run dev`)
7. NÃO use placeholders ou TODOs — implemente tudo de forma funcional
8. Trate erros em todos os pontos críticos: falha de microfone, falha de API, arquivo muito grande
9. O fluxo completo deve funcionar de ponta a ponta sem intervenção manual

**Este é um MVP de produção. Cada decisão de código deve ser tomada pensando em entregar para um cliente real.**
