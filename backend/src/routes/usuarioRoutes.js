import express from "express";
import { verificarToken } from "../middlewares/authMiddleware.js";
import {
  listarUsuarios,
  deletarUsuario,
  atualizarUsuario,
} from "../controllers/usuarioController.js";

const router = express.Router();

//Quando um get chegar na rota raiz dos usuários, ele deve
//passar primeiro pelo verificarToken e então só ir
//buscar os dados (listarUsario)

router.get("/", verificarToken, listarUsuarios);
router.delete("/:id", verificarToken, deletarUsuario);
router.put("/:id", verificarToken, atualizarUsuario);

export default router;
