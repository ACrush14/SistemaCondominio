"use client";
import { useEffect, useState } from "react";

export default function MoradoresPage() {
  const [moradores, setMoradores] = useState([]);

  const buscarMoradores = async () => {
    const res = await fetch("http://localhost:3333/api/moradores");
    const dados = await res.json();
    setMoradores(dados);
  };

  useEffect(() => {
    buscarMoradores();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Moradores</h1>
      <div className="bg-white p-6 rounded-xl shadow">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-neutral uppercase text-sm">
              <th className="p-4">Nome</th>
              <th className="p-4">Unidade</th>
              <th className="p-4">Telefone</th>
            </tr>
          </thead>
          <tbody>
            {moradores.map((m: any) => (
              <tr key={m.id} className="border-b">
                <td className="p-4">{m.nome}</td>
                <td className="p-4">{m.unidade}</td>
                <td className="p-4">{m.telefone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
