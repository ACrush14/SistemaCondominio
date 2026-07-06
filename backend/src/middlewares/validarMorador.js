import { z } from "zod";

const moradorSchema = z.object({
  nome: z.string().min(3, "O nome precisa ter pelo menos 3 letras."),
  email: z.string().email("Formato de e-mail inválido."),
  senha: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres."),
  role: z.enum(["sindico", "porteiro", "morador"]),
});

export const validarCadastro = (req, res, next) => {
  try {
    moradorSchema.parse(req.body);
    next();
  } catch (erro) {
    return res.status(400).json({ erros: erro.erros });
  }
};
