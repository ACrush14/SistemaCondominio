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
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Falha na autenticação");
        setCarregando(false);
        return;
      }

      // salvamos o token e o usuário no navegador
      localStorage.setItem("token", dados.token);
      if (dados.usuario) {
        localStorage.setItem("usuarioLogado", JSON.stringify(dados.usuario));
      }

      // redireciona de acordo com o perfil
      if (dados.usuario?.role === "MORADOR" || dados.usuario?.perfil === "MORADOR") {
        router.push("/area-morador");
      } else {
        router.push("/reservas");
      }
    } catch (_err) {
      setErro("Erro de conexão com o servidor");
      setCarregando(false);
    }
  };

  const preencherCredencialMorador = () => {
    setEmail("joao@tailson.com");
    setSenha("joaodelas");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-light p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-neutral-light">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">CondoManage</h1>
          <p className="text-neutral-dark text-sm mt-1">Acesse sua conta para continuar.</p>
        </div>

        {erro && (
          <div className="bg-tertiary/10 border border-tertiary/20 text-tertiary p-3 rounded-xl mb-5 text-sm font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{erro}</span>
          </div>
        )}

        {/* Card de Dica de Credencial */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 mb-6 text-xs text-neutral-dark flex items-center justify-between">
          <div>
            <p className="font-bold text-primary mb-0.5">🔑 Credencial Morador Tailson:</p>
            <p><strong>Email:</strong> joao@tailson.com</p>
            <p><strong>Senha:</strong> joaodelas</p>
          </div>
          <button
            type="button"
            onClick={preencherCredencialMorador}
            className="bg-primary/10 hover:bg-primary/20 text-primary font-semibold px-2.5 py-1.5 rounded-lg transition-colors text-xs"
          >
            Preencher
          </button>
        </div>

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
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            {carregando ? "Autenticando..." : "Entrar no Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}
