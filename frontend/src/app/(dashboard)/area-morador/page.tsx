"use client";
import React, { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";

const UNIDADE_LOGADA = "Apto 301";

interface Encomenda {
  id: string;
  unidade: string;
  remetente: string;
  status: "AGUARDANDO_AVISO" | "AGUARDANDO_RETIRADA" | "ENTREGUE";
  data_chegada: string;
}

interface EnqueteMorador {
  id: number;
  titulo: string;
  descricao: string;
  opcoes: string[];
  status: "ATIVA" | "ENCERRADA";
  criada_por: string;
  data: string;
  total_votos: number;
  votos_por_opcao: number[];
  meu_voto: number | null;
}

interface ItemDetalhamento {
  item: string;
  valor: number;
}

interface BoletoFinanceiro {
  id: number;
  unidade: string;
  competencia: string;
  valor: number;
  data_vencimento: string;
  status: "PENDENTE" | "PAGO" | "VENCIDO";
  codigo_barras: string;
  pix_copia_cola: string;
  detalhamento: ItemDetalhamento[];
}

export default function AreaMoradorPage() {
  const [abaAtiva, setAbaAtiva] = useState<"GERAL" | "FINANCEIRO">("FINANCEIRO");

  // IA e Serviços
  const [perguntaIa, setPerguntaIa] = useState("");
  const [respostaIa, setRespostaIa] = useState("");
  const [carregandoIa, setCarregandoIa] = useState(false);
  const [mostrarQrCode, setMostrarQrCode] = useState(false);
  const [nomeVisitanteQr, setNomeVisitanteQr] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [codigoGerado, setCodigoGerado] = useState<string | null>(null);
  const [gerandoQr, setGerandoQr] = useState(false);
  const [erroQr, setErroQr] = useState("");

  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [enquetes, setEnquetes] = useState<EnqueteMorador[]>([]);
  const [votandoId, setVotandoId] = useState<number | null>(null);

  // Financeiro e Boletos
  const [boletos, setBoletos] = useState<BoletoFinanceiro[]>([]);
  const [boletoSelecionado, setBoletoSelecionado] = useState<BoletoFinanceiro | null>(null);
  const [copiadoTipo, setCopiadoTipo] = useState<"BARRAS" | "PIX" | null>(null);
  const [pagandoId, setPagandoId] = useState<number | null>(null);

  const buscarBoletos = useCallback(async () => {
    try {
      const res = await fetch(`/api/condominio/financeiro?unidade=${encodeURIComponent(UNIDADE_LOGADA)}`);
      if (res.ok) {
        const dados = await res.json();
        setBoletos(dados);
      }
    } catch (_err) {
      // ignora
    }
  }, []);

  useEffect(() => {
    buscarBoletos();
  }, [buscarBoletos]);

  const copiarTexto = async (texto: string, tipo: "BARRAS" | "PIX") => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoTipo(tipo);
      setTimeout(() => setCopiadoTipo(null), 3000);
    } catch (_err) {
      // ignora
    }
  };

  const simularPagamento = async (id: number) => {
    setPagandoId(id);
    try {
      const res = await fetch(`/api/condominio/financeiro/${id}/pagar`, {
        method: "PATCH",
      });
      if (res.ok) {
        const dados = await res.json();
        setBoletos(dados);
        if (boletoSelecionado && boletoSelecionado.id === id) {
          const atualizado = dados.find((b: BoletoFinanceiro) => b.id === id);
          if (atualizado) setBoletoSelecionado(atualizado);
        }
      }
    } finally {
      setPagandoId(null);
    }
  };

  const abrirModalQr = () => {
    setQrDataUrl(null);
    setErroQr("");
    setNomeVisitanteQr("");
    setCodigoGerado(null);
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
      // width/margin generosos: QR pequeno ou sem "zona de silêncio" ao redor é a causa mais
      // comum de câmera não conseguir focar/decodificar quando o código é lido de uma tela.
      const imagem = await QRCode.toDataURL(dados.codigo, { width: 400, margin: 3 });
      setQrDataUrl(imagem);
      setCodigoGerado(dados.codigo);
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

    fetch(`/api/condominio/enquetes?unidade=${encodeURIComponent(UNIDADE_LOGADA)}`)
      .then((res) => res.json())
      .then((data) => setEnquetes(data))
      .catch(() => {});
  }, []);

  const votarEnquete = async (enqueteId: number, opcaoIdx: number) => {
    setVotandoId(enqueteId);
    try {
      const res = await fetch("/api/condominio/enquetes/votar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquete_id: enqueteId,
          unidade: UNIDADE_LOGADA,
          opcao_index: opcaoIdx,
        }),
      });
      if (res.ok) {
        const enqRes = await fetch(
          `/api/condominio/enquetes?unidade=${encodeURIComponent(UNIDADE_LOGADA)}`
        );
        const enqDados = await enqRes.json();
        setEnquetes(enqDados);
      }
    } finally {
      setVotandoId(null);
    }
  };

  const perguntarIa = async () => {
    if (!perguntaIa.trim()) return;
    setCarregandoIa(true);
    try {
      const res = await fetch("/api/ia/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: perguntaIa }),
      });
      const data = await res.json();
      setRespostaIa(data.resposta);
    } catch (_err) {
      setRespostaIa("Desculpe, tive um problema ao me conectar. Tente novamente em instantes.");
    } finally {
      setCarregandoIa(false);
    }
  };

  const boletosPendentes = boletos.filter((b) => b.status === "PENDENTE" || b.status === "VENCIDO");
  const proximoBoleto = boletosPendentes[0];

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-2">
            Portal do Condomínio
          </span>
          <h1 className="text-3xl font-extrabold text-[#0A2540]">Área do Morador</h1>
          <p className="text-sm text-gray-500 mt-1">
            Unidade logada: <strong className="text-[#0A2540]">{UNIDADE_LOGADA}</strong>
          </p>
        </div>

        {/* Abas de Navegação */}
        <div className="flex gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200/60">
          <button
            onClick={() => setAbaAtiva("FINANCEIRO")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              abaAtiva === "FINANCEIRO"
                ? "bg-[#0A2540] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>💳</span>
            <span>Financeiro & 2ª Via</span>
            {boletosPendentes.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {boletosPendentes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setAbaAtiva("GERAL")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              abaAtiva === "GERAL"
                ? "bg-[#0A2540] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>🏠</span>
            <span>Serviços & Votações</span>
          </button>
        </div>
      </div>

      {/* ==================== ABA FINANCEIRO & 2ª VIA ==================== */}
      {abaAtiva === "FINANCEIRO" && (
        <div className="space-y-6">
          {/* KPI Cards Financeiros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Próxima Fatura em Aberto
                </span>
                <p className="text-2xl font-extrabold text-[#0A2540] mt-1">
                  {proximoBoleto
                    ? `R$ ${proximoBoleto.valor.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}`
                    : "R$ 0,00"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {proximoBoleto
                    ? `Vencimento: ${proximoBoleto.data_vencimento} (${proximoBoleto.competencia})`
                    : "Todas as faturas estão quitadas!"}
                </p>
              </div>
              {proximoBoleto && (
                <button
                  onClick={() => setBoletoSelecionado(proximoBoleto)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  📄 Emitir 2ª Via / Pagar
                </button>
              )}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Situação Cadastral
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-lg font-bold text-emerald-800">Adimplente</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Unidade {UNIDADE_LOGADA} sem débitos judiciais ou em protesto.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Boletos Listados
                </span>
                <p className="text-2xl font-extrabold text-[#0A2540] mt-1">{boletos.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Persistidos no PostgreSQL (Neon DB)
                </p>
              </div>
            </div>
          </div>

          {/* Lista Completa de Boletos */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0A2540]">Histórico e 2ª Via de Faturas</h2>
                <p className="text-xs text-gray-500">
                  Selecione uma fatura para emitir a 2ª via com código de barras ou PIX
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {boletos.map((b) => (
                <div
                  key={b.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    b.status === "PENDENTE"
                      ? "border-amber-200 bg-amber-50/20"
                      : b.status === "VENCIDO"
                      ? "border-red-200 bg-red-50/20"
                      : "border-gray-100 bg-gray-50/40"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-[#0A2540]">
                        Competência: {b.competencia}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase ${
                          b.status === "PAGO"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "PENDENTE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {b.status === "PAGO"
                          ? "🟢 PAGO"
                          : b.status === "PENDENTE"
                          ? "🟡 EM ABERTO"
                          : "🔴 VENCIDO"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Vencimento: <strong className="text-gray-700">{b.data_vencimento}</strong> | Unidade: {b.unidade}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <span className="text-xl font-extrabold text-[#0A2540]">
                      R$ {b.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setBoletoSelecionado(b)}
                        className="bg-[#0A2540] hover:bg-[#0A2540]/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        📄 Emitir 2ª Via / PIX
                      </button>

                      {b.status !== "PAGO" && (
                        <button
                          onClick={() => simularPagamento(b.id)}
                          disabled={pagandoId === b.id}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          {pagandoId === b.id ? "..." : "✓ Simular Baixa"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== ABA GERAL / SERVIÇOS ==================== */}
      {abaAtiva === "GERAL" && (
        <div className="space-y-8">
          {/* Assistente IA */}
          <div className="bg-[#0A2540] text-white p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🤖</span>
              <div>
                <h2 className="text-xl font-bold">IA do Condomínio (Disponível 24h)</h2>
                <p className="text-xs text-blue-200">
                  Tire dúvidas sobre regras, horários ou procedimentos no condomínio.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={perguntaIa}
                onChange={(e) => setPerguntaIa(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && perguntarIa()}
                placeholder="Ex: Qual o horário permitido para mudanças ou barulho?"
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={perguntarIa}
                disabled={carregandoIa}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                {carregandoIa ? "Consultando..." : "Perguntar"}
              </button>
            </div>

            {respostaIa && (
              <div className="bg-white/10 border border-white/20 p-4 rounded-2xl text-sm leading-relaxed">
                {respostaIa}
              </div>
            )}
          </div>

          {/* Votações e Enquetes */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-[#0A2540]">🗳️ Votações do Condomínio</h2>
            <div className="grid grid-cols-1 gap-4">
              {enquetes.map((e) => (
                <div key={e.id} className="border border-gray-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-[#0A2540]">{e.titulo}</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full">
                      {e.total_votos} votos
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{e.descricao}</p>

                  <div className="space-y-2">
                    {e.opcoes.map((op, idx) => {
                      const votos = e.votos_por_opcao[idx] || 0;
                      const percentual = e.total_votos > 0 ? Math.round((votos / e.total_votos) * 100) : 0;
                      const meuVotoAqui = e.meu_voto === idx;
                      return (
                        <div key={idx} className="space-y-1">
                          <button
                            onClick={() => votarEnquete(e.id, idx)}
                            disabled={e.status === "ENCERRADA" || votandoId === e.id}
                            className={`w-full p-3 rounded-xl border text-left font-semibold text-sm transition-all flex items-center justify-between cursor-pointer ${
                              meuVotoAqui
                                ? "bg-blue-50 border-blue-500 text-[#0A2540]"
                                : "hover:bg-gray-50 border-gray-200"
                            }`}
                          >
                            <span>
                              {meuVotoAqui && "✓ "}
                              {op}
                            </span>
                            <span className="text-xs font-bold">{percentual}%</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR Code Visitantes */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0A2540]">📱 QR Code para Visitantes</h2>
                <p className="text-xs text-gray-500">Gere autorizações temporárias para a portaria</p>
              </div>
              <button
                onClick={abrirModalQr}
                className="bg-[#0A2540] hover:bg-[#0A2540]/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
              >
                + Gerar Novo QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2ª VIA DO BOLETO ==================== */}
      {boletoSelecionado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 w-full max-w-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setBoletoSelecionado(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="border-b border-gray-100 pb-4">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Condomínio Tailson Residence
              </span>
              <h3 className="font-extrabold text-2xl text-[#0A2540]">
                2ª Via de Boleto Bancário — {boletoSelecionado.competencia}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Unidade: <strong>{boletoSelecionado.unidade}</strong> | Vencimento:{" "}
                <strong>{boletoSelecionado.data_vencimento}</strong>
              </p>
            </div>

            {/* Composição / Detalhamento */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Discriminação das Despesas Condominiais
              </h4>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/60 space-y-2">
                {boletoSelecionado.detalhamento.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-[#0A2540]">
                    <span>{item.item}</span>
                    <span className="font-semibold">
                      R$ {item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-extrabold text-base text-[#0A2540]">
                  <span>Total da Fatura</span>
                  <span>
                    R$ {boletoSelecionado.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Linha Digitável */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Linha Digitável / Código de Barras
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  readOnly
                  value={boletoSelecionado.codigo_barras}
                  className="bg-gray-50 border border-gray-200 p-3 rounded-xl w-full font-mono text-xs text-[#0A2540] font-semibold"
                />
                <button
                  onClick={() => copiarTexto(boletoSelecionado.codigo_barras, "BARRAS")}
                  className="bg-[#0A2540] hover:bg-[#0A2540]/90 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shrink-0 cursor-pointer"
                >
                  {copiadoTipo === "BARRAS" ? "✓ Copiado!" : "📋 Copiar Linha"}
                </button>
              </div>
            </div>

            {/* PIX Copia e Cola */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Pagamento Instantâneo PIX (Copia e Cola)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  readOnly
                  value={boletoSelecionado.pix_copia_cola}
                  className="bg-gray-50 border border-gray-200 p-3 rounded-xl w-full font-mono text-xs text-gray-500 truncate"
                />
                <button
                  onClick={() => copiarTexto(boletoSelecionado.pix_copia_cola, "PIX")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shrink-0 cursor-pointer"
                >
                  {copiadoTipo === "PIX" ? "✓ Copiado!" : "⚡ Copiar PIX"}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-gray-100 hover:bg-gray-200 text-[#0A2540] font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer"
              >
                🖨️ Imprimir 2ª Via / Salvar PDF
              </button>

              <div className="flex gap-2">
                {boletoSelecionado.status !== "PAGO" && (
                  <button
                    onClick={() => {
                      simularPagamento(boletoSelecionado.id);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    ✓ Confirmar Pagamento
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setBoletoSelecionado(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {mostrarQrCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl shadow-2xl space-y-4 w-full max-w-md relative border border-gray-100">
            <button
              onClick={() => setMostrarQrCode(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>
            <h3 className="font-bold text-xl text-[#0A2540]">Gerar QR Code de Visita</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Nome do Visitante
              </label>
              <input
                value={nomeVisitanteQr}
                onChange={(e) => setNomeVisitanteQr(e.target.value)}
                placeholder="Ex: Carlos Eduardo"
                className="border border-gray-200 p-3 rounded-xl w-full text-sm"
              />
            </div>

            {erroQr && <p className="text-red-600 text-xs font-medium">{erroQr}</p>}

            {!qrDataUrl ? (
              <button
                onClick={gerarQrCode}
                disabled={gerandoQr}
                className="w-full bg-[#0A2540] text-white py-3 rounded-xl font-bold text-sm"
              >
                {gerandoQr ? "Gerando..." : "Criar QR Code"}
              </button>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-[#0A2540] text-white rounded-2xl py-4 px-3 space-y-1">
                  <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider">
                    Código de Liberação
                  </p>
                  <p className="text-4xl font-extrabold tracking-[0.3em]">{codigoGerado}</p>
                  <p className="text-xs text-blue-200">
                    Informe este número na portaria — mais simples que o QR Code
                  </p>
                </div>
                <img src={qrDataUrl} alt="QR Code" className="mx-auto w-72 h-72 border rounded-2xl p-2" />
                <p className="text-xs text-gray-500">Ou apresente este QR Code na portaria</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
