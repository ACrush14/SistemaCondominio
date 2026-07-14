import { NextResponse } from "next/server";
import { pool } from "../../../../lib/store/db";
import { obterCondominioId } from "../../../../lib/tenant";
import { gerarCodigoVisita } from "../../../../lib/visitas";

export async function POST(req: Request) {
  const condominioId = obterCondominioId(req);
  const body = await req.json();
  const expiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Só 1 milhão de combinações possíveis (6 dígitos) — tenta de novo em caso de colisão
  // rara com um código ainda ativo de outro visitante (codigo tem UNIQUE constraint).
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const codigo = gerarCodigoVisita();
    try {
      const resultado = await pool.query(
        `INSERT INTO liberacoes_visita (codigo, nome_visitante, unidade, morador, expira_em, condominio_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING codigo, nome_visitante, unidade, morador, status, expira_em`,
        [codigo, body.nome_visitante || null, body.unidade, body.morador || null, expiraEm, condominioId]
      );
      return NextResponse.json(resultado.rows[0], { status: 201 });
    } catch (erro: unknown) {
      const ehColisao = erro && typeof erro === "object" && "code" in erro && erro.code === "23505";
      if (!ehColisao) {
        return NextResponse.json({ erro: "Erro ao gerar liberação de visita." }, { status: 400 });
      }
      // colisão de código: tenta de novo com um novo número aleatório
    }
  }

  return NextResponse.json(
    { erro: "Não foi possível gerar um código único, tente novamente." },
    { status: 500 }
  );
}
