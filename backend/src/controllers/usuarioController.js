import pool from "../config/db.js";

export const listarUsuarios = async (req, res) => {
  try {
    //executar a consulta no banco de dados
    //Devolver os dados com o status correto
  } catch (erro) {
    console.error("Erro ao listar usuários:", erro);
    res
      .status(500)
      .json({ erro: "Erro interno no servidor ao listar usuários." });
  }
};
