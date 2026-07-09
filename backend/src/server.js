import express from "express";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"; //Importando as rotas de autenticação
import usuarioRoutes from "./routes/usuarioRoutes.js";

const app = express();
app.use(express.json());

//o que caralhos é isso que eu estou escrevendo, não estou entendendo.
const PORT = process.env.PORT || 3333;

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);

app.get("/api/teste-banco", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS data_atual");
    res.json({
      mensagem: "Banco conectado com sucesso!",
      data: result.rows[0].data_atual,
    });
  } catch (erro) {
    console.error("Erro ao conectar no banco:", erro);
    res.status(500).json({ erro: "falha na conexão com o banco de dados." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});
