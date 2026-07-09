import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import jwt from "jsonwebtoken";

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

export const loginUsuario = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuarioBanco = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email],
    );

    if (usuarioBanco.rows.length === 0) {
      return res.status(401).json({ erro: "Email ou senha incorretos." });
    }

    const usuario = usuarioBanco.rows[0];

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ erro: "Email ou senha incorretos." });
    }

    //Gera a pulseira de acesso que é o token jwt)
    //guardamos apenas o ID e a Role dentro do token, nunca a senha
    const token = jwt.sign(
      { id: usuario.id, role: usuario.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }, //O token expira em um dia
    );

    //Devolve o token e os dados básicos para o celular
    res.status(200).json({
      mensagem: "Login realizado com sucesso!",
      token: token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
    });
  } catch (erro) {
    console.error("Erro no login: ", erro);
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
};
