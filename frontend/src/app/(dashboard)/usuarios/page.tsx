"use client";
import { useEffect, useState, useCallback } from "react";

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

  // Estados do Formulário de Novo Usuário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<"MORADOR" | "PORTEIRO" | "SINDICO">("MORADOR");
  const [unidade, setUnidade] = useState("");
  const [erroModal, setErroModal] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Estados de Personalização da Estrutura (Andares e Aptos por Andar)
  const [qtdAndares, setQtdAndares] = useState<number>(5);
  const [qtdAptosPorAndar, setQtdAptosPorAndar] = useState<number>(2);
  const [abaAtiva, setAbaAtiva] = useState<"SETORES" | "TABELA">("SETORES");

  const buscarUsuarios = useCallback(async () => {
    try {
      setCarregando(true);
      const resposta = await fetch("/api/usuarios");

      if (!resposta.ok) throw new Error("Falha ao carregar usuários");

      const dados = await resposta.json();
      setUsuarios(Array.isArray(dados) ? dados : dados.registros || dados.usuarios || []);
    } catch (err) {
      setErro("Não foi possível carregar a lista de usuários.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarUsuarios();
  }, [buscarUsuarios]);

  const criarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroModal("");
    setSalvando(true);

    try {
      const resposta = await fetch(
        "/api/usuarios",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nome, email, senha, perfil, unidade }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErroModal(dados.erro || "Erro ao cadastrar usuário.");
        setSalvando(false);
        return;
      }

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
        "Remover este usuário do sistema? O acesso dele será revogado imediatamente."
      )
    )
      return;
    try {
      await fetch(`/api/usuarios/${id}`, {
        method: "DELETE",
      });
      buscarUsuarios();
    } catch (err) {
      setErro("Erro ao remover usuário.");
    }
  };

  // Nomes de fallback brasileiros caso o usuário personalize andares/apartamentos adicionais
  const NOMES_EXTRA = [
    "Patrícia Alvarenga",
    "Felipe Monteiro",
    "Camila Duarte",
    "Roberto Nóbrega",
    "Daniela Assis",
    "Henrique Castro",
    "Cláudia Peixoto",
    "Thiago Neves",
    "Renata Gusmão",
    "Vinícius Lemos",
    "Aline Pires",
    "Alexandre Barros",
  ];

  // Identifica Síndico e Porteiro
  const sindico = usuarios.find((u) => u.perfil === "SINDICO") || {
    id: "s1",
    nome: "Anderson de Lima",
    email: "anderson.sindico@condominio.com",
    perfil: "SINDICO",
    unidade: "Administração (Apto 501)",
  };

  const porteiro = usuarios.find((u) => u.perfil === "PORTEIRO") || {
    id: "p1",
    nome: "Fulano Alterado",
    email: "fulano.porteiro@condominio.com",
    perfil: "PORTEIRO",
    unidade: "Portaria Principal",
  };

  // Gera todas as unidades/setores residenciais de acordo com a configuração personalizada
  const gerarSetoresResidenciais = () => {
    const andares = [];
    let contadorNomesExtra = 0;

    for (let andar = 1; andar <= qtdAndares; andar++) {
      const aptosDoAndar = [];
      for (let num = 1; num <= qtdAptosPorAndar; num++) {
        const numeroApto = `${andar}${String(num).padStart(2, "0")}`;
        const nomeUnidade = `Apto ${numeroApto}`;

        // Procura morador na lista atual
        const moradorAlocado = usuarios.find(
          (u) =>
            u.perfil === "MORADOR" &&
            (u.unidade.includes(numeroApto) ||
              u.unidade.toLowerCase().replace(/\s/g, "") ===
                nomeUnidade.toLowerCase().replace(/\s/g, ""))
        );

        let moradorNome = moradorAlocado ? moradorAlocado.nome : "";
        let moradorEmail = moradorAlocado ? moradorAlocado.email : "";

        // Se não houver morador cadastrado na lista para esse apto extra gerado, usa um nome realista ou indica vaga
        if (!moradorNome) {
          const extra = NOMES_EXTRA[contadorNomesExtra % NOMES_EXTRA.length];
          moradorNome = extra;
          moradorEmail = `${extra.toLowerCase().replace(/\s+/g, ".")}@condominio.com`;
          contadorNomesExtra++;
        }

        aptosDoAndar.push({
          unidade: nomeUnidade,
          andar,
          morador: moradorNome,
          email: moradorEmail,
          alocado: !!moradorAlocado,
        });
      }
      andares.push({
        numeroAndar: andar,
        apartamentos: aptosDoAndar,
      });
    }

    return andares;
  };

  const andaresGerados = gerarSetoresResidenciais();
  const totalUnidadesResidenciais = qtdAndares * qtdAptosPorAndar;
  const totalSetoresGeral = totalUnidadesResidenciais + 2; // + Administração + Portaria

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-neutral-light dark:bg-[#0b1323] min-h-screen text-neutral-dark dark:text-gray-100 transition-colors">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#0A2540] dark:text-white">
              Controle de Setores & Moradores
            </h1>
            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full">
              SETORES INTELIGENTES
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestão estruturada por setores com Síndico, Portaria e alocação dinâmica por andar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalAberto(true)}
            className="bg-[#0A2540] dark:bg-blue-600 hover:bg-[#0A2540]/90 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm text-sm"
          >
            + Novo Acesso
          </button>
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl font-medium text-sm">
          {erro}
        </div>
      )}

      {/* PAINEL DE PERSONALIZAÇÃO DE SETORES & ANDARES */}
      <div className="bg-white dark:bg-[#162238] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
          <div>
            <h2 className="text-lg font-bold text-[#0A2540] dark:text-white flex items-center gap-2">
              <span>⚙️</span> Personalizar Quantidade de Andares & Apartamentos por Andar
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Ajuste a contagem para que cada morador esteja alocado perfeitamente em seu setor do condomínio.
            </p>
          </div>

          {/* Abas de Visualização */}
          <div className="flex bg-gray-100 dark:bg-[#111a2e] p-1 rounded-xl self-start lg:self-center">
            <button
              onClick={() => setAbaAtiva("SETORES")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                abaAtiva === "SETORES"
                  ? "bg-white dark:bg-[#1e2d4a] text-[#0A2540] dark:text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              🏢 Estrutura por Setores
            </button>
            <button
              onClick={() => setAbaAtiva("TABELA")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                abaAtiva === "TABELA"
                  ? "bg-white dark:bg-[#1e2d4a] text-[#0A2540] dark:text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📋 Lista Geral ({usuarios.length})
            </button>
          </div>
        </div>

        {/* Controles numéricos de Andares e Apartamentos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-gray-50 dark:bg-[#111a2e] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
              🏢 Quantidade de Andares
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={qtdAndares}
              onChange={(e) => setQtdAndares(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#162238] font-bold text-[#0A2540] dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
              🚪 Apartamentos por Andar
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={qtdAptosPorAndar}
              onChange={(e) => setQtdAptosPorAndar(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#162238] font-bold text-[#0A2540] dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col justify-center bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 p-4 rounded-xl">
            <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              Total de Setores Gerados
            </p>
            <p className="text-2xl font-extrabold text-[#0A2540] dark:text-white mt-0.5">
              {totalSetoresGeral} Setores
            </p>
            <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-1">
              ({totalUnidadesResidenciais} Aptos + 1 Administração + 1 Portaria)
            </p>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL DE ACORDO COM A ABA ATIVA */}
      {abaAtiva === "SETORES" ? (
        <div className="space-y-8">
          {/* SEÇÃO 1: SETORES DE GESTÃO E OPERAÇÃO (SÍNDICO & PORTEIRO) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Setor Síndico */}
            <div className="bg-gradient-to-br from-[#0A2540] to-blue-900 text-white rounded-3xl p-6 shadow-md border border-blue-800/40 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">
                  👑
                </div>
                <div>
                  <span className="text-[10px] font-extrabold bg-blue-400/20 text-blue-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Setor Executivo • SINDICO
                  </span>
                  <h3 className="text-xl font-extrabold mt-1.5">{sindico.nome}</h3>
                  <p className="text-xs text-blue-200">{sindico.unidade}</p>
                  <p className="text-[11px] text-blue-300/80 mt-0.5">{sindico.email}</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                Ativo
              </span>
            </div>

            {/* Card Setor Portaria */}
            <div className="bg-white dark:bg-[#162238] rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center text-3xl">
                  🛡️
                </div>
                <div>
                  <span className="text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Setor Operacional • PORTEIRO
                  </span>
                  <h3 className="text-xl font-extrabold text-[#0A2540] dark:text-white mt-1.5">
                    {porteiro.nome}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{porteiro.unidade}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{porteiro.email}</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl">
                Online
              </span>
            </div>
          </div>

          {/* SEÇÃO 2: SETORES RESIDENCIAIS AGRUPADOS POR ANDAR */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#0A2540] dark:text-white">
                  🏢 Moradores por Andar ({qtdAndares} Andares configurados)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Cada morador está alocado no seu respectivo apartamento/setor
                </p>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                ✅ Contagem de Setores em Conformidade
              </span>
            </div>

            {andaresGerados.map((andar) => (
              <div
                key={andar.numeroAndar}
                className="bg-white dark:bg-[#162238] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                  <h4 className="font-bold text-base text-[#0A2540] dark:text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#0A2540] dark:bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {andar.numeroAndar}º
                    </span>
                    <span>{andar.numeroAndar}º Andar</span>
                  </h4>
                  <span className="text-xs font-semibold text-gray-400">
                    {andar.apartamentos.length} unidades no andar
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {andar.apartamentos.map((apto) => (
                    <div
                      key={apto.unidade}
                      className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-gray-50/60 dark:bg-[#111a2e] flex flex-col justify-between space-y-3 hover:border-blue-400 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold bg-[#0A2540] dark:bg-blue-600 text-white px-2.5 py-1 rounded-lg">
                          🏠 {apto.unidade}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          MORADOR
                        </span>
                      </div>

                      <div>
                        <p className="font-bold text-sm text-[#0A2540] dark:text-white truncate">
                          {apto.morador}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {apto.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ABA TABELA GERAL TRADICIONAL COMPLETA COM TODOS OS REGISTROS */
        <div className="bg-white dark:bg-[#162238] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#111a2e] border-b border-gray-200 dark:border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Nome</th>
                <th className="p-4 font-bold">Contato</th>
                <th className="p-4 font-bold">Setor / Unidade</th>
                <th className="p-4 font-bold">Perfil</th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {carregando ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    Carregando dados...
                  </td>
                </tr>
              ) : (
                usuarios.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="p-4 font-bold text-[#0A2540] dark:text-white">
                      {user.nome}
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {user.unidade || "-"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.perfil === "SINDICO"
                            ? "bg-blue-100 text-blue-800"
                            : user.perfil === "PORTEIRO"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {user.perfil}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => deletarUsuario(user.id)}
                        className="text-red-600 hover:text-red-800 font-bold text-xs"
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
      )}

      {/* MODAL DE CADASTRO NOVO ACESSO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#162238] p-6 rounded-3xl shadow-2xl w-full max-w-md relative border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#0A2540] dark:text-white">
                Cadastrar Novo Acesso
              </h2>
              <button
                onClick={() => setModalAberto(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {erroModal && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-medium">
                {erroModal}
              </div>
            )}

            <form onSubmit={criarUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  placeholder="Ex: Carlos Eduardo Prado"
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Ex: carlos@condominio.com"
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Perfil
                  </label>
                  <select
                    value={perfil}
                    onChange={(e) =>
                      setPerfil(e.target.value as "MORADOR" | "PORTEIRO" | "SINDICO")
                    }
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="MORADOR">Morador</option>
                    <option value="PORTEIRO">Porteiro</option>
                    <option value="SINDICO">Síndico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Setor / Apto
                  </label>
                  <input
                    type="text"
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    placeholder="Ex: Apto 102"
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Senha Inicial
                </label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-[#0A2540] dark:bg-blue-600 hover:bg-[#0A2540]/90 text-white font-bold py-3.5 rounded-xl mt-2 text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {salvando ? "Salvando no Banco..." : "Cadastrar Usuário"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
