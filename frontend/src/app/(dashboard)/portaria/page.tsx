"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface Visitante {
  id: string;
  nome: string;
  documento: string;
  unidade_destino: string;
  status: "PENDENTE" | "AUTORIZADO" | "NEGADO";
}

interface RegistroTurno {
  id: number;
  porteiro_nome: string;
  turno: string;
  assunto: string;
  prioridade: "NORMAL" | "IMPORTANTE" | "URGENTE";
  descricao: string;
  lido_por: string[];
  criado_em: string;
}

interface AlertaPanico {
  id: number;
  porteiro_nome: string;
  tipo_emergencia: string;
  localizacao: string;
  observacao: string;
  status: "ATIVO" | "RESOLVIDO";
  resolvido_por: string;
  criado_em: string;
  resolvido_em: string | null;
}

export default function PortariaPage() {
  const [abaAtiva, setAbaAtiva] = useState<"VISITANTES" | "LIVRO_TURNO" | "PANICO">("LIVRO_TURNO");
  const [nomePorteiroAtual, setNomePorteiroAtual] = useState("Fulano Porteiro");

  // Estado Pânico
  const [alertasPanico, setAlertasPanico] = useState<AlertaPanico[]>([]);
  const [modalPanicoAberto, setModalPanicoAberto] = useState(false);
  const [tipoPanico, setTipoPanico] = useState("🆘 ALERTA GERAL DE PÂNICO");
  const [obsPanico, setObsPanico] = useState("");
  const [acionandoPanico, setAcionandoPanico] = useState(false);

  // Estado Visitantes / QR Code
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [placa, setPlaca] = useState("");
  const [unidade, setUnidade] = useState("");
  const [scannerAtivo, setScannerAtivo] = useState(false);
  const [resultadoScan, setResultadoScan] = useState<{
    tipo: "sucesso" | "erro";
    mensagem: string;
  } | null>(null);
  const [codigoDigitado, setCodigoDigitado] = useState("");
  const [validandoCodigoDigitado, setValidandoCodigoDigitado] = useState(false);

  // Estado Livro de Turno
  const [registrosTurno, setRegistrosTurno] = useState<RegistroTurno[]>([]);
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("TODAS");
  const [modalTurnoAberto, setModalTurnoAberto] = useState(false);
  const [novoTurno, setNovoTurno] = useState("TARDE (14h - 22h)");
  const [novoAssunto, setNovoAssunto] = useState("PASSAGEM DE PLANTÃO");
  const [novaPrioridade, setNovaPrioridade] = useState<"NORMAL" | "IMPORTANTE" | "URGENTE">("NORMAL");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [salvandoTurno, setSalvandoTurno] = useState(false);

  // Busca de Pânico
  const buscarAlertasPanico = useCallback(async () => {
    try {
      const res = await fetch("/api/condominio/panico");
      if (res.ok) {
        const dados = await res.json();
        setAlertasPanico(dados.alertas || []);
      }
    } catch (_err) {
      // ignora
    }
  }, []);

  // Busca do Livro de Turno
  const buscarLivroTurno = useCallback(async () => {
    try {
      const res = await fetch("/api/condominio/livro-turno");
      if (res.ok) {
        const dados = await res.json();
        setRegistrosTurno(dados);
      }
    } catch (_err) {
      // ignora
    }
  }, []);

  useEffect(() => {
    buscarLivroTurno();
    buscarAlertasPanico();
    const int = setInterval(() => {
      buscarLivroTurno();
      buscarAlertasPanico();
    }, 5000);
    return () => clearInterval(int);
  }, [buscarLivroTurno, buscarAlertasPanico]);

  const acionarBotaoPanico = async (tipoEscolhido?: string) => {
    setAcionandoPanico(true);
    try {
      const res = await fetch("/api/condominio/panico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          porteiro_nome: nomePorteiroAtual,
          tipo_emergencia: tipoEscolhido || tipoPanico,
          localizacao: "Portaria Principal",
          observacao: obsPanico,
        }),
      });
      if (res.ok) {
        const dados = await res.json();
        setAlertasPanico(dados.alertas || []);
        setModalPanicoAberto(false);
        setObsPanico("");
        setAbaAtiva("PANICO");
      }
    } finally {
      setAcionandoPanico(false);
    }
  };

  const resolverAlertaPanico = async (id: number) => {
    try {
      const res = await fetch(`/api/condominio/panico/${id}/resolver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolvido_por: nomePorteiroAtual }),
      });
      if (res.ok) {
        const dados = await res.json();
        setAlertasPanico(dados.alertas || []);
      }
    } catch (_err) {
      // ignora
    }
  };

  const registrarNovoTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaDescricao.trim()) return;
    setSalvandoTurno(true);
    try {
      const res = await fetch("/api/condominio/livro-turno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          porteiro_nome: nomePorteiroAtual,
          turno: novoTurno,
          assunto: novoAssunto,
          prioridade: novaPrioridade,
          descricao: novaDescricao,
        }),
      });
      if (res.ok) {
        const dados = await res.json();
        setRegistrosTurno(dados);
        setModalTurnoAberto(false);
        setNovaDescricao("");
      }
    } finally {
      setSalvandoTurno(false);
    }
  };

  const marcarComoCiente = async (id: number) => {
    try {
      const res = await fetch(`/api/condominio/livro-turno/${id}/ciente`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ porteiro_nome: nomePorteiroAtual }),
      });
      if (res.ok) {
        const dados = await res.json();
        setRegistrosTurno(dados);
      }
    } catch (_err) {
      // ignora
    }
  };

  const validarCodigo = useCallback(async (codigo: string) => {
    try {
      const res = await fetch("/api/condominio/visitas/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const dados = await res.json();

      if (!res.ok) {
        setResultadoScan({ tipo: "erro", mensagem: dados.erro || "Código inválido." });
        return;
      }

      setResultadoScan({
        tipo: "sucesso",
        mensagem: `Acesso liberado: ${dados.visitante.nome_visitante || "Visitante"} (${dados.visitante.unidade})`,
      });
    } catch (_err) {
      setResultadoScan({ tipo: "erro", mensagem: "Erro ao validar o código." });
    }
  }, []);

  const liberarComCodigoDigitado = async (e: React.FormEvent) => {
    e.preventDefault();
    const codigo = codigoDigitado.trim();
    if (!codigo) return;
    setValidandoCodigoDigitado(true);
    try {
      await validarCodigo(codigo);
      setCodigoDigitado("");
    } finally {
      setValidandoCodigoDigitado(false);
    }
  };

  useEffect(() => {
    if (!scannerAtivo) return;
    const scanner = new Html5QrcodeScanner("leitor-qr", { fps: 10, qrbox: 250 }, false);
    scanner.render(
      (codigoLido) => {
        try {
          scanner.pause(true);
        } catch (_e) {
          // Leitura veio de um arquivo de imagem (não da câmera ao vivo): não há o que pausar.
        }
        validarCodigo(codigoLido).finally(() => {
          setTimeout(() => {
            try {
              scanner.resume();
            } catch (_e) {
              // Idem: sem câmera ativa para retomar.
            }
          }, 3000);
        });
      },
      () => {}
    );
    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scannerAtivo, validarCodigo]);

  const buscarVisitantes = useCallback(async () => {
    try {
      const res = await fetch("/api/visitantes");
      const dados = await res.json();
      setVisitantes(dados);
    } catch (_err) {
      // ignora
    }
  }, []);

  useEffect(() => {
    buscarVisitantes();
    const intervalo = setInterval(buscarVisitantes, 5000);
    return () => clearInterval(intervalo);
  }, [buscarVisitantes]);

  const registrarEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/visitantes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        documento,
        placa_veiculo: placa,
        unidade_destino: unidade,
      }),
    });
    setModalAberto(false);
    buscarVisitantes();
  };

  const registrosFiltrados = registrosTurno.filter((r) =>
    filtroPrioridade === "TODAS" ? true : r.prioridade === filtroPrioridade
  );

  const alertasAtivos = alertasPanico.filter((a) => a.status === "ATIVO");

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      {/* BANNER DE ALERTA ATIVO DE PÂNICO */}
      {alertasAtivos.length > 0 && (
        <div className="bg-red-600 text-white p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse border-2 border-red-300">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚨</span>
            <div>
              <p className="font-extrabold text-lg uppercase tracking-wide">
                ALERTA DE EMERGÊNCIA ATIVO NA PORTARIA!
              </p>
              <p className="text-xs text-red-100 font-semibold">
                {alertasAtivos[0].tipo_emergencia} — Acionado por{" "}
                <strong>{alertasAtivos[0].porteiro_nome}</strong> em {alertasAtivos[0].criado_em}
              </p>
            </div>
          </div>

          <button
            onClick={() => setAbaAtiva("PANICO")}
            className="bg-white text-red-700 hover:bg-red-50 font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition-all shrink-0 cursor-pointer"
          >
            Ver Alertas ({alertasAtivos.length})
          </button>
        </div>
      )}

      {/* Cabeçalho Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-2">
            Módulo de Segurança & Portaria
          </span>
          <h1 className="text-3xl font-extrabold text-[#0A2540]">Central da Portaria</h1>
          <p className="text-sm text-gray-500 mt-1">
            Controle de acesso, validação de QR Code e Livro de Plantão em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* BOTÃO DE PÂNICO GERAL EM DESTAQUE */}
          <button
            onClick={() => setModalPanicoAberto(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2.5 animate-bounce cursor-pointer border-2 border-red-400"
          >
            <span className="text-xl">🚨</span>
            <span>BOTÃO DE PÂNICO</span>
          </button>

          {/* BOTÃO DISPARAR AVISO E-MAIL & WHATSAPP */}
          <button
            onClick={async () => {
              const destinatario = prompt("Nome do Morador/Unidade (ex: João Apto 301):", "João (Apto 301)");
              if (!destinatario) return;
              const assunto = prompt("Assunto da Notificação:", "📦 Nova Encomenda Recebida na Portaria");
              if (!assunto) return;
              const mensagem = prompt("Mensagem para o morador:", "Olá! Informamos que sua encomenda foi recebida e está disponível na portaria.");
              if (!mensagem) return;

              await fetch("/api/condominio/notificacoes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  destinatario_nome: destinatario,
                  unidade: destinatario,
                  canal: "WHATSAPP",
                  contato: "+55 11 98888-7777",
                  assunto,
                  mensagem,
                  tipo_evento: "PORTARIA",
                }),
              });
              alert("✅ Notificação disparada com sucesso via WhatsApp & E-mail!");
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-4 py-3.5 rounded-2xl shadow-sm text-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <span>📲</span> Avisar Morador (WhatsApp)
          </button>

          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-200/60">
            <span className="text-lg">👮</span>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Porteiro Logado
              </span>
              <input
                type="text"
                value={nomePorteiroAtual}
                onChange={(e) => setNomePorteiroAtual(e.target.value)}
                className="font-bold text-sm text-[#0A2540] bg-transparent focus:outline-none border-b border-transparent focus:border-blue-500 max-w-[150px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Abas de Navegação */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setAbaAtiva("LIVRO_TURNO")}
          className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2.5 cursor-pointer ${
            abaAtiva === "LIVRO_TURNO"
              ? "bg-[#0A2540] text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/60"
          }`}
        >
          <span>📖</span>
          <span>Livro de Plantão & Turnos</span>
          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
            {registrosTurno.length}
          </span>
        </button>

        <button
          onClick={() => setAbaAtiva("VISITANTES")}
          className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2.5 cursor-pointer ${
            abaAtiva === "VISITANTES"
              ? "bg-[#0A2540] text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/60"
          }`}
        >
          <span>📱</span>
          <span>QR Code & Visitantes</span>
        </button>

        <button
          onClick={() => setAbaAtiva("PANICO")}
          className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2.5 cursor-pointer ${
            abaAtiva === "PANICO"
              ? "bg-red-600 text-white shadow-md"
              : "bg-white text-red-600 hover:bg-red-50 border border-red-200"
          }`}
        >
          <span>🚨</span>
          <span>Alertas de Pânico</span>
          {alertasAtivos.length > 0 && (
            <span className="bg-white text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
              {alertasAtivos.length}
            </span>
          )}
        </button>
      </div>

      {/* ==================== ABA PÂNICO & EMERGÊNCIAS ==================== */}
      {abaAtiva === "PANICO" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-red-600">🚨 Histórico de Emergências & Pânico</h2>
              <p className="text-xs text-gray-500 mt-1">
                Todas as emergências são gravadas de forma permanente no PostgreSQL para auditoria.
              </p>
            </div>

            <button
              onClick={() => setModalPanicoAberto(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>+ Acionar Alerta Agora</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {alertasPanico.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-2">
                <span className="text-4xl">🛡️</span>
                <p className="font-bold text-[#0A2540]">Nenhuma emergência registrada</p>
                <p className="text-xs text-gray-400">
                  O condomínio está seguro e sem ocorrências de pânico acionadas.
                </p>
              </div>
            ) : (
              alertasPanico.map((a) => (
                <div
                  key={a.id}
                  className={`p-6 rounded-3xl border shadow-sm transition-all space-y-4 ${
                    a.status === "ATIVO"
                      ? "border-red-300 bg-red-50/40"
                      : "border-gray-200 bg-gray-50/40 opacity-80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase ${
                          a.status === "ATIVO"
                            ? "bg-red-600 text-white animate-pulse"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {a.status === "ATIVO" ? "🚨 EM ANDAMENTO" : "✓ RESOLVIDO"}
                      </span>
                      <span className="font-bold text-base text-[#0A2540]">
                        {a.tipo_emergencia}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      Acionado em {a.criado_em} por <strong>{a.porteiro_nome}</strong>
                    </span>
                  </div>

                  {a.observacao && (
                    <p className="text-sm text-gray-700 bg-white p-3.5 rounded-xl border border-gray-100">
                      <strong>Observação:</strong> {a.observacao}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      Local: <strong className="text-[#0A2540]">{a.localizacao}</strong>
                      {a.status === "RESOLVIDO" && (
                        <span>
                          {" "}
                          | Resolvido por <strong>{a.resolvido_por}</strong> em {a.resolvido_em}
                        </span>
                      )}
                    </span>

                    {a.status === "ATIVO" && (
                      <button
                        onClick={() => resolverAlertaPanico(a.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        ✓ Encerrar / Ocorrência Resolvida
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== ABA LIVRO DE TURNO ==================== */}
      {abaAtiva === "LIVRO_TURNO" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-[#0A2540]">📖 Comunicação entre Turnos</h2>
              <p className="text-xs text-gray-500 mt-1">
                Todas as ocorrências, chaves, avisos importantes e passagens de plantão registradas no PostgreSQL.
              </p>
            </div>

            <button
              onClick={() => setModalTurnoAberto(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>+ Passar Plantão / Novo Registro</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">
              Filtrar por prioridade:
            </span>
            {[
              { id: "TODAS", label: "Todas" },
              { id: "URGENTE", label: "🔴 Urgente" },
              { id: "IMPORTANTE", label: "🟡 Importante" },
              { id: "NORMAL", label: "🟢 Normal" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltroPrioridade(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filtroPrioridade === f.id
                    ? "bg-[#0A2540] text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {registrosFiltrados.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-2">
                <span className="text-4xl">📖</span>
                <p className="font-bold text-[#0A2540]">Nenhum registro encontrado</p>
              </div>
            ) : (
              registrosFiltrados.map((r) => {
                const jaLeu = r.lido_por.includes(nomePorteiroAtual);
                return (
                  <div
                    key={r.id}
                    className={`bg-white rounded-3xl p-6 border shadow-sm transition-all space-y-4 ${
                      r.prioridade === "URGENTE"
                        ? "border-red-200 bg-red-50/20"
                        : r.prioridade === "IMPORTANTE"
                        ? "border-amber-200 bg-amber-50/20"
                        : "border-gray-100"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase ${
                            r.prioridade === "URGENTE"
                              ? "bg-red-100 text-red-800"
                              : r.prioridade === "IMPORTANTE"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {r.prioridade === "URGENTE"
                            ? "🔴 URGENTE"
                            : r.prioridade === "IMPORTANTE"
                            ? "🟡 IMPORTANTE"
                            : "🟢 NORMAL"}
                        </span>
                        <span className="text-xs bg-blue-50 text-blue-800 font-bold px-3 py-1 rounded-full">
                          🕒 {r.turno}
                        </span>
                        <span className="text-xs bg-purple-50 text-purple-800 font-bold px-3 py-1 rounded-full">
                          📋 {r.assunto}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        Registrado em {r.criado_em} por <strong>{r.porteiro_nome}</strong>
                      </span>
                    </div>

                    <p className="text-sm text-[#0A2540] font-medium leading-relaxed bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                      {r.descricao}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-400">
                          Ciente ({r.lido_por.length}):
                        </span>
                        {r.lido_por.map((nome, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200/50"
                          >
                            ✓ {nome}
                          </span>
                        ))}
                      </div>

                      {!jaLeu ? (
                        <button
                          onClick={() => marcarComoCiente(r.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          ✓ Confirmar Leitura / Estou Ciente
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700">
                          ✓ Você já confirmou ciência
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== ABA VISITANTES & QR CODE ==================== */}
      {abaAtiva === "VISITANTES" && (
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-3xl p-6 border border-gray-100 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[#0A2540]">Digitar Código de Liberação</h2>
              <p className="text-xs text-gray-500 mt-1">
                Peça o código de 6 dígitos que o morador recebeu — mais simples que escanear o QR Code
              </p>
            </div>

            {resultadoScan && (
              <div
                className={`p-4 rounded-2xl text-sm font-bold ${
                  resultadoScan.tipo === "sucesso"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {resultadoScan.mensagem}
              </div>
            )}

            <form onSubmit={liberarComCodigoDigitado} className="flex gap-2">
              <input
                value={codigoDigitado}
                onChange={(e) => setCodigoDigitado(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Ex: 042817"
                inputMode="numeric"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={validandoCodigoDigitado || !codigoDigitado.trim()}
                className="bg-[#0A2540] hover:bg-[#0A2540]/90 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer"
              >
                {validandoCodigoDigitado ? "..." : "Liberar"}
              </button>
            </form>
          </div>

          <div className="bg-white shadow-sm rounded-3xl p-6 border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0A2540]">Ou Escanear QR Code</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Aponte a câmera para o QR gerado pelo morador em 24h
                </p>
              </div>
              <button
                onClick={() => {
                  setScannerAtivo(!scannerAtivo);
                  setResultadoScan(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                {scannerAtivo ? "Parar Câmera" : "Ativar Câmera"}
              </button>
            </div>

            {scannerAtivo && <div id="leitor-qr" className="rounded-2xl overflow-hidden" />}
          </div>

          <div className="bg-white shadow-sm rounded-3xl p-6 border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0A2540]">Registros Manuais de Visitantes</h2>
              </div>
              <button
                onClick={() => setModalAberto(true)}
                className="bg-[#0A2540] hover:bg-[#0A2540]/90 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                + Registrar Entrada
              </button>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                  <th className="py-3 px-2">Nome</th>
                  <th className="py-3 px-2">Unidade</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {visitantes.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 text-sm">
                    <td className="py-3 px-2 font-semibold text-[#0A2540]">{v.nome}</td>
                    <td className="py-3 px-2 text-gray-600">{v.unidade_destino}</td>
                    <td className="py-3 px-2">
                      <span className="font-bold text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== MODAL ACIONAR PÂNICO ==================== */}
      {modalPanicoAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl space-y-5 w-full max-w-lg relative border-2 border-red-500">
            <button
              onClick={() => setModalPanicoAberto(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <span className="text-4xl">🚨</span>
              <h3 className="font-extrabold text-2xl text-red-600">ACIONAR BOTÃO DE PÂNICO</h3>
              <p className="text-xs text-gray-600">
                O alerta será disparado instantaneamente no banco e notificará a Administração!
              </p>
            </div>

            {/* BOTÃO DE 1 CLIQUE IMEDIATO */}
            <button
              onClick={() => acionarBotaoPanico("🆘 ALERTA GERAL DE PÂNICO IMEDIATO")}
              disabled={acionandoPanico}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl shadow-lg text-base uppercase tracking-wider transition-all cursor-pointer animate-pulse"
            >
              {acionandoPanico ? "DISPARANDO ALERTA..." : "⚡ DISPARAR PÂNICO IMEDIATO AGORA"}
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200" />
              <span className="flex-shrink mx-3 text-xs font-bold text-gray-400 uppercase">
                Ou selecione o tipo de emergência
              </span>
              <div className="flex-grow border-t border-gray-200" />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Tipo de Ocorrência Grave
                </label>
                <select
                  value={tipoPanico}
                  onChange={(e) => setTipoPanico(e.target.value)}
                  className="border border-gray-300 p-3 rounded-xl w-full text-sm font-bold text-[#0A2540] focus:outline-none focus:border-red-500"
                >
                  <option value="🚨 INVASÃO / TENTATIVA DE ARROMBAMENTO">
                    🚨 INVASÃO / TENTATIVA DE ARROMBAMENTO
                  </option>
                  <option value="🔥 INCÊNDIO / EMERGÊNCIA MÉDICA">
                    🔥 INCÊNDIO / EMERGÊNCIA MÉDICA
                  </option>
                  <option value="⚠️ CONFUSÃO / EMERGÊNCIA DE SEGURANÇA">
                    ⚠️ CONFUSÃO / EMERGÊNCIA DE SEGURANÇA
                  </option>
                  <option value="🆘 ALERTA GERAL DE PÂNICO">🆘 ALERTA GERAL DE PÂNICO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Observação / Localização (Opcional)
                </label>
                <input
                  value={obsPanico}
                  onChange={(e) => setObsPanico(e.target.value)}
                  placeholder="Ex: Pessoas suspeitas próximas ao portão da garagem 2"
                  className="border border-gray-300 p-3 rounded-xl w-full text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                onClick={() => acionarBotaoPanico()}
                disabled={acionandoPanico}
                className="w-full bg-[#0A2540] hover:bg-[#0A2540]/90 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all cursor-pointer"
              >
                Registrar Ocorrência Específica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Turno */}
      {modalTurnoAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={registrarNovoTurno}
            className="bg-white p-6 rounded-3xl shadow-2xl space-y-4 w-full max-w-lg relative border border-gray-100"
          >
            <button
              type="button"
              onClick={() => setModalTurnoAberto(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>
            <h3 className="font-bold text-xl text-[#0A2540]">Passar Plantão / Novo Registro</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Turno do Registro
                </label>
                <select
                  value={novoTurno}
                  onChange={(e) => setNovoTurno(e.target.value)}
                  className="border border-gray-200 p-3 rounded-xl w-full text-sm font-semibold"
                >
                  <option value="MANHÃ (06h - 14h)">MANHÃ (06h - 14h)</option>
                  <option value="TARDE (14h - 22h)">TARDE (14h - 22h)</option>
                  <option value="NOITE (22h - 06h)">NOITE (22h - 06h)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Prioridade</label>
                <select
                  value={novaPrioridade}
                  onChange={(e) =>
                    setNovaPrioridade(e.target.value as "NORMAL" | "IMPORTANTE" | "URGENTE")
                  }
                  className="border border-gray-200 p-3 rounded-xl w-full text-sm font-semibold"
                >
                  <option value="NORMAL">🟢 Normal</option>
                  <option value="IMPORTANTE">🟡 Importante</option>
                  <option value="URGENTE">🔴 Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição</label>
              <textarea
                rows={4}
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                className="border border-gray-200 p-3 rounded-xl w-full text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={salvandoTurno}
              className="w-full bg-[#0A2540] text-white py-3 rounded-xl font-semibold text-sm"
            >
              {salvandoTurno ? "Salvando..." : "Publicar no Livro de Turno"}
            </button>
          </form>
        </div>
      )}

      {/* Modal Visitante Manual */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={registrarEntrada}
            className="bg-white p-6 rounded-3xl shadow-2xl space-y-4 w-full max-w-md relative border border-gray-100"
          >
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>
            <h3 className="font-bold text-xl text-[#0A2540]">Registrar Entrada</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Nome do Visitante
              </label>
              <input
                placeholder="Ex: Carlos Eduardo"
                className="border border-gray-200 p-3 rounded-xl w-full text-sm"
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Unidade</label>
              <input
                placeholder="Ex: Apto 402"
                className="border border-gray-200 p-3 rounded-xl w-full text-sm"
                onChange={(e) => setUnidade(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="w-full bg-[#0A2540] text-white py-3 rounded-xl font-semibold text-sm">
              Confirmar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
