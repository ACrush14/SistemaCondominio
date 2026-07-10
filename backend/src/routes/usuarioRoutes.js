import express from "express";
import {
  listarUsuarios,
  cadastrarInterno,
  deletarUsuario,
} from "../controllers/usuarioController.js";

const router = express.Router();

// Nota: Em um sistema final, você adicionaria o middleware verificarToken aqui
// para garantir que apenas o Síndico acesse estas rotas.
router.get("/", listarUsuarios);
router.post("/cadastro-interno", cadastrarInterno);
router.delete("/:id", deletarUsuario);

export default router;
