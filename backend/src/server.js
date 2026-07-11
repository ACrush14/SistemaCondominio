import express from "express";
import cors from "cors";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import reservaRoutes from "./routes/reservaRoutes.js";
import visitanteRoutes from "./routes/visitanteRoutes.js";
import condominioRoutes from "./routes/condominioRoutes.js";

const app = express();

// 1. OBRIGATÓRIO: Configuração de CORS habilitando integração com o Frontend em http://localhost:3001
app.use(
  cors({
    origin: ["http://localhost:3001", "http://127.0.0.1:3001", "*"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// 2. Rotas Principais da API do Backend
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/reservas", reservaRoutes);
app.use("/api/visitantes", visitanteRoutes);
app.use("/api/condominio", condominioRoutes);

// Rota de Healthcheck / Status
app.get("/api/status", async (req, res) => {
  res.json({
    servidor: "CondoManage Backend Express",
    status: "ONLINE",
    origemPermitida: "http://localhost:3001",
    data: new Date().toISOString(),
  });
});

app.get("/api/teste-banco", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS data_atual");
    res.json({
      mensagem: "Banco conectado com sucesso!",
      data: result.rows[0].data_atual,
    });
  } catch (erro) {
    console.error("Erro ao conectar no banco:", erro);
    res.status(500).json({ erro: "Falha na conexão com o banco de dados." });
  }
});

// Porta do Backend (Padrão 3333 para não conflitar com Next.js na 3001)
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`===========================================================`);
  console.log(`🚀 CondoManage Backend rodando com sucesso na porta ${PORT}`);
  console.log(`🔗 Integrado e aceitando requisições do Frontend: http://localhost:3001`);
  console.log(`===========================================================`);
});
