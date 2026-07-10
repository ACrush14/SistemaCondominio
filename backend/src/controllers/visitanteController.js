import pool from "../config/db.js";

export const registrarVisitante = async (req, res) => {
  const { nome, documento, placa_veiculo, unidade_destino } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO visitantes (nome, documento, placa_veiculo, unidade_destino, status) VALUES ($1, $2, $3, $4, 'PENDENTE') RETURNING *",
      [nome, documento, placa_veiculo, unidade_destino],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao registrar visitante." });
  }
};

export const listarVisitantes = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM visitantes ORDER BY data_entrada DESC",
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar visitantes." });
  }
};

export const listarVisitantesPorUnidade = async (req, res) => {
  const { unidade } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM visitantes WHERE unidade_destino = $1 ORDER BY data_entrada DESC",
      [unidade],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar visitantes." });
  }
};

export const atualizarStatusVisitante = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query("UPDATE visitantes SET status = $1 WHERE id = $2", [
      status,
      id,
    ]);
    res.json({ mensagem: "Status atualizado." });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar status." });
  }
};
