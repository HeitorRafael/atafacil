require('dotenv').config();
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_URL || './data/atafacil.db';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new DatabaseSync(dbPath);

// Enable WAL mode for better performance
sqlite.exec('PRAGMA journal_mode = WAL');

// Auto-migrate: create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS condominios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    nome TEXT NOT NULL,
    cnpj TEXT,
    endereco TEXT NOT NULL,
    bairro TEXT NOT NULL,
    cidade TEXT NOT NULL,
    estado TEXT NOT NULL,
    sindico_nome TEXT NOT NULL,
    sindico_cpf TEXT NOT NULL,
    sindico_tipo TEXT NOT NULL,
    sindico_email TEXT,
    sindico_telefone TEXT,
    administradora_nome TEXT,
    administradora_cnpj TEXT,
    administradora_representante TEXT,
    local_padrao TEXT,
    presidente_mesa_padrao TEXT,
    secretario_mesa_padrao TEXT,
    total_unidades INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    condominio_nome TEXT NOT NULL,
    condominio_endereco TEXT NOT NULL,
    condominio_bairro TEXT NOT NULL,
    condominio_cidade TEXT NOT NULL,
    condominio_estado TEXT NOT NULL,
    condominio_cnpj TEXT,
    sindico_nome TEXT NOT NULL,
    sindico_cpf TEXT NOT NULL,
    sindico_tipo TEXT NOT NULL,
    sindico_email TEXT,
    sindico_telefone TEXT,
    administradora_nome TEXT,
    administradora_cnpj TEXT,
    administradora_representante TEXT,
    tipo_assembleia TEXT NOT NULL,
    data_reuniao TEXT NOT NULL,
    hora_inicio TEXT NOT NULL,
    hora_segunda_convocacao TEXT,
    local TEXT NOT NULL,
    presidente_mesa TEXT NOT NULL,
    secretario_mesa TEXT NOT NULL,
    total_unidades INTEGER NOT NULL,
    presentes_count INTEGER NOT NULL,
    pauta_items TEXT NOT NULL,
    transcricao TEXT,
    ata_texto TEXT,
    pdf_path TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = { sqlite };
