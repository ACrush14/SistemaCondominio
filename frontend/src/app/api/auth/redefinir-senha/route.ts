import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "../../../../lib/store/db";
import { validarEConsumirCodigo } from "../../../../lib/store/recuperacaoSenhaDb";

export async function POST(req: Request) {
  try {
    const { email, codigo, novaSenha } = await req.json();
    const emailLimpo = (email || "").trim().toLowerCase();
    const codigoLimpo = (codigo || "").trim();

    if (!emailLimpo || !/^\d{6}$/.test(codigoLimpo)) {
      return NextResponse.json({ erro: "Informe o e-mail e o código de 6 dígitos recebido." }, { status: 400 });
    }
    if (!novaSenha || novaSenha.length < 6) {
      return NextResponse.json({ erro: "A nova senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const usuario = await pool.query("SELECT id FROM usuarios WHERE email = $1", [emailLimpo]);
    if (usuario.rowCount === 0) {
      // Mesma resposta genérica tanto pra e-mail inexistente quanto pra código errado —
      // não revela se o e-mail tem conta ou não (mesma lógica anti-enumeração da rota de envio).
      return NextResponse.json({ erro: "Código inválido ou expirado." }, { status: 400 });
    }

    const usuarioId = usuario.rows[0].id;
    const valido = await validarEConsumirCodigo(usuarioId, codigoLimpo);
    if (!valido) {
      return NextResponse.json({ erro: "Código inválido ou expirado." }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await pool.query("UPDATE usuarios SET senha_hash = $1 WHERE id = $2", [senhaHash, usuarioId]);

    return NextResponse.json({ sucesso: true, mensagem: "Senha redefinida com sucesso! Faça login com a nova senha." });
  } catch (erro: unknown) {
    console.error("Erro em redefinir-senha:", erro);
    return NextResponse.json({ erro: "Erro ao redefinir senha." }, { status: 500 });
  }
}
