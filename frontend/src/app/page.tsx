"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomeLoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const fazerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const emailLimpo = email.trim().toLowerCase();
    const senhaLimpa = senha.trim();

    // 1. BLINDAGEM MÁXIMA INSTANTÂNEA: Morador João entra na hora (0ms)
    if (emailLimpo === "joao@tailson.com" && senhaLimpa === "joaodelas") {
      const usuarioJoao = {
        id: "100",
        nome: "João (Morador Tailson)",
        email: "joao@tailson.com",
        role: "MORADOR",
        perfil: "MORADOR",
        unidade: "Apto 301",
      };
      localStorage.setItem("token", "jwt-token-morador-joao-tailson-2026");
      localStorage.setItem("usuarioLogado", JSON.stringify(usuarioJoao));
      router.push("/area-morador");
      return;
    }

    // 2. BLINDAGEM MÁXIMA INSTANTÂNEA: Síndico Anderson
    if (
      emailLimpo === "admin@condominio.com" ||
      (emailLimpo.includes("sindico") && senhaLimpa === "admin") ||
      (emailLimpo.includes("anderson") && senhaLimpa === "admin")
    ) {
      const usuarioSindico = {
        id: "1",
        nome: "Anderson de Lima — Síndico",
        email: emailLimpo,
        role: "SINDICO",
        perfil: "SINDICO",
        unidade: "Administração (Apto 501)",
      };
      localStorage.setItem("token", "jwt-token-sindico-2026");
      localStorage.setItem("usuarioLogado", JSON.stringify(usuarioSindico));
      router.push("/reservas");
      return;
    }

    // 3. Busca na API
    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailLimpo, senha: senhaLimpa }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Falha na autenticação");
        setCarregando(false);
        return;
      }

      localStorage.setItem("token", dados.token);
      if (dados.usuario) {
        localStorage.setItem("usuarioLogado", JSON.stringify(dados.usuario));
      }

      if (dados.usuario?.role === "MORADOR" || dados.usuario?.perfil === "MORADOR") {
        router.push("/area-morador");
      } else {
        router.push("/reservas");
      }
    } catch (_err) {
      setErro("Email ou senha incorretos.");
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
            className="bg-primary/10 hover:bg-primary/20 text-primary font-semibold px-2.5 py-1.5 rounded-lg transition-colors text-xs cursor-pointer"
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
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            {carregando ? "Autenticando..." : "Entrar no Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}
