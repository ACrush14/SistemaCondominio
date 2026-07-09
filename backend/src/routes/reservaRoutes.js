import express from "express";
import { verificarToken } from "../middlewares/authMiddleware.js";
import {
  criarReserva,
  deletarReservas,
  listarReservas,
} from "../controllers/reservaController.js";

const router = express.Router();

// A rota raiz de reservas exige o token. Se passar, vai para o controlador.
router.post("/", verificarToken, criarReserva);
router.get("/", verificarToken, listarReservas); // Nova rota GET adicionada
router.delete("/:id", verificarToken, deletarReservas); // Nova rota GET adicionada

export default router;
