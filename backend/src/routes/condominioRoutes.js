import express from "express";
import {
  getResumoSindico,
  listarOcorrencias,
  criarOcorrencia,
  listarComunicados,
  listarEncomendas,
  perguntarIa,
  conversarMania,
} from "../controllers/condominioController.js";

const router = express.Router();

router.get("/resumo-sindico", getResumoSindico);
router.get("/ocorrencias", listarOcorrencias);
router.post("/ocorrencias", criarOcorrencia);
router.get("/comunicados", listarComunicados);
router.get("/encomendas", listarEncomendas);
router.post("/ia-sindico", perguntarIa);
router.post("/ia-mania", conversarMania);

export default router;

