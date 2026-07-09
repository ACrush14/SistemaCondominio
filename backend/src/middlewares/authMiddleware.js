import jwt from "jsonwebtoken";

export const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ erro: "Acesso negado. Token não fornecido." });
  }

  //como começa com Bearer + Token, vamos separar a palavra token
  const token = authHeader.split(" ")[1];

  try {
    //tenta abrir o cadeado do token usando a nossa chave mestra do .env
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);

    //se der certo, penduramos os dados do morador, id e role, dentro da requisição
    //Assim, o proximo arquivo (controlador) sabe exatamente quem está fazendo o pedido
    req.usuario = decodificado;

    //Libera a catraca para a requisição continuar
    next();
  } catch (erro) {
    return res.status(401).json({ erro: "token inválido ou expirado." });
  }
};
