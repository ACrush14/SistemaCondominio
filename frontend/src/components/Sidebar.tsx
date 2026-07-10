"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Sidebar() {
  const [temaEscuro, setTemaEscuro] = useState(false);

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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-primary text-white shadow-xl flex flex-col">
      <div className="p-6 border-b border-white/20">
        <h1 className="text-2xl font-bold tracking-wider">CondoManage</h1>
        <p className="text-sm font-light text-neutral-light/80 mt-1">
          Administração
        </p>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1.5 mt-2 overflow-y-auto">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all font-medium text-neutral-light/90 hover:text-white"
        >
          <span>📊</span>
          <span>Painel do Síndico</span>
        </Link>
        <Link
          href="/reservas"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all font-medium text-neutral-light/90 hover:text-white"
        >
          <span>📅</span>
          <span>Reservas</span>
        </Link>
        <Link
          href="/ocorrencias"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all font-medium text-neutral-light/90 hover:text-white"
        >
          <span>📋</span>
          <span>Ocorrências e Avisos</span>
        </Link>
        <Link
          href="/area-morador"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all font-medium text-neutral-light/90 hover:text-white"
        >
          <span>📱</span>
          <span>Área do Morador (IA)</span>
        </Link>
        <Link
          href="/portaria"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all font-medium text-neutral-light/90 hover:text-white"
        >
          <span>🛡️</span>
          <span>Portaria & QR Code</span>
        </Link>
        <Link
          href="/usuarios"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all font-medium text-neutral-light/90 hover:text-white"
        >
          <span>👥</span>
          <span>Moradores & Usuários</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-white/20 space-y-2">
        {/* O Botão de Tema */}
        <button
          onClick={alternarTema}
          className="w-full flex items-center justify-between px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm font-medium"
        >
          <span>Modo {temaEscuro ? "Claro" : "Escuro"}</span>
          {temaEscuro ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              ></path>
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              ></path>
            </svg>
          )}
        </button>

        <button className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg transition-all text-sm font-medium">
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}
