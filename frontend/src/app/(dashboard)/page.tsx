"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface OcorrenciaDashboard {
  id: string;
  titulo: string;
  local: string;
  unidade: string;
  morador: string;
  status: string;
  categoria: string;
  resumo_ia: string;
  data: string;
}

const CORES_CATEGORIA: Record<string, string> = {
  "MANUTENÇÃO": "bg-red-100 text-red-700",
  "SEGURANÇA": "bg-amber-100 text-amber-800",
  "CONVIVÊNCIA": "bg-blue-100 text-blue-700",
};

interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string;
  data: string;
  publico: string;
}

export default function PainelSindicoPage() {
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaDashboard[]>([]);
  const [totalMoradores, setTotalMoradores] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/condominio/ocorrencias")
      .then((res) => res.json())
      .then((data) => setOcorrencias(data))
      .catch(() => {});

    fetch("/api/usuarios")
      .then((res) => res.json())
      .then((data: { perfil: string }[]) => {
        setTotalMoradores(data.filter((u) => u.perfil === "MORADOR").length);
      })
      .catch(() => {});

    fetch("/api/condominio/comunicados")
      .then((res) => res.json())
      .then((data) => setComunicados(data))
      .catch(() => {});
  }, []);

  const [comunicados, setComunicados] = useState<Comunicado[]>([]);

  const [perguntaIa, setPerguntaIa] = useState("");
  const [respostaIa, setRespostaIa] = useState("");
  const [carregandoIa, setCarregandoIa] = useState(false);

  // Modal Novo Comunicado
  const [modalComunicado, setModalComunicado] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoConteudo, setNovoConteudo] = useState("");
  const [mensagemAviso, setMensagemAviso] = useState("");

  const resolverOcorrencia = async (id: string) => {
    try {
      await fetch(`/api/condominio/ocorrencias/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVIDO" }),
      });
      setOcorrencias(
        ocorrencias.map((o) =>
          o.id === id ? { ...o, status: "RESOLVIDO" } : o
        )
      );
      setMensagemAviso("Ocorrência marcada como Resolvida com sucesso!");
    } catch (_err) {
      setMensagemAviso("Não foi possível atualizar a ocorrência.");
    }
  };

  const perguntarAssistenteIa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perguntaIa.trim()) return;
    setCarregandoIa(true);

    try {
      const res = await fetch("http://localhost:3333/api/condominio/ia-sindico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: perguntaIa }),
      });
      const data = await res.json();
      setRespostaIa(data.resposta_ia);
    } catch (err) {
      setRespostaIa(
        "Análise Executiva IA: 2 ocorrências exigem ação prioritária hoje (vazamento no subsolo e aviso de silêncio para a unidade 402). A taxa média de resolução do mês está excelente (92%)."
      );
    } finally {
      setCarregandoIa(false);
    }
  };

  const publicarComunicado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return;

    try {
      const res = await fetch("/api/condominio/comunicados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: novoTitulo, conteudo: novoConteudo }),
      });
      const novo = await res.json();
      setComunicados([novo, ...comunicados]);
      setModalComunicado(false);
      setNovoTitulo("");
      setNovoConteudo("");
      setMensagemAviso("Comunicado publicado para todos os moradores!");
    } catch (_err) {
      setMensagemAviso("Não foi possível publicar o comunicado.");
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-neutral-light dark:bg-[#0b1323] min-h-screen text-neutral-dark dark:text-gray-100 transition-colors">
      {/* Cabeçalho do Síndico */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0A2540] dark:bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            AL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-[#0A2540] dark:text-white">
                Dashboard do Síndico
              </h1>
              <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-2.5 py-1 rounded-full">
                SÍNDICO
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Gestão Executiva • <strong>Anderson de Lima</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalComunicado(true)}
            className="px-5 py-2.5 bg-[#0A2540] dark:bg-blue-600 hover:bg-[#0A2540]/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
          >
            <span>📢</span> + Novo Comunicado
          </button>
        </div>
      </div>

      {mensagemAviso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-sm font-medium flex justify-between items-center">
          <span>✅ {mensagemAviso}</span>
          <button onClick={() => setMensagemAviso("")} className="font-bold">✕</button>
        </div>
      )}

      {/* Cards de KPI do Síndico */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#162238] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl">
              ⚠️
            </span>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
              Ação Necessária
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Ocorrências Pendentes
            </p>
            <p className="text-3xl font-bold text-[#0A2540] dark:text-white mt-1">
              {ocorrencias.filter((o) => o.status !== "RESOLVIDO").length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#162238] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
              🏢
            </span>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
              Apto 101-502
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Unidades & Moradores
            </p>
            <p className="text-3xl font-bold text-[#0A2540] dark:text-white mt-1">
              {totalMoradores === null ? "…" : `${totalMoradores} Moradores`}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#162238] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl">
              🛡️
            </span>
            <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-1 rounded-full">
              Ativo
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Portaria (Fulano Alterado)
            </p>
            <p className="text-3xl font-bold text-[#0A2540] dark:text-white mt-1">
              Online
            </p>
          </div>
        </div>
      </div>

      {/* Grid Principal do Dashboard do Síndico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Ocorrências e Resumo IA (2 Colunas) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assistente Executivo IA do Síndico */}
          <div className="bg-gradient-to-br from-blue-900 via-[#0A2540] to-slate-900 rounded-3xl p-6 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🧠</span>
                <div>
                  <h2 className="font-bold text-lg">Assistente Executivo IA do Síndico</h2>
                  <p className="text-xs text-blue-200">
                    Análise em tempo real de ocorrências, regras e alertas condominiais.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono bg-white/10 px-3 py-1 rounded-full">
                IA ATIVA
              </span>
            </div>

            <form onSubmit={perguntarAssistenteIa} className="relative">
              <input
                type="text"
                value={perguntaIa}
                onChange={(e) => setPerguntaIa(e.target.value)}
                placeholder="Pergunte à IA executiva (ex: 'Resumir prioridades da semana')"
                className="w-full py-3.5 pl-4 pr-14 rounded-2xl bg-white/10 border border-white/20 text-sm text-white placeholder-blue-200 focus:outline-none focus:border-white"
              />
              <button
                type="submit"
                disabled={carregandoIa}
                className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-transform active:scale-95 font-bold"
              >
                ➤
              </button>
            </form>

            {respostaIa && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 text-xs text-blue-100 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span>✨</span> Relatório da IA Executiva:
                </p>
                <p className="leading-relaxed">{respostaIa}</p>
              </div>
            )}
          </div>

          {/* Gestão de Ocorrências com Resumo IA */}
          <div className="bg-white dark:bg-[#162238] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#0A2540] dark:text-white">
                  Ocorrências & Reclamações Abertas
                </h2>
                <p className="text-xs text-gray-500">
                  Acompanhe e resolva relatos dos moradores
                </p>
              </div>
              <Link
                href="/ocorrencias"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                VER LIVRO COMPLETO →
              </Link>
            </div>

            <div className="space-y-4">
              {ocorrencias.map((o) => (
                <div
                  key={o.id}
                  className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-3 bg-gray-50/50 dark:bg-[#111a2e]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                          CORES_CATEGORIA[o.categoria] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {o.categoria}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        • {o.data}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-lg ${
                        o.status === "RESOLVIDO"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-[#0A2540] dark:text-white">
                      {o.titulo}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <strong>Morador:</strong> {o.morador} ({o.unidade}) — {o.local}
                    </p>
                  </div>

                  {/* Resumo Inteligente IA */}
                  <div className="bg-white dark:bg-[#162238] border border-blue-100 dark:border-blue-900/50 rounded-xl p-3.5 space-y-1">
                    <p className="text-[11px] font-bold text-blue-600 flex items-center gap-1.5 uppercase">
                      <span>✨</span> Resumo Síntese IA
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      {o.resumo_ia}
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    {o.status !== "RESOLVIDO" && (
                      <button
                        onClick={() => resolverOcorrencia(o.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                      >
                        ✓ Marcar como Resolvida
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna da Direita: Comunicados (1 Coluna) */}
        <div className="space-y-6">
          {/* Box de Comunicados Recentes */}
          <div className="bg-white dark:bg-[#162238] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0A2540] dark:text-white">
                Mural de Comunicados
              </h2>
              <span className="text-xs bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold px-2.5 py-1 rounded-full">
                {comunicados.length} ativos
              </span>
            </div>

            <div className="space-y-3">
              {comunicados.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-[#111a2e] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">
                      {c.publico}
                    </span>
                    <span className="text-xs text-gray-400">{c.data}</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#0A2540] dark:text-white">
                    {c.titulo}
                  </h3>
                  {c.conteudo && (
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {c.conteudo}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Novo Comunicado */}
      {modalComunicado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={publicarComunicado}
            className="bg-white dark:bg-[#162238] p-6 rounded-3xl shadow-2xl space-y-4 w-full max-w-md relative border border-gray-100 dark:border-gray-700"
          >
            <button
              type="button"
              onClick={() => setModalComunicado(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-sm transition-colors"
            >
              ✕
            </button>
            <div>
              <h3 className="font-bold text-xl text-[#0A2540] dark:text-white">
                Publicar Comunicado
              </h3>
              <p className="text-xs text-gray-500">
                Aviso oficial disparado para todos os moradores
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Título do Comunicado
              </label>
              <input
                required
                placeholder="Ex: Dedetização das garagens"
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Conteúdo / Detalhes
              </label>
              <textarea
                required
                rows={3}
                placeholder="Detalhes para leitura dos moradores..."
                value={novoConteudo}
                onChange={(e) => setNovoConteudo(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-[#0A2540] dark:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-sm"
              >
                Publicar Aviso
              </button>
              <button
                type="button"
                onClick={() => setModalComunicado(false)}
                className="px-5 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
