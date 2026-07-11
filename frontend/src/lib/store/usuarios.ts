export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: "SINDICO" | "PORTEIRO" | "MORADOR";
  unidade: string;
  status: "ATIVO" | "INATIVO";
}

function seedUsuarios(): Usuario[] {
  return [
    {
      id: "1",
      nome: "Anderson de Lima",
      email: "anderson.sindico@condominio.com",
      perfil: "SINDICO",
      unidade: "Administração (Apto 501)",
      status: "ATIVO",
    },
    {
      id: "2",
      nome: "Fulano Alterado",
      email: "fulano.porteiro@condominio.com",
      perfil: "PORTEIRO",
      unidade: "Portaria Principal",
      status: "ATIVO",
    },
    {
      id: "100",
      nome: "João (Morador Tailson)",
      email: "joao@tailson.com",
      perfil: "MORADOR",
      unidade: "Apto 301",
      status: "ATIVO",
    },
    {
      id: "3",
      nome: "Beatriz Mendonça",
      email: "beatriz.101@condominio.com",
      perfil: "MORADOR",
      unidade: "Apto 101",
      status: "ATIVO",
    },
    {
      id: "4",
      nome: "Carlos Eduardo Prado",
      email: "carlos.102@condominio.com",
      perfil: "MORADOR",
      unidade: "Apto 102",
      status: "ATIVO",
    },
    {
      id: "5",
      nome: "Mariana Vasconcelos",
      email: "mariana.201@condominio.com",
      perfil: "MORADOR",
      unidade: "Apto 201",
      status: "ATIVO",
    },
    {
      id: "6",
      nome: "Ricardo Ferreira",
      email: "ricardo.202@condominio.com",
      perfil: "MORADOR",
      unidade: "Apto 202",
      status: "ATIVO",
    },
    {
      id: "7",
      nome: "Fernanda Guimarães",
      email: "fernanda.301@condominio.com",
      perfil: "MORADOR",
      unidade: "Apto 301",
      status: "ATIVO",
    },
    {
      id: "8",
      nome: "Lucas Siqueira",
      email: "lucas.302@condominio.com",
      perfil: "MORADOR",
      unidade: "Apto 302",
      status: "ATIVO",
    },
    {
      id: "9",
      nome: "Patrícia Oliveira",
      email: "patricia.401@condominio.com",
      perfil: "MORADOR",
      unidade: "Apto 401",
      status: "ATIVO",
    },
    {
      id: "10",
      nome: "Gabriel Souza",
      email: "gabriel.402@condominio.com",
      perfil: "MORADOR",
      unidade: "Apto 402",
      status: "ATIVO",
    },
    {
      id: "11",
      nome: "Juliana Alcantara",
      email: "juliana.501@condominio.com",
      perfil: "MORADOR",
      unidade: "Apto 501",
      status: "ATIVO",
    },
    {
      id: "12",
      nome: "Rodrigo Bittencourt",
      email: "rodrigo.502@condominio.com",
      perfil: "MORADOR",
      unidade: "Apto 502",
      status: "INATIVO",
    },
  ];
}

// Ver comentário equivalente em lib/store/ocorrencias.ts sobre o porquê do globalThis.
declare global {
  // eslint-disable-next-line no-var
  var __usuariosDB: Usuario[] | undefined;
}

export const usuariosDB: Usuario[] =
  globalThis.__usuariosDB ?? (globalThis.__usuariosDB = seedUsuarios());
