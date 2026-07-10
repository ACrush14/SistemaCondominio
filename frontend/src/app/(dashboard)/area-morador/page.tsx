"use client";
import { useEffect, useState, useCallback } from "react";

interface Visitante {
  id: string;
  nome: string;
  documento: string;
  unidade_destino: string;
  status: "PENDENTE" | "AUTORIZADO" | "NEGADO";
}

export default function AreaMoradorPage() {
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const minhaUnidade = "101";

  const buscarVisitantes = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost:3333/api/visitantes/unidade/${minhaUnidade}`,
      );
      const dados = await res.json();
      setVisitantes(dados);
    } catch (err) {
      console.error("Erro ao buscar dados");
    }
  }, [minhaUnidade]);

  useEffect(() => {
    buscarVisitantes();
  }, [buscarVisitantes]);

  const atualizarStatus = async (
    id: string,
    novoStatus: "AUTORIZADO" | "NEGADO",
  ) => {
    try {
      await fetch(`http://localhost:3333/api/visitantes/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      buscarVisitantes(); // Recarrega a lista
    } catch (err) {
      console.error("Erro ao atualizar status");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Minha Unidade: {minhaUnidade}</h1>
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Visitantes Aguardando</h2>
        <div className="space-y-4">
          {visitantes.length === 0 ? (
            <p>Nenhum visitante pendente.</p>
          ) : (
            visitantes.map((v) => (
              <div
                key={v.id}
                className="flex justify-between items-center border-b pb-4"
              >
                <div>
                  <p className="font-bold">{v.nome}</p>
                  <p className="text-sm text-neutral">Doc: {v.documento}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => atualizarStatus(v.id, "AUTORIZADO")}
                    className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondary/90"
                  >
                    Autorizar
                  </button>
                  <button
                    onClick={() => atualizarStatus(v.id, "NEGADO")}
                    className="bg-tertiary text-white px-4 py-2 rounded hover:bg-tertiary/90"
                  >
                    Negar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
