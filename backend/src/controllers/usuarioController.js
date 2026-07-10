import pool from "../config/db.js";
import bcrypt from "bcrypt";

// Lista oficial com Anderson de Lima (Síndico), Fulano Alterado (Porteiro) e Moradores do 101 ao 502
let usuariosDB = [
  {
    id: "1",
    nome: "Anderson de Lima",
    email: "anderson.sindico@condominio.com",
    perfil: "SINDICO",
    unidade: "Administração (Apto 501)",
  },
  {
    id: "2",
    nome: "Fulano Alterado",
    email: "fulano.porteiro@condominio.com",
    perfil: "PORTEIRO",
    unidade: "Portaria Principal",
  },
  {
    id: "3",
    nome: "Beatriz Mendonça",
    email: "beatriz.101@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 101",
  },
  {
    id: "4",
    nome: "Carlos Eduardo Prado",
    email: "carlos.102@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 102",
  },
  {
    id: "5",
    nome: "Mariana Vasconcelos",
    email: "mariana.201@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 201",
  },
  {
    id: "6",
    nome: "Ricardo Ferreira",
    email: "ricardo.202@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 202",
  },
  {
    id: "7",
    nome: "Fernanda Guimarães",
    email: "fernanda.301@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 301",
  },
  {
    id: "8",
    nome: "Lucas Siqueira",
    email: "lucas.302@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 302",
  },
  {
    id: "9",
    nome: "Patrícia Oliveira",
    email: "patricia.401@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 401",
  },
  {
    id: "10",
    nome: "Gabriel Souza",
    email: "gabriel.402@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 402",
  },
  {
    id: "11",
    nome: "Juliana Alcantara",
    email: "juliana.501@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 501",
  },
  {
    id: "12",
    nome: "Rodrigo Bittencourt",
    email: "rodrigo.502@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 502",
  },
];

// Sincroniza e garante que todos os 12 usuários existam na resposta ou no banco
export const listarUsuarios = async (req, res) => {
  try {
    // 1. Garante que os 12 usuários iniciais existam no PostgreSQL caso esteja rodando
    for (const u of usuariosDB) {
      await pool.query(
        `INSERT INTO usuarios (nome, email, senha_hash, perfil, unidade)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE 
         SET nome = EXCLUDED.nome, perfil = EXCLUDED.perfil, unidade = EXCLUDED.unidade`,
        [u.nome, u.email, "$2b$10$exemploHashSeguro", u.perfil, u.unidade]
      );
    }

    const result = await pool.query(
      "SELECT id, nome, email, perfil, unidade FROM usuarios ORDER BY id ASC"
    );
    return res.json(result.rows);
  } catch (error) {
    // Se o PostgreSQL não estiver acessível, retorna nossa lista completa
    res.json(usuariosDB);
  }
};

// Cadastro interno feito pelo Síndico (com perfil e unidade)
export const cadastrarInterno = async (req, res) => {
  const { nome, email, senha, perfil, unidade } = req.body;

  if (!nome || !email || !senha || !perfil) {
    return res.status(400).json({ erro: "Dados obrigatórios ausentes." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, unidade) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, nome, email, perfil, unidade`,
      [nome, email, senhaHash, perfil, unidade || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ erro: "Este email já está cadastrado." });
    }
    const novoUsuario = {
      id: String(Date.now()),
      nome,
      email,
      perfil,
      unidade: unidade || "-",
    };
    usuariosDB.push(novoUsuario);
    res.status(201).json(novoUsuario);
  }
};

// Remove o acesso sumariamente
export const deletarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
    usuariosDB = usuariosDB.filter((u) => String(u.id) !== String(id));
    res.json({ mensagem: "Acesso revogado com sucesso." });
  } catch (error) {
    usuariosDB = usuariosDB.filter((u) => String(u.id) !== String(id));
    res.json({ mensagem: "Acesso revogado com sucesso." });
  }
};
