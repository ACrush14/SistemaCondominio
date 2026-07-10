import type { Metadata } from "next";
import "./globals.css";
import ManiaChatbot from "@/components/ManiaChatbot";

export const metadata: Metadata = {
  title: "CondoManage — IA Mania",
  description: "Sistema de Gestão de Condomínios com Inteligência Artificial Mania",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen bg-neutral-light dark:bg-[#0b1323] text-neutral-dark dark:text-gray-100 transition-colors duration-300">
        {children}
        <ManiaChatbot />
      </body>
    </html>
  );
}
