import {
  registrarMorador,
  listarMoradores,
  deletarMorador,
} from "../controllers/moradorController.js";
// ...
router.post("/", registrarMorador);
router.get("/", listarMoradores);
router.delete("/:id", deletarMorador);
