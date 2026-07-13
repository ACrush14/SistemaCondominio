import type { Metadata } from "next";
import "./globals.css";
import ManiaChatbot from "@/components/ManiaChatbot";
import PwaRegistry from "@/components/PwaRegistry";

export const metadata: Metadata = {
  title: "CondoManage — IA Executiva",
  description: "Sistema de Gestão de Condomínios com Inteligência Artificial e Segurança em Tempo Real",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CondoManage",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen bg-neutral-light dark:bg-[#0b1323] text-neutral-dark dark:text-gray-100 transition-colors duration-300">
        <PwaRegistry />
        {children}
        <ManiaChatbot />
      </body>
    </html>
  );
}
