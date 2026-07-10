"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const router = useRouter();

  const fazerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    try {
      const resposta = await fetch("http://localhost:3333/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Falha na autenticação");
        return;
      }

      //salvamos o token no navegador
      localStorage.setItem("token", dados.token);

      //redireciona o usuário para a página de reservas
      router.push("/reservas");
    } catch (err) {
      setErro("Erro de conexão com o servidor");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-light">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-neutral-light">
        <h1 className="text-2xl font-bold text-primary mb-2">CondoManage</h1>
        <p className="text-neutral mb-6">Acesse sua conta para continuar.</p>

        {erro && (
          <div className="bg-tertiary/10 text-tertiary p-3 rounded-lg mb-4 text-sm font-medium">
            {erro}
          </div>
        )}

        <form onSubmit={fazerLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border border-neutral text-neutral-dark focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-1">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-3 rounded-lg border border-neutral text-neutral-dark focus:outline-none focus:border-primary"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
