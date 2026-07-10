"use client";
import React, { useState, useEffect } from "react";

interface Ocorrencia {
  id: string;
  titulo: string;
  local: string;
  unidade: string;
  morador: string;
  status: string;
  categoria: string;
  data: string;
  resumo_ia: string;
}

export default function OcorrenciasPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([
    {
      id: "1",
      titulo: "Vazamento na Garagem Subsolo 2",
      local: "Garagem Subsolo 2",
      unidade: "Apt 302",
      morador: "Carlos M.",
      status: "MANUTENÇÃO",
      categoria: "MANUTENÇÃO",
      data: "Hoje, 14:30",
      resumo_ia:
        "Morador relatou poça d'água próximo à vaga 42. Provável origem: tubulação do teto. Requer inspeção do zelador.",
    },
  ]);

  const [abaAtiva, setAbaAtiva] = useState("Todas");
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [modalNova, setModalNova] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");

  useEffect(() => {
    fetch("/api/condominio/ocorrencias")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setOcorrencias(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleCriarOcorrencia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(
        "http://localhost:3333/api/condominio/ocorrencias",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: novoTitulo,
            descricao: novaDescricao,
            categoria: "MANUTENÇÃO",
          }),
        },
      );
      const nova = await res.json();
      setOcorrencias([nova, ...ocorrencias]);
      setModalNova(false);
      setNovoTitulo("");
      setNovaDescricao("");
    } catch (err) {
      setModalNova(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-neutral-light min-h-screen text-neutral-dark flex justify-center">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏢</span>
            <h1 className="text-lg font-bold text-[#0A2540]">CondoManage</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center">
              🔔
            </button>
            <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center">
              👤
            </button>
          </div>
        </div>

        {/* Título & Botão Nova Ocorrência */}
        <div className="space-y-3">
          <div>
            <h2 className="text-2xl font-bold text-[#0A2540]">
              Livro de Ocorrências
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Acompanhe relatos e comunicados do condomínio.
            </p>
          </div>
          <button
            onClick={() => setModalNova(true)}
            className="w-full py-3 bg-[#0A2540] hover:bg-[#0A2540]/90 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span>+</span> Nova Ocorrência
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["Todas", "Comunicados", "Barulho", "Manutenção"].map((aba) => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                abaAtiva === aba
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {aba}
            </button>
          ))}
        </div>

        {/* Ocorrência Exemplo com Resumo IA */}
        {ocorrencias.map((o) => (
          <div
            key={o.id}
            className="border border-gray-200 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                {o.categoria || o.status}
              </span>
              <span className="text-xs text-gray-400">🕒 {o.data}</span>
            </div>

            <h3 className="font-bold text-base text-[#0A2540]">{o.titulo}</h3>

            {/* Box Resumo Inteligente IA */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-xl p-4 space-y-1.5">
              <p className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5 uppercase tracking-wider">
                <span>✨</span> RESUMO INTELIGENTE
              </p>
              <p className="text-xs text-gray-700 leading-relaxed">
                {o.resumo_ia}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-3 py-1 rounded-full">
                {o.unidade} - {o.morador}
              </span>
              <button className="text-xs font-bold text-blue-600 hover:underline">
                Ver detalhes
              </button>
            </div>
          </div>
        ))}

        {/* Comunicado da Administração */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
            <span>📢</span>
            <span>Comunicado da Administração</span>
          </div>
          <p className="text-xs text-gray-400">📅 Ontem, 09:00</p>
          <h3 className="font-bold text-base text-[#0A2540]">
            Limpeza da Caixa D&apos;água
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Informamos que na próxima terça-feira (15/10), haverá interrupção no
            fornecimento de água das 08h às 12h para limpeza semestral das
            caixas d&apos;água.
          </p>
          <p className="text-xs text-gray-400">👁️ 45 visualizações</p>
        </div>

        {/* Notificações (WhatsApp, E-mail, Push) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <h3 className="font-bold text-base text-[#0A2540]">Notificações</h3>
          </div>
          <p className="text-xs text-gray-500">
            Escolha como deseja receber alertas urgentes.
          </p>

          <div className="space-y-2.5">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>💬</span> WhatsApp
              </span>
              <input
                type="checkbox"
                checked={notifWhatsapp}
                onChange={(e) => setNotifWhatsapp(e.target.checked)}
                className="w-5 h-5 rounded text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>✉️</span> E-mail
              </span>
              <input
                type="checkbox"
                checked={notifEmail}
                onChange={(e) => setNotifEmail(e.target.checked)}
                className="w-5 h-5 rounded text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>📱</span> Push (App)
              </span>
              <input
                type="checkbox"
                checked={notifPush}
                onChange={(e) => setNotifPush(e.target.checked)}
                className="w-5 h-5 rounded text-blue-600"
              />
            </label>
          </div>
        </div>

        {/* Status Rápido */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-base text-[#0A2540]">Status Rápido</h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-600">Abertas (Hoje)</span>
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">
                2
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="w-1/4 h-full bg-red-500 rounded-full" />
            </div>

            <div className="flex items-center justify-between text-xs font-semibold pt-2">
              <span className="text-gray-600">Resolvidas (Semana)</span>
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                12
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="w-5/6 h-full bg-emerald-500 rounded-full" />
            </div>
          </div>
        </div>

        {/* Modal Nova Ocorrência */}
        {modalNova && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <form
              onSubmit={handleCriarOcorrencia}
              className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl"
            >
              <h3 className="font-bold text-lg text-[#0A2540]">
                Nova Ocorrência
              </h3>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Ex: Vazamento no corredor"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Descrição / Relato
                </label>
                <textarea
                  required
                  rows={3}
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  placeholder="Descreva o ocorrido em detalhes para a IA resumir..."
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#0A2540] text-white rounded-xl font-semibold text-sm"
                >
                  Registrar
                </button>
                <button
                  type="button"
                  onClick={() => setModalNova(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
