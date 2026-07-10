"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface KPI {
  visitantes_ativos: number;
  visitantes_variacao: string;
  ocorrencias_pendentes: number;
  encomendas_portaria: number;
  reservas_hoje: number;
}

interface InsightsIA {
  analise_areas_comuns: string;
  sintese_reclamacoes: string;
}

interface Ocorrencia {
  id: string;
  titulo: string;
  local: string;
  unidade: string;
  morador: string;
  status: string;
  data: string;
}

interface ReservaHoje {
  id: string;
  area: string;
  horario: string;
  morador: string;
  badge: string;
}

interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string;
  data: string;
  publico: string;
}

export default function PainelSindicoPage() {
  const [kpi, setKpi] = useState<KPI>({
    visitantes_ativos: 42,
    visitantes_variacao: "~ 12%",
    ocorrencias_pendentes: 7,
    encomendas_portaria: 18,
    reservas_hoje: 3,
  });

  const [insights, setInsights] = useState<InsightsIA>({
    analise_areas_comuns:
      "Identificamos um aumento de 45% nas reservas das churrasqueiras aos domingos comparado ao mês anterior. Recomendamos verificar os estoques de material de limpeza e agendar manutenção preventiva nas grelhas para a próxima semana.",
    sintese_reclamacoes:
      "As 7 ocorrências pendentes concentram-se em: Barulho excessivo após as 22h (Torre B) e Vazamento na garagem (Subsolo 2). Sugere-se um comunicado reforçando as regras de silêncio para a Torre B.",
  });

  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([
    {
      id: "1",
      titulo: "Vazamento Vaga 42",
      local: "Garagem Subsolo 2",
      unidade: "Apt 301 - Torre A",
      morador: "Carlos M.",
      status: "Em Análise",
      data: "Há 2 horas",
    },
    {
      id: "2",
      titulo: "Barulho Excessivo",
      local: "Torre B",
      unidade: "Apt 804 - Torre B",
      morador: "Ana Souza",
      status: "Pendente",
      data: "Ontem, 23:15",
    },
  ]);

  const [reservasHoje, setReservasHoje] = useState<ReservaHoje[]>([
    {
      id: "r1",
      area: "Salão de Festas",
      horario: "14:00 - 22:00",
      morador: "Carlos Almeida (Apt 402)",
      badge: "CA",
    },
    {
      id: "r2",
      area: "Churrasqueira 1",
      horario: "18:00 - 23:00",
      morador: "Maria Rita (Apt 105)",
      badge: "MR",
    },
  ]);

  const [comunicados, setComunicados] = useState<Comunicado[]>([
    {
      id: "c1",
      titulo: "Manutenção dos Elevadores",
      conteudo: "",
      data: "Enviado em 22 Out",
      publico: "Todos os moradores",
    },
    {
      id: "c2",
      titulo: "Assembleia Geral Ordinária",
      conteudo: "",
      data: "Enviado em 15 Out",
      publico: "Proprietários",
    },
  ]);

  useEffect(() => {
    fetch("http://localhost:3333/api/condominio/resumo-sindico")
      .then((res) => res.json())
      .then((data) => {
        if (data.kpis) setKpi(data.kpis);
        if (data.insights_ia) setInsights(data.insights_ia);
        if (data.ultimas_ocorrencias) setOcorrencias(data.ultimas_ocorrencias);
        if (data.reservas_hoje_lista) setReservasHoje(data.reservas_hoje_lista);
        if (data.comunicados_recentes) setComunicados(data.comunicados_recentes);
      })
      .catch(() => {
        // Usa os dados default do estado em caso de backend offline
      });
  }, []);

  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="p-8 space-y-8 bg-neutral-light min-h-screen text-neutral-dark">
      {/* Cabeçalho Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A2540]">
            Visão Geral
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Bem-vindo ao painel de controle do Residencial Aurora.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm text-sm font-medium text-gray-700">
          <span>📅</span>
          <span>Hoje, {dataAtual}</span>
        </div>
      </div>

      {/* 4 Cards KPI no Topo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Visitantes Ativos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
              👥
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
              ↗ {kpi.visitantes_variacao}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
              Visitantes Ativos
            </p>
            <p className="text-3xl font-bold text-[#0A2540] mt-1">
              {kpi.visitantes_ativos}
            </p>
          </div>
        </div>

        {/* Card 2: Ocorrências Pendentes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-lg">
              ⚠️
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
              Ocorrências Pendentes
            </p>
            <p className="text-3xl font-bold text-[#0A2540] mt-1">
              {kpi.ocorrencias_pendentes}
            </p>
          </div>
        </div>

        {/* Card 3: Encomendas na Portaria */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-lg">
              📦
            </span>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              Hoje
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
              Encomendas na Portaria
            </p>
            <p className="text-3xl font-bold text-[#0A2540] mt-1">
              {kpi.encomendas_portaria}
            </p>
          </div>
        </div>

        {/* Card 4: Reservas Hoje */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
              🗓️
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
              Reservas Hoje
            </p>
            <p className="text-3xl font-bold text-[#0A2540] mt-1">
              {kpi.reservas_hoje}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Principal - 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Esquerda: Resumo Inteligente & Ocorrências (2 colunas no grid) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">✨</span>
                <h2 className="text-lg font-bold text-[#0A2540]">
                  Resumo Inteligente & Ocorrências
                </h2>
              </div>
              <Link
                href="/ocorrencias"
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Ver Histórico Completo
              </Link>
            </div>

            {/* Painéis de Insights IA */}
            <div className="p-6 space-y-4 bg-gradient-to-b from-blue-50/40 to-transparent">
              {/* Insight 1 */}
              <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm flex items-start gap-3.5">
                <span className="text-blue-600 text-lg mt-0.5">📈</span>
                <div>
                  <h3 className="font-bold text-sm text-[#0A2540]">
                    Análise de Uso de Áreas Comuns
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {insights.analise_areas_comuns}
                  </p>
                </div>
              </div>

              {/* Insight 2 */}
              <div className="bg-white border border-red-100 rounded-xl p-4 shadow-sm flex items-start gap-3.5">
                <span className="text-red-500 text-lg mt-0.5">📄</span>
                <div>
                  <h3 className="font-bold text-sm text-[#0A2540]">
                    Síntese de Reclamações (Últimos 7 dias)
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {insights.sintese_reclamacoes}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de Últimas Ocorrências */}
            <div className="px-6 pb-6 pt-2">
              <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-3">
                Últimas Ocorrências
              </p>
              <div className="space-y-3">
                {ocorrencias.map((o) => (
                  <Link
                    key={o.id}
                    href="/ocorrencias"
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-lg">
                        💧
                      </span>
                      <div>
                        <p className="font-bold text-sm text-[#0A2540]">
                          {o.titulo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {o.unidade} • {o.data}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          o.status === "Em Análise"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {o.status}
                      </span>
                      <span className="text-gray-400 font-bold">›</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Direita: Reservas Hoje + Comunicados Recentes (1 coluna) */}
        <div className="space-y-6">
          {/* Card Reservas Hoje */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0A2540]">Reservas Hoje</h2>
              <span className="text-gray-400">•••</span>
            </div>

            <div className="space-y-3">
              {reservasHoje.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border border-gray-100 space-y-2 bg-gray-50/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#0A2540] flex items-center gap-2">
                      <span>🎉</span> {r.area}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded">
                      {r.horario}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-6 h-6 rounded-full bg-[#0A2540] text-white flex items-center justify-center font-bold text-[10px]">
                      {r.badge}
                    </span>
                    <span>{r.morador}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card Comunicados Recentes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0A2540]">
                Comunicados Recentes
              </h2>
              <Link
                href="/ocorrencias"
                className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm hover:bg-blue-100"
              >
                +
              </Link>
            </div>

            <div className="space-y-3">
              {comunicados.map((c) => (
                <div
                  key={c.id}
                  className="pl-3 border-l-4 border-[#0A2540] py-1"
                >
                  <p className="text-sm font-bold text-[#0A2540]">
                    {c.titulo}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.data} • {c.publico}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/ocorrencias"
              className="block w-full text-center py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-[#0A2540] hover:bg-gray-50 transition-colors"
            >
              Gerenciar Comunicados
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
