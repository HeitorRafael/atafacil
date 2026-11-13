const express = require('express');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const { sqlite } = require('../db');
const { generateAta } = require('../services/claude');
const { generatePDF } = require('../services/pdf');

const router = express.Router();
router.use(authMiddleware);

// POST /api/generate/ata — recebe transcript + meetingData como JSON
router.post('/ata', express.json({ limit: '2mb' }), async (req, res) => {
  let meetingId = null;

  try {
    const { meetingData, transcript } = req.body;

    if (!transcript || transcript.trim().length < 10) {
      return res.status(400).json({ error: 'Transcrição inválida ou muito curta.' });
    }
    if (!meetingData) {
      return res.status(400).json({ error: 'Dados da reunião não encontrados.' });
    }

    // Salva reunião com status 'processing'
    const result = sqlite.prepare(`
      INSERT INTO meetings (
        user_id, condominio_nome, condominio_endereco, condominio_bairro,
        condominio_cidade, condominio_estado, condominio_cnpj,
        sindico_nome, sindico_cpf, sindico_tipo, sindico_email, sindico_telefone,
        administradora_nome, administradora_cnpj, administradora_representante,
        tipo_assembleia, data_reuniao, hora_inicio, hora_segunda_convocacao,
        local, presidente_mesa, secretario_mesa, total_unidades, presentes_count,
        pauta_items, transcricao, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.userId,
      meetingData.condominioNome,
      meetingData.condominioEndereco,
      meetingData.condominioBairro,
      meetingData.condominioCidade || 'Praia Grande',
      meetingData.condominioEstado || 'SP',
      meetingData.condominioCnpj || null,
      meetingData.sindicoNome,
      meetingData.sindicoCpf,
      meetingData.sindicoTipo,
      meetingData.sindicoEmail || null,
      meetingData.sindicoTelefone || null,
      meetingData.administradoraNome || null,
      meetingData.administradoraCnpj || null,
      meetingData.administradoraRepresentante || null,
      meetingData.tipoAssembleia,
      meetingData.dataReuniao,
      meetingData.horaInicio,
      meetingData.horaSegundaConvocacao || null,
      meetingData.local,
      meetingData.presidenteMesa,
      meetingData.secretarioMesa,
      meetingData.totalUnidades,
      meetingData.presentesCount,
      JSON.stringify(meetingData.pautaItems),
      transcript.trim(),
      'processing'
    );

    meetingId = result.lastInsertRowid;

    // Gera ata com Claude
    console.log(`[${meetingId}] Gerando ata com Claude...`);
    const ataTexto = await generateAta(transcript.trim(), meetingData);

    sqlite.prepare(`UPDATE meetings SET ata_texto = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(ataTexto, meetingId);

    // Gera PDF
    console.log(`[${meetingId}] Gerando PDF...`);
    const pdf = await generatePDF(ataTexto, meetingData);

    sqlite.prepare(`UPDATE meetings SET pdf_path = ?, status = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(pdf.path, 'completed', meetingId);

    console.log(`[${meetingId}] Concluído!`);

    res.json({ success: true, meetingId, ataTexto, pdfFilename: pdf.filename });

  } catch (err) {
    console.error('Generate ata error:', err);

    if (meetingId) {
      try {
        sqlite.prepare(`UPDATE meetings SET status = ?, updated_at = datetime('now') WHERE id = ?`)
          .run('error', meetingId);
      } catch (dbErr) {
        console.error('Failed to update meeting status:', dbErr);
      }
    }

    let errorMessage = 'Erro ao gerar a ata. Tente novamente.';
    if (err.message?.includes('API key') || err.message?.includes('authentication')) {
      errorMessage = 'Chave da API Anthropic inválida. Verifique o arquivo .env.';
    } else if (err.message?.includes('quota') || err.message?.includes('rate')) {
      errorMessage = 'Limite de uso da API atingido. Aguarde alguns minutos.';
    }

    res.status(500).json({ error: errorMessage });
  }
});

// GET /api/generate/pdf/:meetingId — download do PDF
router.get('/pdf/:meetingId', (req, res) => {
  try {
    const meeting = sqlite.prepare(
      'SELECT pdf_path, condominio_nome, data_reuniao FROM meetings WHERE id = ? AND user_id = ?'
    ).get(req.params.meetingId, req.user.userId);

    if (!meeting || !meeting.pdf_path) {
      return res.status(404).json({ error: 'PDF não encontrado.' });
    }
    if (!fs.existsSync(meeting.pdf_path)) {
      return res.status(404).json({ error: 'Arquivo PDF não encontrado no servidor.' });
    }

    const filename = `ata_${meeting.condominio_nome.replace(/\s+/g, '_')}_${meeting.data_reuniao}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(path.resolve(meeting.pdf_path));
  } catch (err) {
    console.error('Download PDF error:', err);
    res.status(500).json({ error: 'Erro ao baixar PDF.' });
  }
});

module.exports = router;
