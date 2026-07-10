-- Criação das tabelas do Sistema de Condomínio

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil VARCHAR(50) DEFAULT 'MORADOR',
  unidade VARCHAR(50),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  area VARCHAR(100) NOT NULL,
  data_reserva VARCHAR(50) NOT NULL,
  horario VARCHAR(100) NOT NULL,
  convidados INTEGER DEFAULT 0,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unq_area_data_horario UNIQUE (area, data_reserva, horario)
);

CREATE TABLE IF NOT EXISTS moradores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  unidade VARCHAR(50) NOT NULL,
  telefone VARCHAR(30),
  email VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS visitantes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  documento VARCHAR(50) NOT NULL,
  placa_veiculo VARCHAR(20),
  unidade_destino VARCHAR(50) NOT NULL,
  status VARCHAR(30) DEFAULT 'PENDENTE',
  data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dados iniciais (Seed) de exemplo
INSERT INTO usuarios (nome, email, senha_hash, perfil, unidade)
VALUES 
  ('Anderson de Lima', 'anderson.sindico@condominio.com', '$2a$10$exemploHash', 'SINDICO', 'Administração (Apto 501)'),
  ('Fulano Alterado', 'fulano.porteiro@condominio.com', '$2a$10$exemploHash', 'PORTEIRO', 'Portaria Principal'),
  ('Beatriz Mendonça', 'beatriz.101@condominio.com', '$2a$10$exemploHash', 'MORADOR', 'Apto 101'),
  ('Carlos Eduardo Prado', 'carlos.102@condominio.com', '$2a$10$exemploHash', 'MORADOR', 'Apto 102'),
  ('Mariana Vasconcelos', 'mariana.201@condominio.com', '$2a$10$exemploHash', 'MORADOR', 'Apto 201'),
  ('Ricardo Ferreira', 'ricardo.202@condominio.com', '$2a$10$exemploHash', 'MORADOR', 'Apto 202'),
  ('Fernanda Guimarães', 'fernanda.301@condominio.com', '$2a$10$exemploHash', 'MORADOR', 'Apto 301'),
  ('Lucas Siqueira', 'lucas.302@condominio.com', '$2a$10$exemploHash', 'MORADOR', 'Apto 302'),
  ('Patrícia Oliveira', 'patricia.401@condominio.com', '$2a$10$exemploHash', 'MORADOR', 'Apto 401'),
  ('Gabriel Souza', 'gabriel.402@condominio.com', '$2a$10$exemploHash', 'MORADOR', 'Apto 402'),
  ('Juliana Alcantara', 'juliana.501@condominio.com', '$2a$10$exemploHash', 'MORADOR', 'Apto 501'),
  ('Rodrigo Bittencourt', 'rodrigo.502@condominio.com', '$2a$10$exemploHash', 'MORADOR', 'Apto 502')
ON CONFLICT (email) DO NOTHING;
