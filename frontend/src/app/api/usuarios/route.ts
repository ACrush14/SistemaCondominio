import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "../../../lib/store/db";
import { obterCondominioId } from "../../../lib/tenant";
import { listarUsuarios, contarUsuarios } from "../../../lib/store/usuariosDb";

export async function GET(req: Request) {
  try {
    const condominioId = obterCondominioId(req);
    const url = new URL(req.url);
    const limiteParam = parseInt(url.searchParams.get("limite") || "10", 10);
    const limite = isNaN(limiteParam) || limiteParam <= 0 ? 10 : Math.min(limiteParam, 100);

    let offset = 0;
    if (url.searchParams.has("offset")) {
      const offsetParam = parseInt(url.searchParams.get("offset") || "0", 10);
      offset = isNaN(offsetParam) || offsetParam < 0 ? 0 : offsetParam;
    } else if (url.searchParams.has("pagina") || url.searchParams.has("page")) {
      const paginaParam = parseInt(url.searchParams.get("pagina") || url.searchParams.get("page") || "1", 10);
      const pagina = isNaN(paginaParam) || paginaParam < 1 ? 1 : paginaParam;
      offset = (pagina - 1) * limite;
    }

    const log = await listarUsuarios(limite, condominioId, offset);
    const total = await contarUsuarios(condominioId);

    return NextResponse.json({
      usuarios: log,
      registros: log,
      total,
      offset,
      limite,
      paginas: Math.ceil(total / limite),
    });
  } catch (erro: unknown) {
    console.error("Erro ao listar usuários:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao listar usuários: " + msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const condominioId = obterCondominioId(req);
    const body = await req.json();
    const senhaHash = await bcrypt.hash(body.senha || "trocar123", 10);

    const resultado = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, unidade, condominio_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, email, perfil, unidade, status`,
      [body.nome, body.email, senhaHash, body.perfil || "MORADOR", body.unidade || "-", condominioId]
    );

    // Todo usuário precisa de pelo menos um vínculo em usuario_condominios (o próprio
    // condominio_id) — sem isso o JWT emitido no login dele ficaria com a lista vazia.
    await pool.query(
      `INSERT INTO usuario_condominios (usuario_id, condominio_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [resultado.rows[0].id, condominioId]
    );

    return NextResponse.json(resultado.rows[0], { status: 201 });
  } catch (erro: unknown) {
    if (erro && typeof erro === "object" && "code" in erro && erro.code === "23505") {
      return NextResponse.json({ erro: "Este email já está cadastrado." }, { status: 409 });
    }
    return NextResponse.json({ erro: "Erro ao cadastrar usuário" }, { status: 400 });
  }
}
