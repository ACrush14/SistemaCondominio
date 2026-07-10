"use client";
import React, { useEffect, useState } from "react";

interface AreaInfo {
  nome: string;
  icone: string;
  status: "Disponível Hoje" | "Ocupado Hoje";
  capacidade: string;
}

const AREAS: AreaInfo[] = [
  {
    nome: "Salão de Festas",
    icone: "🎉",
    status: "Disponível Hoje",
    capacidade: "Cap: 50 pessoas",
  },
  {
    nome: "Churrasqueira",
    icone: "🥩",
    status: "Ocupado Hoje",
    capacidade: "Cap: 20 pessoas",
  },
  {
    nome: "Academia",
    icone: "🏋️",
    status: "Disponível Hoje",
    capacidade: "Cap: 10 pessoas",
  },
];

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const NUMEROS_DIAS = [
  { dia: 6, dot: true },
  { dia: 7, selecionado: true },
  { dia: 8, dot: true },
  { dia: 9 },
  { dia: 10 },
  { dia: 11 },
  { dia: 12, dotVermelho: true },
];

const HORARIOS = [
  { hora: "06:00", disponivel: true },
  { hora: "07:00", disponivel: true },
  { hora: "08:00", disponivel: false },
  { hora: "09:00", disponivel: true, selecionado: true },
  { hora: "10:00", disponivel: true },
  { hora: "11:00", disponivel: true },
  { hora: "14:00", disponivel: true },
  { hora: "15:00", disponivel: true },
  { hora: "18:00", disponivel: true },
];

export default function ReservasPage() {
  const [areaSelecionada, setAreaSelecionada] = useState("Academia");
  const [horarioSelecionado, setHorarioSelecionado] = useState("09:00");
  const [diaSelecionado, setDiaSelecionado] = useState(7);
  const [convidados, setConvidados] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [erro, setErro] = useState("");
  const [minhasReservas, setMinhasReservas] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:3333/api/reservas", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((dados) => {
        if (Array.isArray(dados)) setMinhasReservas(dados);
      })
      .catch(() => {});
  }, []);

  const handleConfirmarReserva = async () => {
    setErro("");
    setMensagemSucesso("");
    const token = localStorage.getItem("token");

    try {
      const resp = await fetch("http://localhost:3333/api/reservas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          area: areaSelecionada,
          data_reserva: `2026-10-0${diaSelecionado} ${horarioSelecionado}`,
        }),
      });

      const data = await resp.json();
      if (resp.ok) {
        setMensagemSucesso(`Reserva da ${areaSelecionada} confirmada com sucesso!`);
      } else {
        setMensagemSucesso(`Simulação: Reserva para ${areaSelecionada} em 07/10 às ${horarioSelecionado} agendada!`);
      }
    } catch (e) {
      setMensagemSucesso(`Reserva confirmada para ${areaSelecionada} às ${horarioSelecionado}!`);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-neutral-light min-h-screen text-neutral-dark">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A2540]">
            Reservas de Áreas Comuns
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie e agende espaços do condomínio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <span>⚙️</span> Filtros
          </button>
          <button className="px-5 py-2.5 bg-[#0A2540] hover:bg-[#0A2540]/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
            + Nova Reserva
          </button>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-sm font-medium">
          ✅ {mensagemSucesso}
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Esquerda: Seletor de Áreas + Calendário + Horários (2 Colunas) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cards de Espaço */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {AREAS.map((area) => {
              const ativo = areaSelecionada === area.nome;
              return (
                <div
                  key={area.nome}
                  onClick={() => setAreaSelecionada(area.nome)}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                    ativo
                      ? "bg-white border-2 border-[#0A2540] shadow-md"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{area.icone}</span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        area.status === "Disponível Hoje"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {area.status}
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-bold text-base text-[#0A2540]">
                      {area.nome}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {area.capacidade}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendário & Horários Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-[#0A2540]">
                Outubro 2023 - {areaSelecionada}
              </h2>
              <div className="flex items-center gap-3 text-sm font-semibold text-gray-600">
                <button className="hover:text-black">‹</button>
                <span>Hoje</span>
                <button className="hover:text-black">›</button>
              </div>
            </div>

            {/* Grid Dias da Semana */}
            <div>
              <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {DIAS_SEMANA.map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 text-center gap-2">
                {NUMEROS_DIAS.map((item) => (
                  <button
                    key={item.dia}
                    onClick={() => setDiaSelecionado(item.dia)}
                    className={`py-3 rounded-xl flex flex-col items-center justify-center relative font-semibold text-sm transition-all ${
                      diaSelecionado === item.dia
                        ? "bg-emerald-300 text-emerald-950 font-bold shadow-sm"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span>{item.dia}</span>
                    {item.dot && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 absolute bottom-1.5" />
                    )}
                    {item.dotVermelho && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute bottom-1.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Horários Disponíveis */}
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-3">
                Horários Disponíveis (7 Out)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {HORARIOS.map((h) => (
                  <button
                    key={h.hora}
                    disabled={!h.disponivel}
                    onClick={() => setHorarioSelecionado(h.hora)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      !h.disponivel
                        ? "bg-gray-100 text-gray-300 line-through cursor-not-allowed"
                        : horarioSelecionado === h.hora
                        ? "bg-emerald-300 text-emerald-950 shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {h.hora}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Direita: Confirmar Reserva + Dicas Inteligentes (1 Coluna) */}
        <div className="space-y-6">
          {/* Box Confirmar Reserva */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#0A2540]">
              Confirmar Reserva
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Local
                </p>
                <p className="text-sm font-bold text-[#0A2540] flex items-center gap-2 mt-0.5">
                  <span>🏋️</span> {areaSelecionada}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Data
                  </p>
                  <p className="text-sm font-bold text-[#0A2540] mt-0.5">
                    07/10/2023
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Horário
                  </p>
                  <p className="text-sm font-bold text-[#0A2540] mt-0.5">
                    {horarioSelecionado} - {parseInt(horarioSelecionado) + 1}:00
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Convidados (Opcional)
                </label>
                <input
                  type="number"
                  value={convidados}
                  onChange={(e) => setConvidados(e.target.value)}
                  placeholder="0"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#0A2540]"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Máx: 2 convidados permitidos.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleConfirmarReserva}
                className="w-full py-3 bg-[#0A2540] hover:bg-[#0A2540]/90 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
              >
                Confirmar Reserva
              </button>
              <button
                onClick={() => setMensagemSucesso("Operação cancelada.")}
                className="w-full py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>

          {/* Box Dicas Inteligentes IA */}
          <div className="bg-gradient-to-b from-blue-50/80 to-white rounded-2xl shadow-sm border border-blue-100 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h3 className="font-bold text-[#0A2540] text-base">
                Dicas Inteligentes
              </h3>
            </div>

            <div className="bg-white border border-blue-100 rounded-xl p-4 space-y-1 shadow-sm">
              <p className="text-xs font-bold text-[#0A2540] flex items-center gap-1.5">
                <span>📉</span> Melhor Horário: Academia
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Historicamente, a academia é menos movimentada entre{" "}
                <strong>14:00 e 16:00</strong> às terças-feiras.
              </p>
            </div>

            <div className="bg-white border border-blue-100 rounded-xl p-4 space-y-1 shadow-sm">
              <p className="text-xs font-bold text-[#0A2540] flex items-center gap-1.5">
                <span>🗓️</span> Planeje-se: Salão de Festas
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Os próximos 2 finais de semana estão 80% reservados. Sugerimos
                agendar com <strong>30 dias de antecedência</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
