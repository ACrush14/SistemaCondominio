import bcrypt from "bcryptjs";
import pool from "../config/db.js";

export const registrarUsuario = async (req, res) => {
  const { nome, email, senha, role } = req.body;

  try {
    //vamos verificar se o email já existe no banco, não entendi como funciona...
    const usuarioExistente = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email],
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(409).json({ erro: "Este email já está em uso." });
    }

    //criptografa a senha (salting de 10 rounds) o que é salt? o que é bcrypt?
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    //Insere o novo usuário no banco. pq tudo tem await? o que é const?
    const novoUsuario = await pool.query(
      "INSERT INTO usuarios(nome, email, senha_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, role",
      [nome, email, senhaHash, role],
    );

    //retorna sucesso sem devolver a senha secreta
    res.status(201).json({
      mensagem: "Usuário registrado com sucesso!",
      usuario: novoUsuario.rows[0],
    });
  } catch (erro) {
    //pq todo catch tem um (erro)? não deveria ser automático? Deveria eu usar JAVA?
    console.error("Erro ao registrar usuário:", erro);
    res
      .status(500)
      .json({ erro: "Erro interno no servidor ao tentar registrar." });
  }
};
