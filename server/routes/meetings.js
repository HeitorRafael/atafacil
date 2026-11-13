const express = require('express');
const authMiddleware = require('../middleware/auth');
const { sqlite } = require('../db');

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// GET /api/meetings — list user's meetings
router.get('/', (req, res) => {
  try {
    const meetings = sqlite.prepare(
      `SELECT id, condominio_nome, tipo_assembleia, data_reuniao, status, created_at
       FROM meetings WHERE user_id = ? ORDER BY created_at DESC`
    ).all(req.user.userId);

    res.json({ meetings });
  } catch (err) {
    console.error('List meetings error:', err);
    res.status(500).json({ error: 'Erro ao listar reuniões.' });
  }
});

// GET /api/meetings/:id — get single meeting
router.get('/:id', (req, res) => {
  try {
    const meeting = sqlite.prepare(
      'SELECT * FROM meetings WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.userId);

    if (!meeting) {
      return res.status(404).json({ error: 'Reunião não encontrada.' });
    }

    meeting.pauta_items = JSON.parse(meeting.pauta_items);
    res.json({ meeting });
  } catch (err) {
    console.error('Get meeting error:', err);
    res.status(500).json({ error: 'Erro ao buscar reunião.' });
  }
});

// DELETE /api/meetings/:id
router.delete('/:id', (req, res) => {
  try {
    const meeting = sqlite.prepare(
      'SELECT id FROM meetings WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.userId);

    if (!meeting) {
      return res.status(404).json({ error: 'Reunião não encontrada.' });
    }

    sqlite.prepare('DELETE FROM meetings WHERE id = ?').run(req.params.id);
    res.json({ message: 'Reunião excluída com sucesso.' });
  } catch (err) {
    console.error('Delete meeting error:', err);
    res.status(500).json({ error: 'Erro ao excluir reunião.' });
  }
});

module.exports = router;
