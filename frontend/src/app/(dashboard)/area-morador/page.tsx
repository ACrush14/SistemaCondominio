"use client";
import React, { useState, useEffect } from "react";
import QRCode from "qrcode";

const UNIDADE_LOGADA = "Apto 301"; // TODO: substituir pela unidade do usuário autenticado quando o login real estiver ligado

interface Encomenda {
  id: string;
  unidade: string;
  remetente: string;
  status: "AGUARDANDO_AVISO" | "AGUARDANDO_RETIRADA" | "ENTREGUE";
  data_chegada: string;
}

export default function AreaMoradorPage() {
  const [perguntaIa, setPerguntaIa] = useState("");
  const [respostaIa, setRespostaIa] = useState("");
  const [carregandoIa, setCarregandoIa] = useState(false);
  const [mostrarQrCode, setMostrarQrCode] = useState(false);
  const [nomeVisitanteQr, setNomeVisitanteQr] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [gerandoQr, setGerandoQr] = useState(false);
  const [erroQr, setErroQr] = useState("");
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);

  const abrirModalQr = () => {
    setQrDataUrl(null);
    setErroQr("");
    setNomeVisitanteQr("");
    setMostrarQrCode(true);
  };

  const gerarQrCode = async () => {
    setGerandoQr(true);
    setErroQr("");
    try {
      const res = await fetch("/api/condominio/visitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unidade: UNIDADE_LOGADA,
          morador: "João (Morador Tailson)",
          nome_visitante: nomeVisitanteQr || "Convidado",
        }),
      });
      const dados = await res.json();
      if (!res.ok) {
        setErroQr(dados.erro || "Erro ao gerar QR Code.");
        return;
      }
      const imagem = await QRCode.toDataURL(dados.codigo);
      setQrDataUrl(imagem);
    } catch (_err) {
      setErroQr("Erro ao gerar QR Code.");
    } finally {
      setGerandoQr(false);
    }
  };

  useEffect(() => {
    fetch(`/api/condominio/encomendas?unidade=${encodeURIComponent(UNIDADE_LOGADA)}`)
      .then((res) => res.json())
      .then((data) => setEncomendas(data))
      .catch(() => {});
  }, []);

  const encomendasPendentes = encomendas.filter((e) => e.status !== "ENTREGUE");

  const retirarEncomenda = async (id: string) => {
    await fetch(`/api/condominio/encomendas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ENTREGUE" }),
    });
    setEncomendas(
      encomendas.map((e) => (e.id === id ? { ...e, status: "ENTREGUE" } : e))
    );
  };

  const handlePerguntarIa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perguntaIa.trim()) return;

    setCarregandoIa(true);
    try {
      const res = await fetch("/api/condominio/ia-mania", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: perguntaIa }),
      });
      const data = await res.json();
      setRespostaIa(data.resposta_ia);
    } catch (err) {
      setRespostaIa(
        "A piscina funciona de terça a domingo das 06:00 às 22:00. Mudanças devem ser agendadas com 48h de antecedência."
      );
    } finally {
      setCarregandoIa(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-neutral-light min-h-screen text-neutral-dark flex justify-center">
      {/* Container estilo App Mobile / Dashboard Responsivo */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Top Header Morador */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#0A2540] text-white flex items-center justify-center font-bold text-lg">
              JO
            </div>
            <div>
              <p className="text-xs text-gray-500">Olá, João (Tailson)</p>
              <p className="text-lg font-bold text-[#0A2540]">Apto 301</p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-blue-800">
            🔔
          </button>
        </div>

        {/* Resumo de Hoje */}
        <div>
          <h2 className="text-xl font-bold text-[#0A2540]">Resumo de Hoje</h2>
          <p className="text-sm text-gray-600 mt-1">
            Você tem <strong>{encomendasPendentes.length} encomenda(s) pendente(s)</strong> e{" "}
            <strong>1 boleto</strong> próximo ao vencimento.
          </p>
        </div>

        {/* Card Principal: Liberar Visita (QR Code) */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🔲</span>
            <div>
              <h3 className="font-bold text-[#0A2540] text-base">
                Liberar Visita
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Gerar QR Code rápido
              </p>
            </div>
          </div>
          <button
            onClick={abrirModalQr}
            className="w-11 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold flex items-center justify-center shadow-sm transition-transform active:scale-95"
          >
            +
          </button>
        </div>

        {/* Modal/Expansão QR Code */}
        {mostrarQrCode && (
          <div className="bg-white border-2 border-blue-600 rounded-2xl p-6 text-center space-y-3 shadow-md">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              QR Code de Acesso Rápido (Validade 24h)
            </p>

            {erroQr && (
              <p className="text-xs font-semibold text-red-600">{erroQr}</p>
            )}

            {!qrDataUrl ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={nomeVisitanteQr}
                  onChange={(e) => setNomeVisitanteQr(e.target.value)}
                  placeholder="Nome do convidado"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={gerarQrCode}
                  disabled={gerandoQr}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  {gerandoQr ? "Gerando..." : "Gerar QR Code"}
                </button>
              </div>
            ) : (
              <img
                src={qrDataUrl}
                alt="QR Code de acesso"
                className="w-44 h-44 mx-auto rounded-xl shadow-inner"
              />
            )}

            <button
              onClick={() => setMostrarQrCode(false)}
              className="text-xs text-red-600 font-semibold hover:underline"
            >
              Fechar
            </button>
          </div>
        )}

        {/* 2 Cards: Boleto & Encomendas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border-l-4 border-red-500 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <span className="text-xl">💳</span>
            <p className="font-bold text-sm text-[#0A2540] mt-2">Boleto Mês</p>
            <p className="text-xs text-red-600 font-semibold mt-1">
              Vence em 2 dias
            </p>
          </div>

          <div className="border-l-4 border-emerald-600 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xl">📦</span>
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
            </div>
            <p className="font-bold text-sm text-[#0A2540] mt-2">Encomendas</p>
            <p className="text-xs text-gray-600 mt-1">
              {encomendasPendentes.length === 0
                ? "Nenhuma pendente"
                : `${encomendasPendentes.length} aguardando retirada`}
            </p>
            {encomendasPendentes[0] && (
              <button
                onClick={() => retirarEncomenda(encomendasPendentes[0].id)}
                className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
              >
                Retirar {encomendasPendentes[0].remetente}
              </button>
            )}
          </div>
        </div>

        {/* Card Síndico Virtual IA */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 rounded-3xl p-6 border border-blue-200/60 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h3 className="font-bold text-base text-[#0A2540]">
              Síndico Virtual IA
            </h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Dúvidas sobre regras da piscina ou horários de mudança? Pergunte à
            nossa IA.
          </p>

          <form onSubmit={handlePerguntarIa} className="relative">
            <input
              type="text"
              value={perguntaIa}
              onChange={(e) => setPerguntaIa(e.target.value)}
              placeholder="Pergunte algo... (ex: horário piscina)"
              className="w-full py-3.5 pl-4 pr-14 rounded-2xl border border-blue-200 bg-white text-sm focus:outline-none focus:border-blue-500 shadow-sm"
            />
            <button
              type="submit"
              disabled={carregandoIa}
              className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center transition-transform active:scale-95"
            >
              ➤
            </button>
          </form>

          {respostaIa && (
            <div className="bg-white rounded-2xl p-4 border border-teal-100 text-xs text-gray-700 space-y-1 shadow-sm">
              <p className="font-bold text-teal-800">Resposta do Síndico IA:</p>
              <p className="leading-relaxed">{respostaIa}</p>
            </div>
          )}
        </div>

        {/* Próximas Reservas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#0A2540] text-base">
              Próximas Reservas
            </h3>
            <span className="text-xs font-semibold text-blue-700 cursor-pointer">
              VER TODAS
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="bg-white border border-gray-200 px-3 py-2 rounded-xl text-center">
                <p className="text-[10px] font-bold text-blue-600 uppercase">
                  OUT
                </p>
                <p className="text-base font-bold text-[#0A2540]">12</p>
              </div>
              <div>
                <p className="font-bold text-sm text-[#0A2540]">
                  Churrasqueira A
                </p>
                <p className="text-xs text-gray-500">10:00 - 18:00</p>
              </div>
            </div>

            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-lg">
              CONFIRMADO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
