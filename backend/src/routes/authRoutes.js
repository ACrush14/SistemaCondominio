import express from "express";
import { validarCadastro } from "../middlewares/validarMorador.js";
import { registrarUsuario } from "../controllers/authController.js";

const router = express.Router();

//Quando um post chegar em register, passe pelo
//guarda, (validarCadastro)  e depois vá para
//o gerente (registrarUsuario)

router.post("/register", validarCadastro, registrarUsuario);

export default router;
