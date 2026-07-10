"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false); // O estado que controla o olho
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

      localStorage.setItem("token", dados.token);
      router.push("/reservas");
    } catch (err) {
      setErro("Erro de conexão com o servidor.");
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

          {/* Caixa de Senha com o Olho */}
          <div className="relative">
            <label className="block text-sm font-medium text-neutral-dark mb-1">
              Senha
            </label>
            <input
              type={mostrarSenha ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-3 rounded-lg border border-neutral text-neutral-dark focus:outline-none focus:border-primary pr-12"
              required
            />

            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-3 top-9 text-neutral hover:text-primary transition-colors"
            >
              {mostrarSenha ? (
                // Ícone de Olho Cortado (Esconder)
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29"
                  />
                </svg>
              ) : (
                // Ícone de Olho Aberto (Mostrar)
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-colors mt-2"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
