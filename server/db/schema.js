const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

const meetings = sqliteTable('meetings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  condominioNome: text('condominio_nome').notNull(),
  condominioEndereco: text('condominio_endereco').notNull(),
  condominioBairro: text('condominio_bairro').notNull(),
  condominioCidade: text('condominio_cidade').notNull(),
  condominioEstado: text('condominio_estado').notNull(),
  condominioCnpj: text('condominio_cnpj'),
  sindicoNome: text('sindico_nome').notNull(),
  sindicoCpf: text('sindico_cpf').notNull(),
  sindicoTipo: text('sindico_tipo').notNull(),
  sindicoEmail: text('sindico_email'),
  sindicoTelefone: text('sindico_telefone'),
  administradoraNome: text('administradora_nome'),
  administradoraCnpj: text('administradora_cnpj'),
  administradoraRepresentante: text('administradora_representante'),
  tipoAssembleia: text('tipo_assembleia').notNull(),
  dataReuniao: text('data_reuniao').notNull(),
  horaInicio: text('hora_inicio').notNull(),
  horaSegundaConvocacao: text('hora_segunda_convocacao'),
  local: text('local').notNull(),
  presidenteMesa: text('presidente_mesa').notNull(),
  secretarioMesa: text('secretario_mesa').notNull(),
  totalUnidades: integer('total_unidades').notNull(),
  presentesCount: integer('presentes_count').notNull(),
  pautaItems: text('pauta_items').notNull(),
  transcricao: text('transcricao'),
  ataTexto: text('ata_texto'),
  pdfPath: text('pdf_path'),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
  updatedAt: text('updated_at').notNull().default(new Date().toISOString()),
});

module.exports = { users, meetings };
