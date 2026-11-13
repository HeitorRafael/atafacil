const express = require('express');
const authMiddleware = require('../middleware/auth');
const { sqlite } = require('../db');

const router = express.Router();
router.use(authMiddleware);

function mapRow(c) {
  return {
    id: c.id,
    nome: c.nome,
    cnpj: c.cnpj || '',
    endereco: c.endereco,
    bairro: c.bairro,
    cidade: c.cidade,
    estado: c.estado,
    sindicoNome: c.sindico_nome,
    sindicoCpf: c.sindico_cpf,
    sindicoTipo: c.sindico_tipo,
    sindicoEmail: c.sindico_email || '',
    sindicoTelefone: c.sindico_telefone || '',
    administradoraNome: c.administradora_nome || '',
    administradoraCnpj: c.administradora_cnpj || '',
    administradoraRepresentante: c.administradora_representante || '',
    localPadrao: c.local_padrao || '',
    presidenteMesaPadrao: c.presidente_mesa_padrao || '',
    secretarioMesaPadrao: c.secretario_mesa_padrao || '',
    totalUnidades: c.total_unidades || '',
  };
}

// GET /api/condominios
router.get('/', (req, res) => {
  try {
    const rows = sqlite.prepare(
      `SELECT * FROM condominios WHERE user_id = ? ORDER BY nome ASC`
    ).all(req.user.userId);
    res.json({ condominios: rows.map(mapRow) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar condomínios.' });
  }
});

// GET /api/condominios/:id
router.get('/:id', (req, res) => {
  try {
    const row = sqlite.prepare(
      'SELECT * FROM condominios WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.userId);
    if (!row) return res.status(404).json({ error: 'Condomínio não encontrado.' });
    res.json({ condominio: mapRow(row) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar condomínio.' });
  }
});

// POST /api/condominios
router.post('/', (req, res) => {
  try {
    const d = req.body;
    if (!d.nome?.trim()) return res.status(400).json({ error: 'Nome obrigatório.' });
    if (!d.sindicoNome?.trim()) return res.status(400).json({ error: 'Nome do síndico obrigatório.' });
    if (!d.sindicoCpf?.trim()) return res.status(400).json({ error: 'CPF do síndico obrigatório.' });
    if (!d.endereco?.trim()) return res.status(400).json({ error: 'Endereço obrigatório.' });

    const result = sqlite.prepare(`
      INSERT INTO condominios (
        user_id, nome, cnpj, endereco, bairro, cidade, estado,
        sindico_nome, sindico_cpf, sindico_tipo, sindico_email, sindico_telefone,
        administradora_nome, administradora_cnpj, administradora_representante,
        local_padrao, presidente_mesa_padrao, secretario_mesa_padrao, total_unidades
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      req.user.userId,
      d.nome.trim(),
      d.cnpj || null,
      d.endereco.trim(),
      d.bairro?.trim() || '',
      d.cidade?.trim() || '',
      d.estado || 'SP',
      d.sindicoNome.trim(),
      d.sindicoCpf.trim(),
      d.sindicoTipo || 'Síndico Morador',
      d.sindicoEmail || null,
      d.sindicoTelefone || null,
      d.administradoraNome || null,
      d.administradoraCnpj || null,
      d.administradoraRepresentante || null,
      d.localPadrao || null,
      d.presidenteMesaPadrao || null,
      d.secretarioMesaPadrao || null,
      d.totalUnidades || null,
    );
    const row = sqlite.prepare('SELECT * FROM condominios WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ condominio: mapRow(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar condomínio.' });
  }
});

// PUT /api/condominios/:id
router.put('/:id', (req, res) => {
  try {
    const existing = sqlite.prepare(
      'SELECT id FROM condominios WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.userId);
    if (!existing) return res.status(404).json({ error: 'Condomínio não encontrado.' });

    const d = req.body;
    sqlite.prepare(`
      UPDATE condominios SET
        nome=?, cnpj=?, endereco=?, bairro=?, cidade=?, estado=?,
        sindico_nome=?, sindico_cpf=?, sindico_tipo=?, sindico_email=?, sindico_telefone=?,
        administradora_nome=?, administradora_cnpj=?, administradora_representante=?,
        local_padrao=?, presidente_mesa_padrao=?, secretario_mesa_padrao=?, total_unidades=?,
        updated_at=datetime('now')
      WHERE id=?
    `).run(
      d.nome?.trim(),
      d.cnpj || null,
      d.endereco?.trim(),
      d.bairro?.trim() || '',
      d.cidade?.trim() || '',
      d.estado || 'SP',
      d.sindicoNome?.trim(),
      d.sindicoCpf?.trim(),
      d.sindicoTipo || 'Síndico Morador',
      d.sindicoEmail || null,
      d.sindicoTelefone || null,
      d.administradoraNome || null,
      d.administradoraCnpj || null,
      d.administradoraRepresentante || null,
      d.localPadrao || null,
      d.presidenteMesaPadrao || null,
      d.secretarioMesaPadrao || null,
      d.totalUnidades || null,
      req.params.id,
    );
    const row = sqlite.prepare('SELECT * FROM condominios WHERE id = ?').get(req.params.id);
    res.json({ condominio: mapRow(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar condomínio.' });
  }
});

// DELETE /api/condominios/:id
router.delete('/:id', (req, res) => {
  try {
    const existing = sqlite.prepare(
      'SELECT id FROM condominios WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.userId);
    if (!existing) return res.status(404).json({ error: 'Condomínio não encontrado.' });
    sqlite.prepare('DELETE FROM condominios WHERE id = ?').run(req.params.id);
    res.json({ message: 'Condomínio excluído.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir condomínio.' });
  }
});

module.exports = router;
