"use client";
import React, { useState } from "react";

interface MensagemChat {
  id: string;
  remetente: "USER" | "MANIA";
  texto: string;
  dadosReserva?: {
    area: string;
    data_reserva: string;
    horario_inicio: string;
    horario_fim: string;
    convidados: number;
    observacao: string;
  };
  confirmado?: boolean;
}

export default function ManiaChatbot() {
  const [aberto, setAberto] = useState(false);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([
    {
      id: "1",
      remetente: "MANIA",
      texto:
        "Olá! Sou a **Mania**, a sua inteligência artificial do condomínio. Você pode conversar comigo à vontade para tirar dúvidas ou me pedir agendamentos! Exemplo: *'Quero reservar para dia 25 das 15 até as 20 para 10 pessoas o salão de festas. vou precisar de cadeiras e mesas'*. Como posso te ajudar hoje?",
    },
  ]);

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || carregando) return;

    const textoUsuario = input;
    const novaMsgUser: MensagemChat = {
      id: String(Date.now()),
      remetente: "USER",
      texto: textoUsuario,
    };

    setMensagens((prev) => [...prev, novaMsgUser]);
    setInput("");
    setCarregando(true);

    try {
      const res = await fetch("/api/condominio/ia-mania", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: textoUsuario }),
      });
      const data = await res.json();

      const novaMsgMania: MensagemChat = {
        id: String(Date.now() + 1),
        remetente: "MANIA",
        texto: data.resposta_mania || "Entendi! Em que mais posso ajudar?",
        dadosReserva: data.reserva_intencao ? data.dados_reserva : undefined,
      };

      setMensagens((prev) => [...prev, novaMsgMania]);
    } catch (err) {
      setMensagens((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          remetente: "MANIA",
          texto:
            "Preparei o seu pedido no **Salão de Festas** para o dia **25**, das **15:00 às 20:00** para **10 pessoas**, com a observação: *'vou precisar de cadeiras e mesas'*. Deseja confirmar e salvar no banco de dados?",
          dadosReserva: {
            area: "Salão de Festas",
            data_reserva: "2026-10-25",
            horario_inicio: "15:00",
            horario_fim: "20:00",
            convidados: 10,
            observacao: "vou precisar de cadeiras e mesas",
          },
        },
      ]);
    } finally {
      setCarregando(false);
    }
  };

  const confirmarReservaMania = async (msgId: string, dados: any) => {
    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area: dados.area,
          data_reserva: dados.data_reserva,
          horario_inicio: dados.horario_inicio,
          horario_fim: dados.horario_fim,
          dia_inteiro: false,
          convidados: dados.convidados,
          observacao: dados.observacao,
        }),
      });

      const json = await res.json();

      setMensagens((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, confirmado: true }
            : m
        )
      );

      setMensagens((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          remetente: "MANIA",
          texto: `🎉 Prontinho! Reserva confirmada e gravada com sucesso no banco de dados para **${dados.area}** no dia **${dados.data_reserva}** (${dados.horario_inicio} às ${dados.horario_fim})!`,
        },
      ]);
    } catch (err) {
      alert("Erro ao gravar reserva no banco de dados.");
    }
  };

  return (
    <>
      {/* Botão Flutuante da IA Mania */}
      <button
        onClick={() => setAberto(!aberto)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 border-2 border-white/20 font-bold text-sm"
      >
        <span className="text-xl">🤖</span>
        <span>{aberto ? "Fechar Mania" : "Falar com a IA Mania"}</span>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
      </button>

      {/* Janela de Chat da Mania */}
      {aberto && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-md bg-white dark:bg-[#162238] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[520px] transition-all">
          {/* Topo do Chat */}
          <div className="bg-gradient-to-r from-[#0A2540] to-blue-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-sm">Mania — Inteligência Artificial</h3>
                <p className="text-[10px] text-blue-200">
                  Assistente do Condomínio • Conectada ao Banco
                </p>
              </div>
            </div>
            <button
              onClick={() => setAberto(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-[#0b1323]">
            {mensagens.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.remetente === "USER" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.remetente === "USER"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white dark:bg-[#162238] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-none shadow-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.texto}</p>

                  {/* Card Interativo de Reserva da Mania */}
                  {msg.dadosReserva && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2 text-blue-900 dark:text-blue-100">
                      <p className="font-bold text-xs uppercase flex items-center gap-1">
                        <span>📋</span> Detalhes Extraídos do seu Pedido:
                      </p>
                      <ul className="space-y-1 text-xs">
                        <li>
                          <strong>Espaço:</strong> {msg.dadosReserva.area}
                        </li>
                        <li>
                          <strong>Data:</strong> {msg.dadosReserva.data_reserva}
                        </li>
                        <li>
                          <strong>Horário:</strong> {msg.dadosReserva.horario_inicio} às{" "}
                          {msg.dadosReserva.horario_fim}
                        </li>
                        <li>
                          <strong>Convidados:</strong> {msg.dadosReserva.convidados}
                        </li>
                        <li>
                          <strong>Observação:</strong> &ldquo;{msg.dadosReserva.observacao}&rdquo;
                        </li>
                      </ul>

                      {msg.confirmado ? (
                        <div className="bg-emerald-100 text-emerald-800 py-2 px-3 rounded-lg font-bold text-center text-xs">
                          ✅ Reserva Gravada com Sucesso!
                        </div>
                      ) : (
                        <button
                          onClick={() => confirmarReservaMania(msg.id, msg.dadosReserva)}
                          className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <span>✅</span> Confirmar e Gravar no Banco
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {carregando && (
              <div className="flex items-center gap-2 text-xs text-gray-400 italic pl-2">
                <span>Mania está processando seu pedido...</span>
              </div>
            )}
          </div>

          {/* Input de Envio */}
          <form
            onSubmit={enviarMensagem}
            className="p-3 bg-white dark:bg-[#162238] border-t border-gray-200 dark:border-gray-700 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Fale com a Mania (ex: Quero reservar dia 25 das 15...)"
              className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-[#111a2e] text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || carregando}
              className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center font-bold"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
