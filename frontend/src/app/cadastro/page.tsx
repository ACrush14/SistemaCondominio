"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CondominioOpcao {
  id: number;
  nome: string;
}

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [unidade, setUnidade] = useState("");
  const [condominioId, setCondominioId] = useState("");
  const [condominios, setCondominios] = useState<CondominioOpcao[]>([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/condominios/publico")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCondominios(data);
          if (data.length > 0) setCondominioId(String(data[0].id));
        }
      })
      .catch((err) => console.error("Erro ao carregar condomínios:", err));
  }, []);

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      const resposta = await fetch("/api/auth/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          senha,
          unidade: unidade.trim(),
          condominio_id: Number(condominioId),
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Falha ao cadastrar.");
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
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Cadastro de Morador</h1>
          <p className="text-neutral-dark text-sm mt-1">Crie sua conta para acessar a Área do Morador.</p>
        </div>

        {erro && (
          <div className="bg-tertiary/10 border border-tertiary/20 text-tertiary p-3 rounded-xl mb-5 text-sm font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{erro}</span>
          </div>
        )}

        {sucesso ? (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm font-medium text-center">
            ✅ Cadastro realizado com sucesso! Redirecionando para o login...
          </div>
        ) : (
          <form onSubmit={cadastrar} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-dark mb-1">Nome completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Maria Silva"
                className="w-full p-3.5 rounded-xl border border-neutral/60 text-neutral-dark placeholder:text-neutral/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-dark mb-1">Condomínio</label>
              <select
                value={condominioId}
                onChange={(e) => setCondominioId(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-neutral/60 text-neutral-dark focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                required
              >
                {condominios.length === 0 && <option value="">Carregando...</option>}
                {condominios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-dark mb-1">Unidade (Apto/Bloco)</label>
              <input
                type="text"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                placeholder="Ex: Apto 301"
                className="w-full p-3.5 rounded-xl border border-neutral/60 text-neutral-dark placeholder:text-neutral/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-dark mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: maria@email.com"
                className="w-full p-3.5 rounded-xl border border-neutral/60 text-neutral-dark placeholder:text-neutral/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-dark mb-1">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full p-3.5 rounded-xl border border-neutral/60 text-neutral-dark placeholder:text-neutral/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-dark mb-1">Confirmar senha</label>
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
              {carregando ? "Cadastrando..." : "Criar Conta"}
            </button>
          </form>
        )}

        <div className="mt-5 pt-5 border-t border-neutral-light text-center">
          <a href="/login" className="text-sm text-primary font-semibold hover:underline">
            Já tem uma conta? Entrar
          </a>
        </div>
      </div>
    </div>
  );
}
