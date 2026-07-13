"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const fazerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), senha: senha.trim() }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Falha na autenticação");
        setCarregando(false);
        return;
      }

      if (dados.usuario?.perfil === "MORADOR") {
        router.push("/area-morador");
      } else {
        router.push("/reservas");
      }
    } catch (_err) {
      setErro("Erro ao conectar com o servidor.");
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-light p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-neutral-light">
        <div className="text-center mb-6">
          <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-2">
            CondoManage Inteligente v2.0
          </span>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Portal de Acesso</h1>
          <p className="text-neutral-dark text-sm mt-1">Acesse sua conta para continuar.</p>
        </div>

        {erro && (
          <div className="bg-tertiary/10 border border-tertiary/20 text-tertiary p-3 rounded-xl mb-5 text-sm font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={fazerLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-dark mb-1">
              Email do Usuário
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: joao@tailson.com"
              className="w-full p-3.5 rounded-xl border border-neutral/60 text-neutral-dark placeholder:text-neutral/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-dark mb-1">
              Senha de Acesso
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3.5 rounded-xl border border-neutral/60 text-neutral-dark placeholder:text-neutral/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            {carregando ? "Autenticando..." : "Entrar no Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}
