import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { pool } from "../../../../../lib/store/db";
import { obterCondominioId } from "../../../../../lib/tenant";

interface PayloadSessao {
  perfil: string;
  condominio_id?: number;
  condominios?: number[];
}

// Decodifica o JWT direto do cookie (mesmo padrão de /api/auth/me e
// /api/auth/selecionar-condominio) — precisamos da lista COMPLETA de condomínios
// do chamador aqui, não só do condomínio ativo que o proxy.ts já injeta no header.
function obterSessao(req: Request): PayloadSessao | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("sessao="))
    ?.split("=")[1];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as PayloadSessao;
  } catch {
    return null;
  }
}

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
       WHERE id = $1 AND status = 'ATIVO' AND (
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

    const todosRes = await pool.query(
      "SELECT id, nome, slug FROM condominios WHERE deletado_em IS NULL ORDER BY id ASC"
    );
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
    const sessao = obterSessao(req);
    if (!sessao) {
      return NextResponse.json({ erro: "Sessão inválida." }, { status: 401 });
    }
    if (sessao.perfil !== "SINDICO") {
      return NextResponse.json(
        { erro: "Só uma conta de síndico pode gerenciar vínculos de condomínio." },
        { status: 403 }
      );
    }

    const condominioId = obterCondominioId(req);
    const { id } = await params;
    const idNum = Number(id);
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json({ erro: "ID de usuário inválido." }, { status: 400 });
    }

    const verif = await pool.query(
      `SELECT id, condominio_id FROM usuarios
       WHERE id = $1 AND status = 'ATIVO' AND (
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

    // CRÍTICO: um chamador só pode conceder acesso a condomínios que ele MESMO já tem
    // acesso — nunca confie na lista vinda do corpo da requisição sem checar contra a
    // lista de condomínios do próprio chamador (vinda do JWT verificado, não do cliente).
    // Sem isso, qualquer usuário logado poderia se auto-conceder acesso a QUALQUER
    // condomínio da plataforma só chamando esta rota pro próprio ID.
    const meusCondominios = sessao.condominios ?? [sessao.condominio_id ?? 1];
    const idsNaoAutorizados = condominios_ids.filter((cid: number) => !meusCondominios.includes(cid));
    if (idsNaoAutorizados.length > 0) {
      return NextResponse.json(
        {
          erro: `Sua conta não tem acesso ao(s) condomínio(s) ${idsNaoAutorizados.join(
            ", "
          )} — não é possível conceder um vínculo que você mesmo não possui.`,
        },
        { status: 403 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Só apaga/recria vínculos DENTRO do escopo de autoridade do chamador (meusCondominios).
      // Um vínculo que o usuário-alvo tenha com um condomínio fora dessa lista (que o
      // chamador não administra) nunca é tocado por esta chamada.
      await client.query(
        "DELETE FROM usuario_condominios WHERE usuario_id = $1 AND condominio_id = ANY($2::int[])",
        [idNum, meusCondominios]
      );

      for (const cid of condominios_ids) {
        await client.query(
          "INSERT INTO usuario_condominios (usuario_id, condominio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [idNum, cid]
        );
      }

      // Só reatribui o condomínio "principal" se o atual também estava dentro da
      // autoridade do chamador — nunca move o principal de um condomínio que o
      // chamador nem administra.
      const cidAtual = Number(verif.rows[0].condominio_id);
      if (meusCondominios.includes(cidAtual) && !condominios_ids.includes(cidAtual)) {
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
