import express from "express";
import {
  registrarVisitante,
  listarVisitantesPorUnidade,
  atualizarStatusVisitante,
} from "../controllers/visitanteController.js";

const router = express.Router();

router.post("/", registrarVisitante);
router.get("/unidade/:unidade", listarVisitantesPorUnidade);
router.put("/:id/status", atualizarStatusVisitante);

export default router;
