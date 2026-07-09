import pool from "../config/db.js";

export const listarUsuarios = async (req, res) => {
  try {
    //executar a consulta no banco de dados
    const resultado = await pool.query(
      "SELECT id, nome, email, role FROM usuarios ORDER BY nome ASC",
    );

    res.status(200).json(resultado.rows);

    //Devolver os dados com o status correto
  } catch (erro) {
    console.error("Erro ao listar usuários:", erro);
    res
      .status(500)
      .json({ erro: "Erro interno no servidor ao listar usuários." });
  }
};

export const deletarUsuario = async (req, res) => {
  //Eu não entendi o que é o async (req, res) =>

  const { id } = req.params;

  try {
    //Executa a query de deleção usando $1 para evitar SQL Injection
    const resultado = await pool.query(
      //O que exatamente é await pool.query
      "DELETE FROM usuarios WHERE id = $1",
      [id],
    );

    //verificar se o banco de dados realmente apagou algo
    if (resultado.rowCount === 0) {
      //se o resultado da deleção for zero
      return res.status(404).json({ erro: "Usuario não encontrado." });
    }
    //se for tudo ok, remove o usuário
    res.status(200).json({ mensagem: "Usuário removido com sucesso" });
  } catch (erro) {
    console.error("Erro ao deletar usuario:", erro);
    res
      .status(500)
      .json({ erro: "Erro interno no servidor ao tentar deletar o usuário;" });
  }
};

//Atualizar usuario
export const atualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nome, email } = req.body;

  try {
    const resultado = await pool.query(
      "UPDATE usuarios SET nome = $1, email = $2 WHERE id = $3 RETURNING id, nome, email, role",
      [nome, email, id],
    );

    if (resultado.rowCount === 0) {
      //se o resultado da deleção for zero
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    res
      .status(200)
      .json({
        mensagem: "Usuário modificado com sucesso",
        usuario: resultado.rows[0],
      });
  } catch (erro) {
    console.error("Erro ao modificar usuario: ", erro);
    res
      .status(500)
      .json({ erro: "Erro interno no servidor ao tentar modificar usuário" });
  }
};
