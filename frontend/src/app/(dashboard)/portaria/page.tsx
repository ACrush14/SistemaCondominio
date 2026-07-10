"use client";
import { useEffect, useState, useCallback } from "react";

interface Visitante {
  id: string;
  nome: string;
  documento: string;
  unidade_destino: string;
  status: "PENDENTE" | "AUTORIZADO" | "NEGADO";
}

export default function PortariaPage() {
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [placa, setPlaca] = useState("");
  const [unidade, setUnidade] = useState("");

  const buscarVisitantes = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3333/api/visitantes");
      const dados = await res.json();
      setVisitantes(dados);
    } catch (err) {
      console.error("Erro ao buscar");
    }
  }, []);

  useEffect(() => {
    buscarVisitantes();
    const intervalo = setInterval(buscarVisitantes, 5000);
    return () => clearInterval(intervalo);
  }, [buscarVisitantes]);

  const registrarEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("http://localhost:3333/api/visitantes", {
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Portaria</h1>
        <button
          onClick={() => setModalAberto(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Registrar
        </button>
      </div>
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="border-b">
            <th className="p-4">Nome</th>
            <th className="p-4">Unidade</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {visitantes.map((v) => (
            <tr key={v.id} className="border-b">
              <td className="p-4">{v.nome}</td>
              <td className="p-4">{v.unidade_destino}</td>
              <td className="p-4 font-bold">{v.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <form
            onSubmit={registrarEntrada}
            className="bg-white p-8 rounded shadow-lg space-y-4"
          >
            <input
              placeholder="Nome"
              className="border p-2 w-full"
              onChange={(e) => setNome(e.target.value)}
              required
            />
            <input
              placeholder="Unidade"
              className="border p-2 w-full"
              onChange={(e) => setUnidade(e.target.value)}
              required
            />
            <button className="bg-blue-600 text-white p-2 w-full">
              Confirmar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
