"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EsqueciSenhaPage() {
  const [etapa, setEtapa] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const enviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/auth/esqueci-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Falha ao enviar o código.");
        setCarregando(false);
        return;
      }

      setAviso(dados.mensagem);
      setEtapa("codigo");
    } catch (_err) {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  const redefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      const resposta = await fetch("/api/auth/redefinir-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          codigo: codigo.trim(),
          novaSenha,
        }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Falha ao redefinir a senha.");
        setCarregando(false);
        return;
      }

      setSucesso(true);
      setTimeout(() => router.push("/login"), 2000);
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
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Recuperar Senha</h1>
          <p className="text-neutral-dark text-sm mt-1">
            {etapa === "email"
              ? "Informe seu e-mail para receber um código de verificação."
              : "Digite o código recebido por e-mail e defina sua nova senha."}
          </p>
        </div>

        {erro && (
          <div className="bg-tertiary/10 border border-tertiary/20 text-tertiary p-3 rounded-xl mb-5 text-sm font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{erro}</span>
          </div>
        )}

        {aviso && !sucesso && etapa === "codigo" && (
          <div className="bg-primary/10 border border-primary/20 text-primary p-3 rounded-xl mb-5 text-sm font-medium flex items-center gap-2">
            <span>✉️</span>
            <span>{aviso}</span>
          </div>
        )}

        {sucesso ? (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm font-medium text-center">
            ✅ Senha redefinida com sucesso! Redirecionando para o login...
          </div>
        ) : etapa === "email" ? (
          <form onSubmit={enviarCodigo} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-dark mb-1">E-mail cadastrado</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: maria@email.com"
                className="w-full p-3.5 rounded-xl border border-neutral/60 text-neutral-dark placeholder:text-neutral/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {carregando ? "Enviando..." : "Enviar Código"}
            </button>
          </form>
        ) : (
          <form onSubmit={redefinirSenha} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-dark mb-1">Código de verificação</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full p-3.5 rounded-xl border border-neutral/60 text-neutral-dark placeholder:text-neutral/60 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-dark mb-1">Nova senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full p-3.5 rounded-xl border border-neutral/60 text-neutral-dark placeholder:text-neutral/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-dark mb-1">Confirmar nova senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3.5 rounded-xl border border-neutral/60 text-neutral-dark placeholder:text-neutral/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {carregando ? "Redefinindo..." : "Redefinir Senha"}
            </button>
            <button
              type="button"
              onClick={() => setEtapa("email")}
              className="w-full text-sm text-neutral-dark/70 hover:underline"
            >
              Não recebeu o código? Voltar e tentar de novo
            </button>
          </form>
        )}

        <div className="mt-5 pt-5 border-t border-neutral-light text-center">
          <a href="/login" className="text-sm text-primary font-semibold hover:underline">
            Voltar para o login
          </a>
        </div>
      </div>
    </div>
  );
}
