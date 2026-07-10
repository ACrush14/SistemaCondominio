import { NextResponse } from "next/server";

let usuariosDB = [
  {
    id: "1",
    nome: "Anderson de Lima",
    email: "anderson.sindico@condominio.com",
    perfil: "SINDICO",
    unidade: "Administração (Apto 501)",
  },
  {
    id: "2",
    nome: "Fulano Alterado",
    email: "fulano.porteiro@condominio.com",
    perfil: "PORTEIRO",
    unidade: "Portaria Principal",
  },
  {
    id: "3",
    nome: "Beatriz Mendonça",
    email: "beatriz.101@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 101",
  },
  {
    id: "4",
    nome: "Carlos Eduardo Prado",
    email: "carlos.102@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 102",
  },
  {
    id: "5",
    nome: "Mariana Vasconcelos",
    email: "mariana.201@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 201",
  },
  {
    id: "6",
    nome: "Ricardo Ferreira",
    email: "ricardo.202@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 202",
  },
  {
    id: "7",
    nome: "Fernanda Guimarães",
    email: "fernanda.301@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 301",
  },
  {
    id: "8",
    nome: "Lucas Siqueira",
    email: "lucas.302@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 302",
  },
  {
    id: "9",
    nome: "Patrícia Oliveira",
    email: "patricia.401@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 401",
  },
  {
    id: "10",
    nome: "Gabriel Souza",
    email: "gabriel.402@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 402",
  },
  {
    id: "11",
    nome: "Juliana Alcantara",
    email: "juliana.501@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 501",
  },
  {
    id: "12",
    nome: "Rodrigo Bittencourt",
    email: "rodrigo.502@condominio.com",
    perfil: "MORADOR",
    unidade: "Apto 502",
  },
];

export async function GET() {
  return NextResponse.json(usuariosDB);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const novo = {
      id: String(Date.now()),
      nome: body.nome,
      email: body.email,
      perfil: body.perfil || "MORADOR",
      unidade: body.unidade || "-",
    };
    usuariosDB.push(novo);
    return NextResponse.json(novo, { status: 201 });
  } catch (_err) {
    return NextResponse.json({ erro: "Erro ao cadastrar usuário" }, { status: 400 });
  }
}
