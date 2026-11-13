require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildAtaPrompt(transcricao, dadosReuniao) {
  const dados = { ...dadosReuniao };
  delete dados.userId;

  return `Você é um especialista jurídico em direito condominial brasileiro com 20 anos de experiência redigindo atas de assembleia. Sua linguagem é precisa, formal, imparcial e em conformidade com a Lei nº 4.591/64 e o Código Civil Brasileiro (arts. 1.347 a 1.356).

Com base na TRANSCRIÇÃO DA REUNIÃO e nos DADOS FORNECIDOS abaixo, redija uma ata de assembleia completa, formal e juridicamente válida.

DADOS DA REUNIÃO:
${JSON.stringify(dados, null, 2)}

TRANSCRIÇÃO DA REUNIÃO:
${transcricao}

INSTRUÇÕES DE FORMATAÇÃO:
1. Inicie com o cabeçalho completo: nome do condomínio, tipo de assembleia (AGO/AGE), data, horários e local
2. Liste os presentes com base no número informado (não invente nomes — use "X condôminos presentes, representando Y% das frações ideais")
3. Descreva a abertura da sessão, quem presidiu e quem secretariou
4. Para cada item da pauta, crie uma seção numerada com:
   - O tema em destaque
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
- Retorne APENAS o texto da ata, sem comentários, sem markdown, sem prefácio`;
}

async function generateAta(transcricao, dadosReuniao) {
  const prompt = buildAtaPrompt(transcricao, dadosReuniao);

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content[0].text;
}

module.exports = { generateAta };
