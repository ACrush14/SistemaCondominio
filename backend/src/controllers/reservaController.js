import pool from "../config/db.js";

//criar reserva

export const criarReserva = async (req, res) => {
  const usuario_id = req.usuario.id;

  const { area, data_reserva } = req.body;

  try {
    const novaReserva = await pool.query(
      "INSERT INTO reservas (usuario_id, area, data_reserva) VALUES ($1, $2, $3) RETURNING *",
      [usuario_id, area, data_reserva],
    );

    res.status(201).json({
      mensagem: "Reserva realizada com sucesso!",
      reserva: novaReserva.rows[0],
    });
  } catch (erro) {
    // A trava UNIQUE que configuramos no PostgreSQL dispara o erro código '23505' se houver duplicidade
    if (erro.code === "23505") {
      return res
        .status(409)
        .json({ erro: "Está área já está reservada para essa data." });
    }

    console.error("Erro ao criar reserva:", erro);
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
};
export const listarReservas = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT r.id, r.area, r.data_reserva, u.nome FROM reservas r JOIN usuarios u ON r.usuario_id = u.id ORDER BY r.data_reserva ASC`,
    );
    res.status(200).json(resultado.rows);
  } catch (erro) {
    console.error("Erro ao listar reservas: ", erro);
    res
      .status(500)
      .json({ erro: "Erro interno no servidor ao listar reservar" });
  }
};

export const deletarReservas = async (req, res) => {
  const { id } = req.params;
  const { id: id_requisitante, role } = req.usuario;
  try {
    const busca = await pool.query("SELECT * FROM reservas WHERE id = $1", [
      id,
    ]);

    if (busca.rowCount === 0) {
      return res(404).json({ erro: "Reserva não encontrada." });
    }
    const reserva = busca.rows[0];

    //se não for o sindico nem o dono da reserva, bloqueia
    if (role !== "sindico" && reserva.usuario_id !== id_requisitante) {
      console.warn(
        `[SEGURANÇA] Usuário ${id_requisitante} tentou apagar a reserva ${id} do vizinho`,
      );
      return res
        .status(403)
        .json({
          erro: "Acesso negado. Você só pode cancelar as suas reservas",
        });
    }
    //se passou da checagem, pode deletar:
    await pool.query("DELETE FROM reservas WHERE id = $1", [id]);

    console.log(
      `[AUDITORIA] Reserva ${id} da área '${reserva.area}' foi cancelada por ${id_requisitante} (Cargo: ${role})`,
    );

    res.status(200).json({ mensagem: "Reserva cancelada com sucesso." });
  } catch (erro) {
    console.error("Erro ao apagar reservas: ", erro);
    res
      .status(500)
      .json({ erro: "Erro interno no servidor ao apagar reservar" });
  }
};
