import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/store/db";
import { obterCondominioId } from "../../../../../lib/tenant";
import { validarFormatoCodigoVisita, validarStatusECodigoVisita } from "../../../../../lib/visitas";

export async function POST(req: Request) {
  const condominioId = obterCondominioId(req);
  const { codigo } = await req.json();

  if (!validarFormatoCodigoVisita(codigo)) {
    return NextResponse.json({ erro: "Código inválido." }, { status: 404 });
  }

  const resultado = await pool.query(
    "SELECT * FROM liberacoes_visita WHERE codigo = $1 AND condominio_id = $2",
    [codigo.trim(), condominioId]
  );
  const liberacao = resultado.rows[0];

  const validacao = validarStatusECodigoVisita(liberacao);
  if (!validacao.valido) {
    return NextResponse.json({ erro: validacao.erro }, { status: validacao.statusHttp });
  }

  await pool.query("UPDATE liberacoes_visita SET status = 'USADO' WHERE id = $1", [
    liberacao.id,
  ]);

  return NextResponse.json({
    mensagem: "Acesso liberado!",
    visitante: {
      nome_visitante: liberacao.nome_visitante,
      unidade: liberacao.unidade,
      morador: liberacao.morador,
    },
  });
}
