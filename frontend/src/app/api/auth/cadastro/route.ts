import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "../../../../lib/store/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nome = (body.nome || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const senha = body.senha || "";
    const unidade = (body.unidade || "").trim();
    const condominioId = Number(body.condominio_id);

    if (!nome || !email || !unidade) {
      return NextResponse.json({ erro: "Nome, e-mail e unidade são obrigatórios." }, { status: 400 });
    }
    if (senha.length < 6) {
      return NextResponse.json({ erro: "A senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
    }
    if (!condominioId || isNaN(condominioId)) {
      return NextResponse.json({ erro: "Selecione um condomínio." }, { status: 400 });
    }

    // Nunca confia no condominio_id só porque o número existe — confirma que é um
    // condomínio real cadastrado na plataforma antes de vincular o novo usuário a ele.
    const condominioExiste = await pool.query("SELECT id FROM condominios WHERE id = $1", [condominioId]);
    if (condominioExiste.rowCount === 0) {
      return NextResponse.json({ erro: "Condomínio inválido." }, { status: 400 });
    }

    // Auto-cadastro público é sempre perfil MORADOR — nunca aceita perfil vindo do
    // corpo da requisição. Contas de SINDICO/PORTEIRO só são criadas por um síndico
    // já autenticado (POST /api/usuarios), nunca por essa rota sem sessão.
    const senhaHash = await bcrypt.hash(senha, 10);

    const resultado = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, unidade, condominio_id)
       VALUES ($1, $2, $3, 'MORADOR', $4, $5)
       RETURNING id, nome, email, perfil, unidade`,
      [nome, email, senhaHash, unidade, condominioId]
    );

    await pool.query(
      `INSERT INTO usuario_condominios (usuario_id, condominio_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [resultado.rows[0].id, condominioId]
    );

    return NextResponse.json(
      { sucesso: true, mensagem: "Cadastro realizado com sucesso! Faça login para continuar.", usuario: resultado.rows[0] },
      { status: 201 }
    );
  } catch (erro: unknown) {
    if (erro && typeof erro === "object" && "code" in erro && erro.code === "23505") {
      return NextResponse.json({ erro: "Este e-mail já está cadastrado." }, { status: 409 });
    }
    console.error("Erro no cadastro:", erro);
    const msg = erro instanceof Error ? erro.message : String(erro);
    return NextResponse.json({ erro: "Erro ao processar cadastro: " + msg }, { status: 500 });
  }
}
