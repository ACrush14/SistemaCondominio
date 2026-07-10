"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Reserva {
  id: string;
  area: string;
  data_reserva: string;
  nome: string;
}

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const router = useRouter();

  const [novaArea, setNovaArea] = useState("Churrasqueira");
  const [novaData, setNovaData] = useState("");
  const [erroModal, setErroModal] = useState("");
  const [salvando, setSalvando] = useState(false);

  const buscarReservas = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setCarregando(true);
      const resposta = await fetch("http://localhost:3333/api/reservas", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resposta.ok) {
        if (resposta.status === 401 || resposta.status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        throw new Error("Falha ao carregar reservas");
      }

      const dados = await resposta.json();
      setReservas(dados);
    } catch (err) {
      setErro("Não foi possível carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }, [router]);

  useEffect(() => {
    buscarReservas();
  }, [buscarReservas]);

  const criarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroModal("");
    setSalvando(true);

    try {
      const token = localStorage.getItem("token");
      const resposta = await fetch("http://localhost:3333/api/reservas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          area: novaArea,
          data_reserva: novaData,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErroModal(dados.erro || "Erro ao criar reserva.");
        setSalvando(false);
        return;
      }

      setNovaData("");
      setNovaArea("Churrasqueira");
      setModalAberto(false);
      setSalvando(false);
      buscarReservas();
    } catch (err) {
      setErroModal("Falha de comunicação com o servidor.");
      setSalvando(false);
    }
  };

  // Nova função de exclusão
  const cancelarReserva = async (id: string) => {
    // A barreira de proteção UX
    if (
      !window.confirm(
        "Atenção: Confirma o cancelamento desta reserva? Esta ação não pode ser desfeita.",
      )
    ) {
      return;
    }

    setErro(""); // Limpa erros antigos da tela

    try {
      const token = localStorage.getItem("token");
      const resposta = await fetch(`http://localhost:3333/api/reservas/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        setErro(
          dados.erro || "Falha ao tentar cancelar a reserva no servidor.",
        );
        return;
      }

      // Sucesso: atualiza a tabela imediatamente
      buscarReservas();
    } catch (err) {
      setErro("Falha de comunicação com o servidor ao cancelar.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark">
            Reservas de Áreas Comuns
          </h1>
          <p className="text-neutral mt-1">
            Gerencie e agende os espaços do condomínio.
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          + Nova Reserva
        </button>
      </div>

      {erro && (
        <div className="bg-tertiary/10 text-tertiary p-4 rounded-lg font-medium">
          {erro}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-neutral-light overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-light/50 border-b border-neutral-light text-neutral text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">Área</th>
              <th className="p-4 font-medium">Data</th>
              <th className="p-4 font-medium">Morador</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-light">
            {carregando ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral">
                  Carregando dados...
                </td>
              </tr>
            ) : reservas.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral">
                  Nenhuma reserva encontrada.
                </td>
              </tr>
            ) : (
              reservas.map((reserva) => (
                <tr
                  key={reserva.id}
                  className="hover:bg-neutral-light/20 transition-colors"
                >
                  <td className="p-4 font-medium text-neutral-dark capitalize">
                    {reserva.area}
                  </td>
                  <td className="p-4 text-neutral">
                    {new Date(reserva.data_reserva).toLocaleDateString(
                      "pt-BR",
                      { timeZone: "UTC" },
                    )}
                  </td>
                  <td className="p-4 text-neutral">{reserva.nome}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => cancelarReserva(reserva.id)}
                      className="text-tertiary hover:text-tertiary/80 font-medium text-sm"
                    >
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neutral-dark">
                Nova Reserva
              </h2>
              <button
                onClick={() => setModalAberto(false)}
                className="text-neutral hover:text-tertiary transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            {erroModal && (
              <div className="bg-tertiary/10 text-tertiary p-3 rounded-lg mb-4 text-sm font-medium">
                {erroModal}
              </div>
            )}

            <form onSubmit={criarReserva} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-1">
                  Área Comum
                </label>
                <select
                  value={novaArea}
                  onChange={(e) => setNovaArea(e.target.value)}
                  className="w-full p-3 rounded-lg border border-neutral text-neutral-dark focus:outline-none focus:border-primary"
                >
                  <option value="Churrasqueira">Churrasqueira</option>
                  <option value="Salão de Festas">Salão de Festas</option>
                  <option value="Piscina">Piscina</option>
                  <option value="Quadra Poliesportiva">
                    Quadra Poliesportiva
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-1">
                  Data da Reserva
                </label>
                <input
                  type="date"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg border border-neutral text-neutral-dark focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-colors mt-4 disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Confirmar Reserva"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
