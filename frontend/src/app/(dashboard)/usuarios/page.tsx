"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// A estrutura de dados que o Front espera receber do Back
interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: "SINDICO" | "PORTEIRO" | "MORADOR";
  unidade: string;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const router = useRouter();

  // Estados do Formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState("MORADOR");
  const [unidade, setUnidade] = useState("");
  const [erroModal, setErroModal] = useState("");
  const [salvando, setSalvando] = useState(false);

  const buscarUsuarios = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setCarregando(true);
      const resposta = await fetch("http://localhost:3333/api/usuarios", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resposta.ok) throw new Error("Falha ao carregar usuários");

      const dados = await resposta.json();
      setUsuarios(dados);
    } catch (err) {
      setErro("Não foi possível carregar a lista de usuários.");
    } finally {
      setCarregando(false);
    }
  }, [router]);

  useEffect(() => {
    buscarUsuarios();
  }, [buscarUsuarios]);

  const criarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroModal("");
    setSalvando(true);

    try {
      const token = localStorage.getItem("token");
      const resposta = await fetch(
        "http://localhost:3333/api/usuarios/cadastro-interno",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nome, email, senha, perfil, unidade }),
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErroModal(dados.erro || "Erro ao cadastrar usuário.");
        setSalvando(false);
        return;
      }

      // Limpa os campos
      setNome("");
      setEmail("");
      setSenha("");
      setPerfil("MORADOR");
      setUnidade("");
      setModalAberto(false);
      setSalvando(false);
      buscarUsuarios();
    } catch (err) {
      setErroModal("Falha de comunicação com o servidor.");
      setSalvando(false);
    }
  };

  const deletarUsuario = async (id: string) => {
    if (
      !window.confirm(
        "Remover este usuário do sistema? O acesso dele será revogado imediatamente.",
      )
    )
      return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:3333/api/usuarios/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      buscarUsuarios();
    } catch (err) {
      setErro("Erro ao remover usuário.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark">
            Controle de Moradores e Equipe
          </h1>
          <p className="text-neutral mt-1">
            Gerencie os acessos ao sistema do condomínio.
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          + Novo Acesso
        </button>
      </div>

      {erro && (
        <div className="bg-tertiary/10 text-tertiary p-4 rounded-lg font-medium">
          {erro}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-neutral-light overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-light/50 border-b border-neutral-light text-neutral text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">Nome</th>
              <th className="p-4 font-medium">Contato</th>
              <th className="p-4 font-medium">Unidade</th>
              <th className="p-4 font-medium">Perfil</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-light">
            {carregando ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral">
                  Carregando dados...
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              usuarios.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-neutral-light/20 transition-colors"
                >
                  <td className="p-4 font-medium text-neutral-dark">
                    {user.nome}
                  </td>
                  <td className="p-4 text-neutral">{user.email}</td>
                  <td className="p-4 text-neutral">{user.unidade || "-"}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.perfil === "SINDICO"
                          ? "bg-primary/10 text-primary"
                          : user.perfil === "PORTEIRO"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-neutral-light text-neutral-dark"
                      }`}
                    >
                      {user.perfil}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => deletarUsuario(user.id)}
                      className="text-tertiary hover:text-tertiary/80 font-medium text-sm"
                    >
                      Revogar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neutral-dark">
                Cadastrar Acesso
              </h2>
              <button
                onClick={() => setModalAberto(false)}
                className="text-neutral hover:text-tertiary"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            {erroModal && (
              <div className="bg-tertiary/10 text-tertiary p-3 rounded-lg mb-4 text-sm font-medium">
                {erroModal}
              </div>
            )}

            <form onSubmit={criarUsuario} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg border border-neutral focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg border border-neutral focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1">
                    Perfil
                  </label>
                  <select
                    value={perfil}
                    onChange={(e) => setPerfil(e.target.value)}
                    className="w-full p-3 rounded-lg border border-neutral focus:border-primary focus:outline-none"
                  >
                    <option value="MORADOR">Morador</option>
                    <option value="PORTEIRO">Porteiro</option>
                    <option value="SINDICO">Síndico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1">
                    Apto/Bloco
                  </label>
                  <input
                    type="text"
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    placeholder="Ex: 101-A"
                    className="w-full p-3 rounded-lg border border-neutral focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-1">
                  Senha Inicial
                </label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg border border-neutral focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg mt-4 disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Cadastrar Usuário"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
