import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/store/db";
import { obterCondominioId } from "../../../../../lib/tenant";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const condominioId = obterCondominioId(req);
    const { id } = await params;
    const idNum = Number(id);
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json({ erro: "ID de usuário inválido." }, { status: 400 });
    }

    const verif = await pool.query(
      `SELECT id, nome, email, perfil FROM usuarios
       WHERE id = $1 AND (
         condominio_id = $2 OR EXISTS (
           SELECT 1 FROM usuario_condominios uc WHERE uc.usuario_id = usuarios.id AND uc.condominio_id = $2
         )
       )`,
      [idNum, condominioId]
    );

    if (verif.rowCount === 0) {
      return NextResponse.json(
        { erro: "Usuário não encontrado ou você não tem permissão para acessá-lo." },
        { status: 404 }
      );
    }

    const todosRes = await pool.query("SELECT id, nome, slug FROM condominios ORDER BY id ASC");
    const vinculosRes = await pool.query(
      "SELECT condominio_id FROM usuario_condominios WHERE usuario_id = $1 ORDER BY condominio_id ASC",
      [idNum]
    );

    const vinculados = vinculosRes.rows.map((r) => Number(r.condominio_id));

    return NextResponse.json({
      usuario: verif.rows[0],
      todos_condominios: todosRes.rows,
      condominios_vinculados: vinculados,
    });
  } catch (erro: unknown) {
    console.error("Erro ao carregar vínculos de condomínios:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao carregar vínculos: " + msg }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const condominioId = obterCondominioId(req);
    const { id } = await params;
    const idNum = Number(id);
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json({ erro: "ID de usuário inválido." }, { status: 400 });
    }

    const verif = await pool.query(
      `SELECT id, condominio_id FROM usuarios
       WHERE id = $1 AND (
         condominio_id = $2 OR EXISTS (
           SELECT 1 FROM usuario_condominios uc WHERE uc.usuario_id = usuarios.id AND uc.condominio_id = $2
         )
       )`,
      [idNum, condominioId]
    );

    if (verif.rowCount === 0) {
      return NextResponse.json(
        { erro: "Usuário não encontrado ou sem permissão para modificá-lo." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const condominios_ids = Array.isArray(body.condominios_ids)
      ? body.condominios_ids.map((cid: unknown) => Number(cid)).filter((cid: number) => !isNaN(cid) && cid > 0)
      : [];

    if (condominios_ids.length === 0) {
      return NextResponse.json(
        { erro: "O usuário deve estar vinculado a pelo menos um condomínio no sistema." },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM usuario_condominios WHERE usuario_id = $1", [idNum]);

      for (const cid of condominios_ids) {
        await client.query(
          "INSERT INTO usuario_condominios (usuario_id, condominio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [idNum, cid]
        );
      }

      // Se o condomínio principal em usuarios.condominio_id não estiver na nova lista, ajusta para o primeiro da lista
      const cidAtual = Number(verif.rows[0].condominio_id);
      if (!condominios_ids.includes(cidAtual)) {
        await client.query("UPDATE usuarios SET condominio_id = $1 WHERE id = $2", [condominios_ids[0], idNum]);
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    const vinculosAtualizados = await pool.query(
      "SELECT condominio_id FROM usuario_condominios WHERE usuario_id = $1 ORDER BY condominio_id ASC",
      [idNum]
    );

    return NextResponse.json({
      sucesso: true,
      mensagem: "Vínculos de condomínio atualizados com sucesso!",
      condominios_vinculados: vinculosAtualizados.rows.map((r) => Number(r.condominio_id)),
    });
  } catch (erro: unknown) {
    console.error("Erro ao atualizar vínculos de condomínios:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao atualizar vínculos: " + msg }, { status: 400 });
  }
}
