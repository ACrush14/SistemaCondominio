"use client";
import React, { useEffect, useState, useCallback } from "react";

interface Reserva {
  id: string;
  area: string;
  data_reserva: string;
  horario: string;
  horario_inicio?: string;
  horario_fim?: string;
  dia_inteiro?: boolean;
  convidados: number;
  observacao?: string;
  morador: string;
  status: string;
}

const AREAS = [
  {
    nome: "Salão de Festas",
    icone: "🎉",
    capacidade: "Cap: 50 pessoas",
  },
  {
    nome: "Churrasqueira",
    icone: "🥩",
    capacidade: "Cap: 25 pessoas",
  },
  {
    nome: "Piscina",
    icone: "🏊",
    capacidade: "Cap: 20 pessoas",
  },
];

const LISTA_HORARIOS_INICIO = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

const LISTA_HORARIOS_FIM = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

export default function ReservasPage() {
  const [areaSelecionada, setAreaSelecionada] = useState("Salão de Festas");

  // Controle de datas e janela de 30 dias
  const hoje = new Date();
  const formataDataISO = (d: Date) => d.toISOString().split("T")[0];

  const dataHojeISO = formataDataISO(hoje);
  const dataMax30Date = new Date(hoje);
  dataMax30Date.setDate(hoje.getDate() + 30);
  const dataMax30ISO = formataDataISO(dataMax30Date);

  const [dataSelecionadaISO, setDataSelecionadaISO] = useState(dataHojeISO);
  const [inicioSemanaOffset, setInicioSemanaOffset] = useState(0); // 0 = semana atual, 7 = próxima semana...

  // Campos do Painel Lateral
  const [horarioInicioRapido, setHorarioInicioRapido] = useState("14:00");
  const [horarioFimRapido, setHorarioFimRapido] = useState("18:00");
  const [diaInteiroRapido, setDiaInteiroRapido] = useState(false);
  const [convidadosRapido, setConvidadosRapido] = useState("");
  const [observacaoRapida, setObservacaoRapida] = useState("");

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [erro, setErro] = useState("");

  // Modal "+ Nova Reserva"
  const [modalAberto, setModalAberto] = useState(false);
  const [novaArea, setNovaArea] = useState("Salão de Festas");
  const [novaData, setNovaData] = useState(dataHojeISO);
  const [novoHorarioInicio, setNovoHorarioInicio] = useState("19:00");
  const [novoHorarioFim, setNovoHorarioFim] = useState("23:00");
  const [novoDiaInteiro, setNovoDiaInteiro] = useState(false);
  const [novosConvidados, setNovosConvidados] = useState("");
  const [novaObservacao, setNovaObservacao] = useState("");

  const buscarReservas = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch("/api/reservas");
      if (res.ok) {
        const dados = await res.json();
        setReservas(Array.isArray(dados) ? dados : dados.registros || dados.reservas || []);
      }
    } catch (err) {
      console.error("Erro ao buscar reservas:", err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarReservas();
  }, [buscarReservas]);

  // Função de criação de reserva validando 30 dias
  const handleCriarReserva = async (
    area: string,
    data: string,
    inicio: string,
    fim: string,
    diaInteiro: boolean,
    qtdConvidados: string,
    observacao: string
  ) => {
    setErro("");
    setMensagemSucesso("");

    // Verifica localmente os 30 dias
    const diffDias = Math.ceil(
      (new Date(data + "T00:00:00").getTime() - new Date(dataHojeISO + "T00:00:00").getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (diffDias > 30) {
      setErro(
        "Reservas no app são permitidas apenas para até 30 dias de antecedência. Para datas além de 30 dias, solicite ao Síndico."
      );
      return;
    }

    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area,
          data_reserva: data,
          horario_inicio: inicio,
          horario_fim: fim,
          dia_inteiro: diaInteiro,
          convidados: Number(qtdConvidados) || 0,
          observacao: observacao || "",
        }),
      });

      const dataJson = await res.json();

      if (!res.ok) {
        setErro(dataJson.erro || "Não foi possível realizar a reserva.");
        return;
      }

      setMensagemSucesso(
        `Reserva gravada no banco para ${area} em ${data} (${
          diaInteiro ? `${inicio} - Dia Inteiro` : `${inicio} às ${fim}`
        })!`
      );
      setModalAberto(false);
      setObservacaoRapida("");
      setNovaObservacao("");
      setNovoDiaInteiro(false);
      buscarReservas();
    } catch (err) {
      setErro("Falha ao salvar no banco de dados.");
    }
  };

  const handleCancelarReserva = async (id: string) => {
    if (!confirm("Deseja realmente cancelar esta reserva da base de dados?")) return;
    try {
      await fetch(`/api/reservas/${id}`, {
        method: "DELETE",
      });
      setMensagemSucesso("Reserva cancelada com sucesso!");
      buscarReservas();
    } catch (err) {
      setErro("Erro ao apagar reserva.");
    }
  };

  // Gera os 7 dias da semana atual visual
  const diasDaSemana = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + inicioSemanaOffset + idx);
    const iso = formataDataISO(d);
    const nomeDia = d.toLocaleDateString("pt-BR", { weekday: "short" });
    const diaNum = d.getDate();
    const mesShort = d.toLocaleDateString("pt-BR", { month: "short" });
    return { iso, nomeDia, diaNum, mesShort };
  });

  const reservasDaAreaEDia = reservas.filter(
    (r) => r.area === areaSelecionada && r.data_reserva === dataSelecionadaISO
  );

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-neutral-light dark:bg-[#0b1323] min-h-screen text-neutral-dark dark:text-gray-100 transition-colors">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#0A2540] dark:text-white">
              Reservas de Áreas Comuns
            </h1>
            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full">
              JANELA 30 DIAS
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Agenda Semanal para <strong>Salão de Festas</strong>, <strong>Churrasqueira</strong> e <strong>Piscina</strong> gravada no banco.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setNovaArea(areaSelecionada);
              setNovaData(dataSelecionadaISO);
              setModalAberto(true);
            }}
            className="px-5 py-2.5 bg-[#0A2540] dark:bg-blue-600 hover:bg-[#0A2540]/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
          >
            <span>+</span> Nova Reserva
          </button>
        </div>
      </div>

      {/* Box de Regra dos Próximos 30 Dias */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="font-bold">
              Regra do Condomínio: Agendamento permitido para os próximos 30 dias (até {dataMax30ISO})
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              Qualquer reserva para além de 30 dias deve ser solicitada com antecedência diretamente ao Síndico (Anderson de Lima).
            </p>
          </div>
        </div>
        <span className="font-mono bg-white dark:bg-[#162238] px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 font-bold self-start sm:self-center">
          Hoje: {dataHojeISO}
        </span>
      </div>

      {/* Alertas */}
      {mensagemSucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-sm font-medium flex justify-between items-center">
          <span>✅ {mensagemSucesso}</span>
          <button onClick={() => setMensagemSucesso("")} aria-label="Fechar alerta de sucesso" className="font-bold">✕</button>
        </div>
      )}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-sm font-medium flex justify-between items-center">
          <span>⚠️ {erro}</span>
          <button onClick={() => setErro("")} aria-label="Fechar alerta de erro" className="font-bold">✕</button>
        </div>
      )}

      {/* Seletor Dinâmico: Salão de Festas, Churrasqueira e Piscina */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {AREAS.map((area) => {
          const ativo = areaSelecionada === area.nome;
          const qtdReservasDia = reservas.filter(
            (r) => r.area === area.nome && r.data_reserva === dataSelecionadaISO
          ).length;

          return (
            <div
              key={area.nome}
              onClick={() => setAreaSelecionada(area.nome)}
              className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                ativo
                  ? "bg-white dark:bg-[#162238] border-2 border-[#0A2540] dark:border-blue-500 shadow-md"
                  : "bg-white dark:bg-[#162238] border-gray-200 dark:border-gray-800 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{area.icone}</span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    qtdReservasDia > 0
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {qtdReservasDia > 0 ? `${qtdReservasDia} evento(s) agendado(s)` : "Livre neste dia"}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-base text-[#0A2540] dark:text-white">
                  {area.nome}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {area.capacidade}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agenda Semanal Interativa para o Item Selecionado */}
      <div className="bg-white dark:bg-[#162238] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#0A2540] dark:text-white">
              Agenda Semanal — {areaSelecionada}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Clique em qualquer dia da semana para ver e agendar no banco de dados
            </p>
          </div>

          {/* Controle de Navegação de Semanas dentro dos 30 dias */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              disabled={inicioSemanaOffset <= 0}
              onClick={() => setInicioSemanaOffset(Math.max(0, inicioSemanaOffset - 7))}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ← Semana Anterior
            </button>
            <button
              disabled={inicioSemanaOffset >= 21}
              onClick={() => setInicioSemanaOffset(Math.min(21, inicioSemanaOffset + 7))}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Próxima Semana →
            </button>
          </div>
        </div>

        {/* Grade de 7 Dias */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {diasDaSemana.map((dia) => {
            const selecionado = dataSelecionadaISO === dia.iso;
            const resNoDia = reservas.filter(
              (r) => r.area === areaSelecionada && r.data_reserva === dia.iso
            );

            return (
              <div
                key={dia.iso}
                onClick={() => setDataSelecionadaISO(dia.iso)}
                className={`cursor-pointer rounded-2xl p-3.5 border text-center transition-all flex flex-col justify-between min-h-[110px] ${
                  selecionado
                    ? "bg-[#0A2540] dark:bg-blue-600 text-white border-[#0A2540] dark:border-blue-500 shadow-md scale-[1.02]"
                    : "bg-gray-50/70 dark:bg-[#111a2e] border-gray-200 dark:border-gray-800 hover:border-gray-300"
                }`}
              >
                <div>
                  <p
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      selecionado ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    {dia.nomeDia}
                  </p>
                  <p className="text-xl font-extrabold mt-1">
                    {dia.diaNum} <span className="text-xs font-normal">{dia.mesShort}</span>
                  </p>
                </div>

                <div className="mt-3">
                  {resNoDia.length > 0 ? (
                    <span
                      className={`block text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                        selecionado
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {resNoDia.length} reserva(s)
                    </span>
                  ) : (
                    <span
                      className={`block text-[11px] font-medium ${
                        selecionado ? "text-blue-100" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      Livre
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Layout Principal de 2 Colunas (Lista do Dia vs Painel de Agendamento) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Esquerda: Eventos Agendados para o Dia Selecionado */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#162238] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#0A2540] dark:text-white">
                  Eventos em {areaSelecionada} — {dataSelecionadaISO}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Registros oficias armazenados na base de dados
                </p>
              </div>
              <span className="text-xs bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold px-3 py-1 rounded-full">
                {reservasDaAreaEDia.length} evento(s) no dia
              </span>
            </div>

            {reservasDaAreaEDia.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm font-semibold text-gray-500">
                  Nenhuma reserva para {areaSelecionada} em {dataSelecionadaISO}.
                </p>
                <p className="text-xs text-gray-400">
                  Você pode agendar no painel ao lado ou clicando em + Nova Reserva.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservasDaAreaEDia.map((r) => (
                  <div
                    key={r.id}
                    className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-gray-50/60 dark:bg-[#111a2e] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-extrabold bg-[#0A2540] dark:bg-blue-600 text-white px-3 py-1.5 rounded-xl">
                          🕒 {r.horario}
                        </span>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                          Data: {r.data_reserva}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCancelarReserva(r.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-800 underline self-start sm:self-center"
                      >
                        Apagar Reserva do Banco
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[#0A2540] dark:text-white">
                        👤 {r.morador}
                      </p>
                      {r.convidados > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          👥 {r.convidados} convidados
                        </span>
                      )}
                    </div>

                    {r.observacao && (
                      <div className="bg-white dark:bg-[#162238] border border-blue-100 dark:border-blue-900/60 rounded-xl p-3.5 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                        <p className="font-bold text-blue-600 dark:text-blue-400 uppercase text-[10px]">
                          💬 Observações / Requisitos Especiais:
                        </p>
                        <p className="italic">&ldquo;{r.observacao}&rdquo;</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Direita: Painel Lateral Rápido */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#162238] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[#0A2540] dark:text-white">
                Agendar em {areaSelecionada}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Dia selecionado: <strong>{dataSelecionadaISO}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                    Início
                  </label>
                  <select
                    value={horarioInicioRapido}
                    onChange={(e) => setHorarioInicioRapido(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm font-medium focus:outline-none focus:border-[#0A2540]"
                  >
                    {LISTA_HORARIOS_INICIO.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                    Fim
                  </label>
                  <select
                    disabled={diaInteiroRapido}
                    value={diaInteiroRapido ? "23:00" : horarioFimRapido}
                    onChange={(e) => setHorarioFimRapido(e.target.value)}
                    className={`w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium focus:outline-none focus:border-[#0A2540] ${
                      diaInteiroRapido
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                        : "bg-white dark:bg-[#111a2e]"
                    }`}
                  >
                    {diaInteiroRapido ? (
                      <option value="23:00">23:00 (Dia Inteiro)</option>
                    ) : (
                      LISTA_HORARIOS_FIM.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={diaInteiroRapido}
                  onChange={(e) => setDiaInteiroRapido(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                  Dia inteiro a partir de {horarioInicioRapido} (até 23:00)
                </span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Convidados Estimados
                </label>
                <input
                  type="number"
                  placeholder="Ex: 20"
                  value={convidadosRapido}
                  onChange={(e) => setConvidadosRapido(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm focus:outline-none focus:border-[#0A2540]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Observações / Requisitos Especiais
                </label>
                <textarea
                  rows={3}
                  value={observacaoRapida}
                  onChange={(e) => setObservacaoRapida(e.target.value)}
                  placeholder="Ex: Música alta, precisa de tal coisa, usar equipamento X..."
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm focus:outline-none focus:border-[#0A2540]"
                />
              </div>
            </div>

            <button
              onClick={() =>
                handleCriarReserva(
                  areaSelecionada,
                  dataSelecionadaISO,
                  horarioInicioRapido,
                  diaInteiroRapido ? "23:00 (Dia Inteiro)" : horarioFimRapido,
                  diaInteiroRapido,
                  convidadosRapido,
                  observacaoRapida
                )
              }
              className="w-full py-3.5 bg-[#0A2540] dark:bg-blue-600 hover:bg-[#0A2540]/90 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              Gravar no Banco de Dados
            </button>
          </div>
        </div>
      </div>

      {/* MODAL "+ NOVA RESERVA" COM LIMITE DE 30 DIAS */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-[#162238] rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 space-y-5 relative my-8">
            <button
              onClick={() => setModalAberto(false)}
              aria-label="Fechar modal de agendamento"
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-sm transition-colors"
            >
              ✕
            </button>

            <div className="pr-8">
              <h3 className="font-bold text-xl text-[#0A2540] dark:text-white">
                Agendar Reserva
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Permitido para datas entre hoje ({dataHojeISO}) e os próximos 30 dias ({dataMax30ISO}).
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCriarReserva(
                  novaArea,
                  novaData,
                  novoHorarioInicio,
                  novoDiaInteiro ? "23:00 (Dia Inteiro)" : novoHorarioFim,
                  novoDiaInteiro,
                  novosConvidados,
                  novaObservacao
                );
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Área Comum
                </label>
                <select
                  value={novaArea}
                  onChange={(e) => setNovaArea(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm font-medium focus:outline-none focus:border-[#0A2540]"
                >
                  {AREAS.map((a) => (
                    <option key={a.nome} value={a.nome}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Data da Reserva (Máx: +30 Dias)
                </label>
                <input
                  type="date"
                  required
                  min={dataHojeISO}
                  max={dataMax30ISO}
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm focus:outline-none focus:border-[#0A2540]"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Para datas acima de 30 dias ({dataMax30ISO}), consulte o Síndico.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                    Início
                  </label>
                  <select
                    value={novoHorarioInicio}
                    onChange={(e) => setNovoHorarioInicio(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm font-medium focus:outline-none focus:border-[#0A2540]"
                  >
                    {LISTA_HORARIOS_INICIO.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                    Fim
                  </label>
                  <select
                    disabled={novoDiaInteiro}
                    value={novoDiaInteiro ? "23:00" : novoHorarioFim}
                    onChange={(e) => setNovoHorarioFim(e.target.value)}
                    className={`w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium focus:outline-none focus:border-[#0A2540] ${
                      novoDiaInteiro
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                        : "bg-white dark:bg-[#111a2e]"
                    }`}
                  >
                    {novoDiaInteiro ? (
                      <option value="23:00">23:00 (Encerramento do Dia)</option>
                    ) : (
                      LISTA_HORARIOS_FIM.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={novoDiaInteiro}
                  onChange={(e) => setNovoDiaInteiro(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                  Dia inteiro a partir de {novoHorarioInicio} (até 23:00)
                </span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Convidados Estimados
                </label>
                <input
                  type="number"
                  placeholder="Ex: 30"
                  value={novosConvidados}
                  onChange={(e) => setNovosConvidados(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm focus:outline-none focus:border-[#0A2540]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Observações / Requisitos Especiais
                </label>
                <textarea
                  rows={3}
                  value={novaObservacao}
                  onChange={(e) => setNovaObservacao(e.target.value)}
                  placeholder="Ex: Música alta, precisa de tal coisa, usar equipamento X..."
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm focus:outline-none focus:border-[#0A2540]"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-[#0A2540] dark:bg-blue-600 hover:bg-[#0A2540]/90 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
                >
                  Confirmar Reserva no Banco
                </button>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-5 py-3.5 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
