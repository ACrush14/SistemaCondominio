import express from "express";
import cors from "cors";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import reservaRoutes from "./routes/reservaRoutes.js";
import visitanteRoutes from "./routes/visitanteRoutes.js";

const app = express();

// 1. OBRIGATÓRIO: Middlewares Globais de Segurança e Formatação ANTES das rotas
app.use(cors({ origin: "http://localhost:3001" }));
app.use(express.json());

// 2. OBRIGATÓRIO: Rotas DEPOIS dos Middlewares
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/reservas", reservaRoutes);
app.use("/api/visitantes", visitanteRoutes);

// Porta e Conexão
const PORT = process.env.PORT || 3333;

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
