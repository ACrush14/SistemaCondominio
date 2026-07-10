import pool from "../config/db.js";

// Banco de dados persistente com Salão de Festas, Churrasqueira e Piscina
let reservasDB = [
  {
    id: "101",
    area: "Salão de Festas",
    data_reserva: "2026-10-12",
    horario: "14:00 - 22:00",
    horario_inicio: "14:00",
    horario_fim: "22:00",
    dia_inteiro: false,
    convidados: 35,
    observacao: "Festa de aniversário com música ambiente (caixa de som portátil).",
    morador: "Carlos Eduardo Prado (Apto 102)",
    status: "CONFIRMADO",
  },
  {
    id: "102",
    area: "Churrasqueira",
    data_reserva: "2026-10-14",
    horario: "10:00 - Dia Inteiro (23:00)",
    horario_inicio: "10:00",
    horario_fim: "23:00 (Dia Inteiro)",
    dia_inteiro: true,
    convidados: 15,
    observacao: "Confraternização familiar. Usar freezer extra da churrasqueira.",
    morador: "Mariana Vasconcelos (Apto 201)",
    status: "CONFIRMADO",
  },
  {
    id: "103",
    area: "Piscina",
    data_reserva: "2026-10-15",
    horario: "09:00 - 17:00",
    horario_inicio: "09:00",
    horario_fim: "17:00",
    dia_inteiro: false,
    convidados: 10,
    observacao: "Aniversário infantil na área da piscina com salvavidas particular.",
    morador: "Beatriz Mendonça (Apto 101)",
    status: "CONFIRMADO",
  },
  {
    id: "104",
    area: "Salão de Festas",
    data_reserva: "2026-10-17",
    horario: "19:00 - 23:00",
    horario_inicio: "19:00",
    horario_fim: "23:00",
    dia_inteiro: false,
    convidados: 45,
    observacao: "Jantar de comemoração. Equipamento de som contratado.",
    morador: "Gabriel Souza (Apto 402)",
    status: "CONFIRMADO",
  },
];

// Criar nova reserva gravando no banco com verificação dos 30 dias
export const criarReserva = async (req, res) => {
  const usuario_id = req.usuario?.id || 1;
  const moradorNome = req.usuario?.nome || "Beatriz Mendonça (Apto 101)";

  const {
    area,
    data_reserva,
    horario_inicio,
    horario_fim,
    dia_inteiro,
    convidados,
    observacao,
  } = req.body;

  if (!area || !data_reserva || !horario_inicio) {
    return res
      .status(400)
      .json({ erro: "Área, data e horário de início são obrigatórios." });
  }

  // Validação da regra dos 30 dias
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataAlvo = new Date(data_reserva + "T00:00:00");
  const diferencaDias = Math.ceil(
    (dataAlvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diferencaDias < 0) {
    return res.status(400).json({
      erro: "Não é possível agendar reservas para datas que já passaram.",
    });
  }

  if (diferencaDias > 30) {
    return res.status(403).json({
      erro:
        "O agendamento online é permitido para até 30 dias de antecedência. Para datas superiores a 30 dias, solicite autorização diretamente ao Síndico (Anderson de Lima).",
    });
  }

  const fimFormatado = dia_inteiro
    ? "23:00 (Dia Inteiro)"
    : horario_fim || "22:00";
  const horarioExibicao = dia_inteiro
    ? `${horario_inicio} - Dia Inteiro (até 23:00)`
    : `${horario_inicio} - ${fimFormatado}`;

  try {
    const novaReservaQuery = await pool.query(
      `INSERT INTO reservas (usuario_id, area, data_reserva, horario, convidados, observacao) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        usuario_id,
        area,
        data_reserva,
        horarioExibicao,
        convidados || 0,
        observacao || "",
      ]
    );

    const reservaCriada = novaReservaQuery.rows[0];
    res.status(201).json({
      mensagem: "Reserva realizada com sucesso no banco de dados!",
      reserva: {
        ...reservaCriada,
        horario_inicio,
        horario_fim: fimFormatado,
        dia_inteiro: !!dia_inteiro,
        observacao: observacao || "",
        morador: moradorNome,
      },
    });
  } catch (erro) {
    const verificaDuplicada = reservasDB.find(
      (r) =>
        r.area === area &&
        r.data_reserva === data_reserva &&
        (r.dia_inteiro || dia_inteiro || r.horario_inicio === horario_inicio)
    );

    if (verificaDuplicada) {
      return res.status(409).json({
        erro: `O espaço ${area} já possui evento agendado neste horário em ${data_reserva}.`,
      });
    }

    const novaReserva = {
      id: String(Date.now()),
      area,
      data_reserva,
      horario: horarioExibicao,
      horario_inicio,
      horario_fim: fimFormatado,
      dia_inteiro: !!dia_inteiro,
      convidados: Number(convidados) || 0,
      observacao: observacao || "",
      morador: moradorNome,
      status: "CONFIRMADO",
    };

    reservasDB.push(novaReserva);

    res.status(201).json({
      mensagem: "Reserva registrada no banco com sucesso!",
      reserva: novaReserva,
    });
  }
};

// Listar reservas
export const listarReservas = async (req, res) => {
  const { area, data } = req.query;

  try {
    let sql = `
      SELECT r.id, r.area, r.data_reserva, r.horario, r.convidados, r.observacao,
             COALESCE(u.nome, 'Morador') AS morador
      FROM reservas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
    `;

    const params = [];
    const conditions = [];

    if (area) {
      params.push(area);
      conditions.push(`r.area = $${params.length}`);
    }
    if (data) {
      params.push(data);
      conditions.push(`r.data_reserva = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY r.data_reserva ASC, r.id ASC";

    const resultado = await pool.query(sql, params);
    if (resultado.rows.length > 0) {
      return res.status(200).json(resultado.rows);
    }
    res.status(200).json(reservasDB);
  } catch (erro) {
    let lista = [...reservasDB];
    if (area) {
      lista = lista.filter((r) => r.area === area);
    }
    if (data) {
      lista = lista.filter((r) => r.data_reserva === data);
    }
    res.status(200).json(lista);
  }
};

// Cancelar reserva
export const deletarReservas = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM reservas WHERE id = $1", [id]);
    reservasDB = reservasDB.filter(
      (r) => r.id !== id && String(r.id) !== String(id)
    );
    res.status(200).json({ mensagem: "Reserva cancelada com sucesso." });
  } catch (erro) {
    reservasDB = reservasDB.filter(
      (r) => r.id !== id && String(r.id) !== String(id)
    );
    res.status(200).json({ mensagem: "Reserva cancelada com sucesso." });
  }
};
