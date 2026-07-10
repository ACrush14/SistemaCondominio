import pool from "../config/db.js";
import bcrypt from "bcrypt";

// Lista todos os usuários preenchendo a tabela do frontend
export const listarUsuarios = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nome, email, perfil, unidade FROM usuarios ORDER BY criado_em DESC",
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar:", error);
    res.status(500).json({ erro: "Erro interno ao buscar usuários." });
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
      [nome, email, senhaHash, perfil, unidade || null],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    // Código 23505 do Postgres significa Violação de Restrição Única (Unique Violation)
    if (error.code === "23505") {
      return res.status(400).json({ erro: "Este email já está cadastrado." });
    }
    console.error("Erro no cadastro:", error);
    res.status(500).json({ erro: "Falha ao gravar no banco de dados." });
  }
};

// Remove o acesso sumariamente
export const deletarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
    res.json({ mensagem: "Acesso revogado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar:", error);
    res.status(500).json({ erro: "Falha ao remover usuário." });
  }
};
