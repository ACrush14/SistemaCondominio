import pool from "../config/db.js";

export const registrarMorador = async (req, res) => {
  const { nome, unidade, telefone, email } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO moradores (nome, unidade, telefone, email) VALUES ($1, $2, $3, $4) RETURNING *",
      [nome, unidade, telefone, email],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao cadastrar morador." });
  }
};

export const listarMoradores = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM moradores ORDER BY unidade ASC",
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar moradores." });
  }
};
