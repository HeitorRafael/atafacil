require('dotenv').config();
const { OpenAI, toFile } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(audioBuffer, filename) {
  const file = await toFile(audioBuffer, filename, { type: 'audio/webm' });

  const response = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'pt',
    response_format: 'text',
    prompt: 'Transcrição de assembleia condominial brasileira. Reunião de condomínio com síndico e moradores.',
  });

  return response;
}

module.exports = { transcribeAudio };
