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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={registrarEntrada}
            className="bg-white p-6 rounded-3xl shadow-2xl space-y-4 w-full max-w-md relative border border-gray-100"
          >
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm transition-colors"
            >
              ✕
            </button>
            <div>
              <h3 className="font-bold text-xl text-[#0A2540]">Registrar Entrada</h3>
              <p className="text-xs text-gray-500 mt-0.5">Autorizar visitante na portaria</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nome do Visitante</label>
              <input
                placeholder="Ex: Carlos Eduardo"
                className="border border-gray-200 p-3 rounded-xl w-full text-sm focus:outline-none focus:border-[#0A2540]"
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Unidade de Destino</label>
              <input
                placeholder="Ex: Apto 402"
                className="border border-gray-200 p-3 rounded-xl w-full text-sm focus:outline-none focus:border-[#0A2540]"
                onChange={(e) => setUnidade(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-[#0A2540] hover:bg-[#0A2540]/90 text-white py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm">
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="px-5 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
