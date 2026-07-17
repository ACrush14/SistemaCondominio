"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Sidebar() {
  const [temaEscuro, setTemaEscuro] = useState(false);
  const [aberta, setAberta] = useState(false);
  const router = useRouter();

  const sair = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const linkClasse =
    "flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all font-medium text-neutral-light/90 hover:text-white";

  // Verifica qual tema estava salvo quando a página carrega
  useEffect(() => {
    const temaSalvo = localStorage.getItem("tema");
    if (temaSalvo === "dark") {
      document.documentElement.classList.add("dark");
      setTemaEscuro(true);
    }
  }, []);

  // O motor do botão
  const alternarTema = () => {
    if (temaEscuro) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tema", "light");
      setTemaEscuro(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tema", "dark");
      setTemaEscuro(true);
    }
  };

  return (
    <>
      {/* Barra superior só em mobile: hambúrguer para abrir a gaveta */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-primary text-white flex items-center justify-between px-4 z-30 shadow-lg">
        <button
          onClick={() => setAberta(true)}
          aria-label="Abrir menu"
          className="p-2 -ml-2 rounded-lg hover:bg-white/10"
        >
          <span className="text-2xl leading-none">☰</span>
        </button>
        <h1 className="text-lg font-bold tracking-wider">CondoManage</h1>
        <span className="w-9" />
      </header>

      {/* Fundo escurecido atrás da gaveta, só em mobile e só quando aberta */}
      {aberta && (
        <div
          onClick={() => setAberta(false)}
          aria-hidden="true"
          className="md:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-primary text-white shadow-xl flex flex-col z-50 transform transition-transform duration-300 md:translate-x-0 ${
          aberta ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-wider">CondoManage</h1>
            <p className="text-sm font-light text-neutral-light/80 mt-1">
              Administração
            </p>
          </div>
          <button
            onClick={() => setAberta(false)}
            aria-label="Fechar menu"
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
          >
            <span className="text-xl leading-none">✕</span>
          </button>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1.5 mt-2 overflow-y-auto">
          <Link href="/" className={linkClasse} onClick={() => setAberta(false)}>
            <span>📊</span>
            <span>Painel do Síndico</span>
          </Link>
          <Link href="/reservas" className={linkClasse} onClick={() => setAberta(false)}>
            <span>📅</span>
            <span>Reservas</span>
          </Link>
          <Link href="/ocorrencias" className={linkClasse} onClick={() => setAberta(false)}>
            <span>📋</span>
            <span>Ocorrências e Avisos</span>
          </Link>
          <Link href="/area-morador" className={linkClasse} onClick={() => setAberta(false)}>
            <span>📱</span>
            <span>Área do Morador (IA)</span>
          </Link>
          <Link href="/portaria" className={linkClasse} onClick={() => setAberta(false)}>
            <span>🛡️</span>
            <span>Portaria & QR Code</span>
          </Link>
          <Link href="/usuarios" className={linkClasse} onClick={() => setAberta(false)}>
            <span>👥</span>
            <span>Moradores & Usuários</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/20 space-y-2">
          {/* O Botão de Tema */}
          <button
            onClick={alternarTema}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-sm font-medium cursor-pointer shadow-sm"
          >
            <span className="flex items-center gap-2">
              {temaEscuro ? "☀️" : "🌙"}
              <span>{temaEscuro ? "Modo Claro" : "Modo Escuro"}</span>
            </span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
              {temaEscuro ? "ON" : "OFF"}
            </span>
          </button>

          <button
            onClick={sair}
            className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg transition-all text-sm font-medium"
          >
            Sair do Sistema
          </button>
        </div>
      </aside>
    </>
  );
}
