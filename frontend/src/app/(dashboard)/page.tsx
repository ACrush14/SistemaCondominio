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

interface EnqueteDashboard {
  id: number;
  titulo: string;
  descricao: string;
  opcoes: string[];
  status: "ATIVA" | "ENCERRADA";
  criada_por: string;
  data: string;
  total_votos: number;
  votos_por_opcao: number[];
}

export default function PainelSindicoPage() {
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaDashboard[]>([]);
  const [totalMoradores, setTotalMoradores] = useState<number | null>(null);
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [enquetes, setEnquetes] = useState<EnqueteDashboard[]>([]);
  const [alertasPanico, setAlertasPanico] = useState<{ id: number; porteiro_nome: string; tipo_emergencia: string; criado_em: string; status: string }[]>([]);

  const carregarEnquetes = () => {
    fetch("/api/condominio/enquetes")
      .then((res) => res.json())
      .then((data) => setEnquetes(data))
      .catch((err) => {
        console.error("Erro ao carregar enquetes:", err);
        setMensagemErro("Não foi possível carregar as enquetes.");
      });
  };

  const carregarPanico = () => {
    fetch("/api/condominio/panico")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.alertas) {
          setAlertasPanico(data.alertas.filter((a: any) => a.status === "ATIVO"));
        }
      })
      .catch((err) => {
        console.error("Erro ao verificar status de pânico:", err);
      });
  };

  useEffect(() => {
    fetch("/api/condominio/ocorrencias")
      .then((res) => res.json())
      .then((data) => {
        const lista = Array.isArray(data) ? data : data.registros || data.ocorrencias || [];
        setOcorrencias(lista);
      })
      .catch((err) => {
        console.error("Erro ao carregar ocorrências:", err);
        setMensagemErro("Não foi possível carregar as ocorrências.");
      });

    fetch("/api/usuarios")
      .then((res) => res.json())
      .then((data: unknown) => {
        const lista = Array.isArray(data) ? data : (data && typeof data === "object" && ("registros" in data || "usuarios" in data) ? (data as any).registros || (data as any).usuarios : []);
        if (Array.isArray(lista)) {
          setTotalMoradores(lista.filter((u: { perfil: string }) => u.perfil === "MORADOR").length);
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar usuários:", err);
        setMensagemErro("Não foi possível carregar o total de moradores.");
      });

    fetch("/api/condominio/comunicados")
      .then((res) => res.json())
      .then((data) => setComunicados(data))
      .catch((err) => {
        console.error("Erro ao carregar comunicados:", err);
        setMensagemErro("Não foi possível carregar os comunicados.");
      });

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setMeusCondominios(Array.isArray(data.condominios) ? data.condominios : [data.condominio_id ?? 1]);
        setCondominioIdReal(data.condominio_id ?? 1);
      })
      .catch((err) => {
        console.error("Erro na autenticação inicial (/api/auth/me):", err);
      });

    carregarEnquetes();
    carregarPanico();
    carregarCondominios();

    let intPanico: NodeJS.Timeout | null = null;

    const iniciarIntervalo = () => {
      if (!intPanico && !document.hidden) {
        intPanico = setInterval(() => {
          if (!document.hidden) {
            carregarPanico();
          }
        }, 5000);
      }
    };

    const pararIntervalo = () => {
      if (intPanico) {
        clearInterval(intPanico);
        intPanico = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pararIntervalo();
      } else {
        carregarPanico();
        iniciarIntervalo();
      }
    };

    iniciarIntervalo();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      pararIntervalo();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const [perguntaIa, setPerguntaIa] = useState("");
  const [respostaIa, setRespostaIa] = useState("");
  const [carregandoIa, setCarregandoIa] = useState(false);

  // Modal Novo Comunicado
  const [modalComunicado, setModalComunicado] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoConteudo, setNovoConteudo] = useState("");
  const [mensagemAviso, setMensagemAviso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  // Modal Nova Enquete
  const [modalEnquete, setModalEnquete] = useState(false);
  const [enqueteTitulo, setEnqueteTitulo] = useState("");
  const [enqueteDescricao, setEnqueteDescricao] = useState("");
  const [enqueteOpcoes, setEnqueteOpcoes] = useState<string[]>([
    "Aprovar Proposta",
    "Não Aprovar",
  ]);

  // Modal Central de Notificações E-mail & WhatsApp
  const [modalNotificacao, setModalNotificacao] = useState(false);
  const [notificacoesLog, setNotificacoesLog] = useState<Array<{ id: number; destinatario_nome: string; canal: string; contato: string; assunto: string; mensagem: string; status: string; enviado_em: string }>>([]);
  const [notificacoesTotal, setNotificacoesTotal] = useState(0);
  const [notificacoesCarregandoMais, setNotificacoesCarregandoMais] = useState(false);
  const [notifDestinatario, setNotifDestinatario] = useState("João (Morador Tailson)");
  const [notifUnidade, setNotifUnidade] = useState("Apto 301");
  const [notifCanal, setNotifCanal] = useState<"EMAIL" | "WHATSAPP" | "AMBOS">("AMBOS");
  const [notifContato, setNotifContato] = useState("joao@tailson.com | +55 11 98888-7777");
  const [notifAssunto, setNotifAssunto] = useState("📢 Aviso Urgente do Condomínio");
  const [notifMensagem, setNotifMensagem] = useState("");
  const [enviandoNotif, setEnviandoNotif] = useState(false);

  const carregarNotificacoes = (offset = 0, append = false) => {
    if (offset > 0) setNotificacoesCarregandoMais(true);
    fetch(`/api/condominio/notificacoes?limite=10&offset=${offset}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.notificacoes)) {
          setNotificacoesLog((prev) => (append ? [...prev, ...data.notificacoes] : data.notificacoes));
          if (typeof data.total === "number") setNotificacoesTotal(data.total);
        } else if (Array.isArray(data)) {
          setNotificacoesLog((prev) => (append ? [...prev, ...data] : data));
          setNotificacoesTotal((prev) => (append ? prev + data.length : data.length));
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar notificações:", err);
        setMensagemErro("Falha ao carregar central de notificações.");
      })
      .finally(() => {
        setNotificacoesCarregandoMais(false);
      });
  };

  const carregarMaisNotificacoes = () => {
    carregarNotificacoes(notificacoesLog.length, true);
  };

  // SaaS Multi-Tenant Condomínios / Prédios
  type CondominioItem = { id: number; nome: string; slug: string; cnpj: string; endereco: string; total_unidades: number; plano: string };
  const [condominios, setCondominios] = useState<CondominioItem[]>([]);
  const [condominioAtivo, setCondominioAtivo] = useState<{ id: number; nome: string; slug: string; plano: string }>({
    id: 1,
    nome: "Condomínio Tailson Executive",
    slug: "tailson-executive",
    plano: "ENTERPRISE",
  });
  const [modalSaas, setModalSaas] = useState(false);
  const [meusCondominios, setMeusCondominios] = useState<number[]>([]);
  const [trocandoCondominio, setTrocandoCondominio] = useState(false);
  const [condominioIdReal, setCondominioIdReal] = useState<number | null>(null);
  const [novoPredioNome, setNovoPredioNome] = useState("");
  const [novoPredioCnpj, setNovoPredioCnpj] = useState("");
  const [novoPredioEndereco, setNovoPredioEndereco] = useState("");
  const [novoPredioUnidades, setNovoPredioUnidades] = useState<number | string>("150");
  const [novoPredioPlano, setNovoPredioPlano] = useState("ENTERPRISE");
  const [criandoPredio, setCriandoPredio] = useState(false);
  const [predioEmEdicao, setPredioEmEdicao] = useState<CondominioItem | null>(null);
  const [excluindoPredioId, setExcluindoPredioId] = useState<number | null>(null);

  const carregarCondominios = () => {
    fetch("/api/condominios")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCondominios(data);
          if (data.length > 0 && !condominioAtivo.id) {
            setCondominioAtivo(data[0]);
          }
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar condomínios:", err);
        setMensagemErro("Não foi possível carregar a lista de condomínios.");
      });
  };

  // Assim que sabemos o condomínio EFETIVO (via /api/auth/me) e a lista completa,
  // sincroniza o card exibido como "ativo" com a realidade — não com um palpite local.
  useEffect(() => {
    if (condominioIdReal === null || condominios.length === 0) return;
    const real = condominios.find((c) => c.id === condominioIdReal);
    if (real) setCondominioAtivo(real);
  }, [condominioIdReal, condominios]);


  const enviarNotificacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifMensagem.trim()) return;
    setEnviandoNotif(true);
    try {
      const res = await fetch("/api/condominio/notificacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinatario_nome: notifDestinatario,
          unidade: notifUnidade,
          canal: notifCanal,
          contato: notifContato,
          assunto: notifAssunto,
          mensagem: notifMensagem,
          tipo_evento: "COMUNICADO",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotificacoesLog(data.notificacoes || []);
        if (typeof data.total === "number") {
          setNotificacoesTotal(data.total);
        } else {
          setNotificacoesTotal((data.notificacoes || []).length);
        }
        setNotifMensagem("");
        setMensagemAviso(`Notificação enviada via ${notifCanal}!`);
      }
    } finally {
      setEnviandoNotif(false);
    }
  };


  const publicarEnquete = async (e: React.FormEvent) => {
    e.preventDefault();
    const opcoesValidas = enqueteOpcoes.map((o) => o.trim()).filter(Boolean);
    if (!enqueteTitulo.trim() || opcoesValidas.length < 2) {
      setMensagemAviso("Preencha o título e pelo menos 2 opções.");
      return;
    }
    try {
      await fetch("/api/condominio/enquetes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: enqueteTitulo,
          descricao: enqueteDescricao,
          opcoes: opcoesValidas,
        }),
      });
      setModalEnquete(false);
      setEnqueteTitulo("");
      setEnqueteDescricao("");
      setEnqueteOpcoes(["Aprovar Proposta", "Não Aprovar"]);
      setMensagemAviso("Enquete criada e aberta para votação dos moradores!");
      carregarEnquetes();
    } catch (_err) {
      setMensagemAviso("Erro ao criar enquete.");
    }
  };

  const alterarStatusEnquete = async (id: number, statusAtual: string) => {
    const novoStatus = statusAtual === "ATIVA" ? "ENCERRADA" : "ATIVA";
    await fetch(`/api/condominio/enquetes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    setEnquetes(
      enquetes.map((e) =>
        e.id === id ? { ...e, status: novoStatus as any } : e
      )
    );
    setMensagemAviso(
      novoStatus === "ENCERRADA"
        ? "Votação encerrada."
        : "Votação reaberta aos moradores."
    );
  };

  const excluirEnquete = async (id: number) => {
    await fetch(`/api/condominio/enquetes/${id}`, { method: "DELETE" });
    setEnquetes(enquetes.filter((e) => e.id !== id));
    setMensagemAviso("Enquete excluída com sucesso.");
  };

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
      const res = await fetch("/api/condominio/ia-sindico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: perguntaIa }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRespostaIa("Não foi possível consultar a IA agora: " + (data.erro || "erro desconhecido"));
      } else {
        setRespostaIa(data.resposta_ia);
      }
    } catch (_err) {
      setRespostaIa("Não foi possível consultar a IA agora. Verifique sua conexão e tente novamente.");
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
      {alertasPanico.length > 0 && (
        <div className="bg-red-600 text-white p-5 rounded-3xl shadow-2xl border-4 border-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🚨</span>
            <div>
              <p className="font-extrabold text-xl uppercase tracking-wider">
                ALERTA MÁXIMO DE EMERGÊNCIA — PORTARIA ACIONOU PÂNICO!
              </p>
              <p className="text-sm text-red-100 font-bold mt-0.5">
                {alertasPanico[0].tipo_emergencia} — Acionado por <strong>{alertasPanico[0].porteiro_nome}</strong> em {alertasPanico[0].criado_em}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              await fetch(`/api/condominio/panico/${alertasPanico[0].id}/resolver`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resolvido_por: "Anderson de Lima (Síndico)" }),
              });
              carregarPanico();
            }}
            className="bg-white text-red-700 hover:bg-red-50 font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-lg transition-all shrink-0 cursor-pointer"
          >
            ✓ Confirmar Atendimento / Resolver Alerta
          </button>
        </div>
      )}

      {/* Cabeçalho do Síndico */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0A2540] dark:bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            AL
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-[#0A2540] dark:text-white">
                Dashboard do Síndico
              </h1>
              <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-2.5 py-1 rounded-full">
                SÍNDICO
              </span>
              <button
                onClick={() => setModalSaas(true)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              >
                <span>🏢</span>
                <span>{condominioAtivo.nome || "Condomínio Tailson Executive"}</span>
                <span className="text-[10px] ml-1">▼</span>
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Gestão Executiva SaaS • <strong>Anderson de Lima</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              carregarCondominios();
              setModalSaas(true);
            }}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span>🏢</span> Prédios SaaS
          </button>
          <button
            onClick={() => {
              carregarNotificacoes();
              setModalNotificacao(true);
            }}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span>📲</span> E-mail & WhatsApp
          </button>
          <button
            onClick={() => setModalEnquete(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span>📊</span> + Nova Enquete
          </button>
          <button
            onClick={() => setModalComunicado(true)}
            className="px-5 py-2.5 bg-[#0A2540] dark:bg-blue-600 hover:bg-[#0A2540]/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span>📢</span> + Novo Comunicado
          </button>
        </div>
      </div>

      {mensagemErro && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-sm font-medium flex justify-between items-center">
          <span>⚠️ {mensagemErro}</span>
          <button onClick={() => setMensagemErro("")} aria-label="Fechar alerta de erro" className="font-bold">✕</button>
        </div>
      )}

      {mensagemAviso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-sm font-medium flex justify-between items-center">
          <span>✅ {mensagemAviso}</span>
          <button onClick={() => setMensagemAviso("")} aria-label="Fechar alerta de aviso" className="font-bold">✕</button>
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

          {/* Gestão de Enquetes & Votações do Condomínio */}
          <div className="bg-white dark:bg-[#162238] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#0A2540] dark:text-white flex items-center gap-2">
                  <span>📊</span> Enquetes & Votações em Tempo Real
                </h2>
                <p className="text-xs text-gray-500">
                  Consulte os resultados e gerencie votações do condomínio
                </p>
              </div>
              <button
                onClick={() => setModalEnquete(true)}
                className="text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3.5 py-1.5 rounded-xl transition-colors"
              >
                + NOVA ENQUETE
              </button>
            </div>

            <div className="space-y-5">
              {enquetes.map((e) => (
                <div
                  key={e.id}
                  className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-4 bg-gray-50/50 dark:bg-[#111a2e]"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase ${
                        e.status === "ATIVA"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {e.status === "ATIVA" ? "🟢 EM VOTAÇÃO" : "🔒 ENCERRADA"}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      Criada em {e.data} • {e.total_votos} voto(s) registrado(s)
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-[#0A2540] dark:text-white">
                      {e.titulo}
                    </h3>
                    {e.descricao && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {e.descricao}
                      </p>
                    )}
                  </div>

                  {/* Barras de Progresso e Opções */}
                  <div className="space-y-3 pt-1">
                    {e.opcoes.map((opcao, idx) => {
                      const votos = e.votos_por_opcao[idx] || 0;
                      const pct =
                        e.total_votos > 0
                          ? Math.round((votos / e.total_votos) * 100)
                          : 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-[#0A2540] dark:text-gray-200">
                              {opcao}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {votos} voto(s) ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                    <button
                      onClick={() => alterarStatusEnquete(e.id, e.status)}
                      className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors"
                    >
                      {e.status === "ATIVA"
                        ? "🔒 Encerrar Votação"
                        : "🔓 Reabrir Votação"}
                    </button>
                    <button
                      onClick={() => excluirEnquete(e.id)}
                      className="px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      🗑 Excluir
                    </button>
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
              aria-label="Fechar modal de comunicado"
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

      {/* Modal Nova Enquete */}
      {modalEnquete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={publicarEnquete}
            className="bg-white dark:bg-[#162238] p-6 rounded-3xl shadow-2xl space-y-4 w-full max-w-lg relative border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setModalEnquete(false)}
              aria-label="Fechar modal de enquete"
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-sm transition-colors"
            >
              ✕
            </button>
            <div>
              <h3 className="font-bold text-xl text-[#0A2540] dark:text-white flex items-center gap-2">
                <span>📊</span> Criar Nova Enquete
              </h3>
              <p className="text-xs text-gray-500">
                Abra uma votação oficial para todos os moradores participarem
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Título da Enquete *
              </label>
              <input
                required
                placeholder="Ex: Instalação de câmeras no parquinho"
                value={enqueteTitulo}
                onChange={(e) => setEnqueteTitulo(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Descrição / Contexto (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Explicação detalhada sobre o tema em votação..."
                value={enqueteDescricao}
                onChange={(e) => setEnqueteDescricao(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Opções de Voto * (Mínimo 2)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setEnqueteOpcoes([
                      ...enqueteOpcoes,
                      `Opção ${enqueteOpcoes.length + 1}`,
                    ])
                  }
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  + ADICIONAR OPÇÃO
                </button>
              </div>
              <div className="space-y-2">
                {enqueteOpcoes.map((op, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      required
                      value={op}
                      onChange={(e) => {
                        const nov = [...enqueteOpcoes];
                        nov[idx] = e.target.value;
                        setEnqueteOpcoes(nov);
                      }}
                      placeholder={`Opção ${idx + 1}`}
                      className="flex-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111a2e] text-sm focus:outline-none focus:border-blue-500"
                    />
                    {enqueteOpcoes.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setEnqueteOpcoes(
                            enqueteOpcoes.filter((_, i) => i !== idx)
                          )
                        }
                        aria-label={`Remover opção ${idx + 1}`}
                        className="px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-sm"
              >
                Abrir Votação
              </button>
              <button
                type="button"
                onClick={() => setModalEnquete(false)}
                className="px-5 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Central de Notificações E-mail & WhatsApp */}
      {modalNotificacao && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#152033] p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 w-full max-w-4xl relative border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalNotificacao(false)}
              aria-label="Fechar central de notificações"
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            <div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                Módulo de Comunicação Direta
              </span>
              <h3 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">
                📲 Central de Notificações (E-mail & WhatsApp)
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Dispare avisos instantâneos e acompanhe o histórico real de envios no PostgreSQL.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Formulário de Disparo */}
              <form onSubmit={enviarNotificacao} className="space-y-4 bg-gray-50 dark:bg-[#111a2e] p-5 rounded-2xl border border-gray-200/60 dark:border-gray-800">
                <h4 className="font-bold text-sm text-[#0A2540] dark:text-white">✉️ Disparar Nova Notificação</h4>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Canal de Envio
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(["EMAIL", "WHATSAPP", "AMBOS"] as const).map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setNotifCanal(c)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          notifCanal === c
                            ? "bg-purple-600 text-white shadow-sm"
                            : "bg-white dark:bg-[#152033] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        {c === "EMAIL" ? "📧 E-mail" : c === "WHATSAPP" ? "💬 WhatsApp" : "📲 Ambos"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Destinatário</label>
                    <input
                      value={notifDestinatario}
                      onChange={(e) => setNotifDestinatario(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#152033] text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Unidade</label>
                    <input
                      value={notifUnidade}
                      onChange={(e) => setNotifUnidade(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#152033] text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">E-mail / WhatsApp</label>
                  <input
                    value={notifContato}
                    onChange={(e) => setNotifContato(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#152033] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Assunto</label>
                  <input
                    value={notifAssunto}
                    onChange={(e) => setNotifAssunto(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#152033] text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Mensagem</label>
                  <textarea
                    rows={3}
                    value={notifMensagem}
                    onChange={(e) => setNotifMensagem(e.target.value)}
                    placeholder="Ex: Informamos que a assembleia geral foi reagendada para o dia 20 às 19h..."
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#152033] text-xs"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={enviandoNotif}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  {enviandoNotif ? "Disparando..." : "⚡ Disparar Notificação Agora"}
                </button>
              </form>

              {/* Log de Auditoria no Banco */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-[#0A2540] dark:text-white flex items-center justify-between">
                  <span>📜 Log de Envios (PostgreSQL)</span>
                  <span className="text-xs bg-purple-100 text-purple-800 font-extrabold px-2.5 py-0.5 rounded-full">
                    {notificacoesLog.length} de {notificacoesTotal || notificacoesLog.length} registros
                  </span>
                </h4>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {notificacoesLog.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111a2e] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-[#0A2540] dark:text-white">
                          {n.assunto}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            n.canal === "EMAIL"
                              ? "bg-blue-100 text-blue-800"
                              : n.canal === "WHATSAPP"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {n.canal === "EMAIL"
                            ? "📧 E-MAIL"
                            : n.canal === "WHATSAPP"
                            ? "💬 WHATSAPP"
                            : "📲 AMBOS"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                        {n.mensagem}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
                        <span>Para: <strong>{n.destinatario_nome}</strong></span>
                        <span>Enviado em: {n.enviado_em}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {notificacoesTotal > notificacoesLog.length && (
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={carregarMaisNotificacoes}
                      disabled={notificacoesCarregandoMais}
                      className="cursor-pointer px-4 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl font-bold text-xs transition disabled:opacity-50 flex items-center gap-2 border border-purple-200 dark:border-purple-800/50"
                    >
                      {notificacoesCarregandoMais ? (
                        <>
                          <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full"></span>
                          Carregando...
                        </>
                      ) : (
                        `➕ Carregar mais (${notificacoesTotal - notificacoesLog.length} restantes)`
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Módulo Multi-Condomínio SaaS */}
      {modalSaas && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#152033] p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 w-full max-w-4xl relative border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalSaas(false)}
              aria-label="Fechar modal de condomínios SaaS"
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Arquitetura SaaS Multi-Tenant
              </span>
              <h3 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">
                🏢 Selecionar ou Cadastrar Condomínio / Prédio
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Alterne o prédio ativo ou adicione novos condomínios com isolamento de dados no PostgreSQL.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lista de Condomínios e Seleção */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-[#0A2540] dark:text-white">
                  🏢 Prédios Cadastrados (Selecione para Ativar)
                </h4>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
  {condominios.map((c) => {
                    const isAtivo = (condominioIdReal ?? condominioAtivo.id) === c.id;
                    const temAcesso = meusCondominios.includes(c.id);
                    const isEdicaoAtual = predioEmEdicao?.id === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={async () => {
                          if (!temAcesso) {
                            setMensagemAviso(
                              "Sua conta não tem acesso a este condomínio — fale com quem administra a plataforma pra vincular seu usuário a ele."
                            );
                            return;
                          }
                          if (isAtivo || trocandoCondominio) return;
                          setTrocandoCondominio(true);
                          try {
                            const res = await fetch("/api/auth/selecionar-condominio", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ condominio_id: c.id }),
                            });
                            const data = await res.json();
                            if (!res.ok) {
                              setMensagemAviso(data.erro || "Erro ao trocar de condomínio.");
                              setTrocandoCondominio(false);
                              return;
                            }
                            window.location.reload();
                          } catch (_err) {
                            setMensagemAviso("Erro ao trocar de condomínio.");
                            setTrocandoCondominio(false);
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-all relative ${
                          temAcesso ? "cursor-pointer" : "cursor-not-allowed opacity-80"
                        } ${
                          isAtivo
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm"
                            : isEdicaoAtual
                            ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-400"
                            : "bg-white dark:bg-[#111a2e] border-gray-200 dark:border-gray-800 hover:border-amber-400"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-sm text-[#0A2540] dark:text-white flex items-center gap-1.5">
                            {c.nome}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                              {c.plano}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPredioEmEdicao(c);
                                setNovoPredioNome(c.nome);
                                setNovoPredioCnpj(c.cnpj || "");
                                setNovoPredioEndereco(c.endereco || "");
                                setNovoPredioUnidades(c.total_unidades || 100);
                                setNovoPredioPlano(c.plano || "ENTERPRISE");
                              }}
                              className="p-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs transition cursor-pointer"
                              title="Editar Prédio"
                            >
                              ✏️
                            </button>
                            {c.id !== 1 && (
                              <button
                                type="button"
                                disabled={excluindoPredioId === c.id}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm(`Tem certeza que deseja excluir o prédio "${c.nome}"?`)) return;
                                  setExcluindoPredioId(c.id);
                                  try {
                                    const res = await fetch(`/api/condominios/${c.id}`, {
                                      method: "DELETE",
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                      setCondominios(data.condominios || []);
                                      if (predioEmEdicao?.id === c.id) {
                                        setPredioEmEdicao(null);
                                        setNovoPredioNome("");
                                        setNovoPredioCnpj("");
                                        setNovoPredioEndereco("");
                                      }
                                      setMensagemAviso(`Prédio "${c.nome}" excluído com sucesso!`);
                                    } else {
                                      setMensagemAviso(data.erro || "Erro ao excluir prédio.");
                                    }
                                  } catch (_err) {
                                    setMensagemAviso("Falha de rede ao excluir prédio.");
                                  } finally {
                                    setExcluindoPredioId(null);
                                  }
                                }}
                                className="p-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs transition cursor-pointer disabled:opacity-50"
                                title="Excluir Prédio"
                              >
                                {excluindoPredioId === c.id ? "⏳" : "🗑️"}
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {c.endereco || "Endereço não informado"} • CNPJ: {c.cnpj || "N/A"}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                          <span className="text-gray-400">Total: {c.total_unidades} unidades</span>
                          {isAtivo ? (
                            <span className="text-amber-700 dark:text-amber-400 font-extrabold">
                              ✓ ATIVO AGORA
                            </span>
                          ) : temAcesso ? (
                            <span className="text-blue-600 font-bold">Clique para Ativar →</span>
                          ) : (
                            <span className="text-gray-400 font-bold">Sem acesso</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cadastrar ou Editar Prédio no SaaS */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!novoPredioNome.trim()) return;
                  setCriandoPredio(true);
                  try {
                    const url = predioEmEdicao
                      ? `/api/condominios/${predioEmEdicao.id}`
                      : "/api/condominios";
                    const method = predioEmEdicao ? "PATCH" : "POST";

                    const res = await fetch(url, {
                      method,
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        nome: novoPredioNome,
                        cnpj: novoPredioCnpj,
                        endereco: novoPredioEndereco,
                        total_unidades: Number(novoPredioUnidades) || 100,
                        plano: novoPredioPlano,
                      }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setCondominios(data.condominios || []);
                      if (data.condominio && (!condominioAtivo.id || predioEmEdicao?.id === condominioAtivo.id)) {
                        setCondominioAtivo(data.condominio);
                      }
                      const msg = predioEmEdicao
                        ? `Prédio "${data.condominio.nome}" atualizado com sucesso!`
                        : `Novo prédio "${data.condominio.nome}" cadastrado com sucesso!`;
                      setPredioEmEdicao(null);
                      setNovoPredioNome("");
                      setNovoPredioCnpj("");
                      setNovoPredioEndereco("");
                      setNovoPredioUnidades("150");
                      setNovoPredioPlano("ENTERPRISE");
                      setMensagemAviso(msg);
                    } else {
                      setMensagemAviso(data.erro || "Erro ao salvar prédio.");
                    }
                  } catch (_err) {
                    setMensagemAviso("Falha na comunicação ao salvar prédio.");
                  } finally {
                    setCriandoPredio(false);
                  }
                }}
                className="space-y-4 bg-gray-50 dark:bg-[#111a2e] p-5 rounded-2xl border border-gray-200/60 dark:border-gray-800 relative"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#0A2540] dark:text-white flex items-center gap-1.5">
                    {predioEmEdicao ? `✏️ Editar: ${predioEmEdicao.nome}` : "➕ Cadastrar Novo Prédio / Condomínio (SaaS)"}
                  </h4>
                  {predioEmEdicao && (
                    <button
                      type="button"
                      onClick={() => {
                        setPredioEmEdicao(null);
                        setNovoPredioNome("");
                        setNovoPredioCnpj("");
                        setNovoPredioEndereco("");
                        setNovoPredioUnidades("150");
                        setNovoPredioPlano("ENTERPRISE");
                      }}
                      className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition cursor-pointer"
                    >
                      ✕ Cancelar Edição
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Nome do Condomínio / Prédio
                  </label>
                  <input
                    value={novoPredioNome}
                    onChange={(e) => setNovoPredioNome(e.target.value)}
                    placeholder="Ex: Condomínio Grand Plaza"
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#152033] text-xs font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                      CNPJ
                    </label>
                    <input
                      value={novoPredioCnpj}
                      onChange={(e) => setNovoPredioCnpj(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#152033] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                      Plano SaaS
                    </label>
                    <select
                      value={novoPredioPlano}
                      onChange={(e) => setNovoPredioPlano(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#152033] text-xs font-semibold"
                    >
                      <option value="ENTERPRISE">ENTERPRISE</option>
                      <option value="EXECUTIVO">EXECUTIVO</option>
                      <option value="STANDARD">STANDARD</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                      Total de Unidades
                    </label>
                    <input
                      type="number"
                      value={novoPredioUnidades}
                      onChange={(e) => setNovoPredioUnidades(e.target.value)}
                      placeholder="Ex: 150"
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#152033] text-xs"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                      Endereço Completo
                    </label>
                    <input
                      value={novoPredioEndereco}
                      onChange={(e) => setNovoPredioEndereco(e.target.value)}
                      placeholder="Av. Paulista, 1000 - SP"
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#152033] text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={criandoPredio}
                  className={`w-full font-bold py-3 rounded-xl text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50 text-white ${
                    predioEmEdicao
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {criandoPredio
                    ? predioEmEdicao
                      ? "Salvando..."
                      : "Cadastrando..."
                    : predioEmEdicao
                    ? "💾 Salvar Alterações"
                    : "⚡ Cadastrar Prédio no Banco de Dados"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


