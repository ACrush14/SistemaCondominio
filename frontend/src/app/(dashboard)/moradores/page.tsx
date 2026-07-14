"use client";
import { useEffect, useState, useCallback } from "react";

export default function MoradoresPage() {
  const [moradores, setMoradores] = useState<any[]>([]);
  const [form, setForm] = useState({
    nome: "",
    unidade: "",
    telefone: "",
    email: "",
  });

  const buscarMoradores = useCallback(async () => {
    const res = await fetch("/api/usuarios");
    const data = await res.json();
    setMoradores(Array.isArray(data) ? data : data.registros || data.usuarios || []);
  }, []);

  useEffect(() => {
    buscarMoradores();
  }, [buscarMoradores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ nome: "", unidade: "", telefone: "", email: "" });
    buscarMoradores();
  };

  const deletarMorador = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este morador?")) return;
    await fetch(`/api/usuarios/${id}`, {
      method: "DELETE",
    });
    buscarMoradores();
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Gestão de Moradores</h1>

      {/* Formulário de Cadastro */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow grid grid-cols-2 gap-4"
      >
        <input
          placeholder="Nome Completo"
          className="p-3 border rounded"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          required
        />
        <input
          placeholder="Unidade (Ex: 101)"
          className="p-3 border rounded"
          value={form.unidade}
          onChange={(e) => setForm({ ...form, unidade: e.target.value })}
          required
        />
        <input
          placeholder="Telefone"
          className="p-3 border rounded"
          value={form.telefone}
          onChange={(e) => setForm({ ...form, telefone: e.target.value })}
        />
        <input
          placeholder="E-mail"
          className="p-3 border rounded"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <button
          type="submit"
          className="col-span-2 bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
        >
          Cadastrar Morador
        </button>
      </form>

      {/* Tabela de Moradores */}
      <div className="bg-white p-6 rounded-xl shadow">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-neutral uppercase text-xs">
              <th className="p-4">Nome</th>
              <th className="p-4">Unidade</th>
              <th className="p-4">Ação</th>
            </tr>
          </thead>
          <tbody>
            {moradores.map((m: any) => (
              <tr key={m.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{m.nome}</td>
                <td className="p-4">{m.unidade}</td>
                <td className="p-4">
                  <button
                    onClick={() => deletarMorador(m.id)}
                    className="text-red-600 hover:underline"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
