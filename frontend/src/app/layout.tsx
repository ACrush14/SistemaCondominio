import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CondoManage",
  description: "Sistema de Gestão de Condomínios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen bg-neutral-light">
        {children}
      </body>
    </html>
  );
}
