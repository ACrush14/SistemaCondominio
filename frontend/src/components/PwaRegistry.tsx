"use client";
import { useEffect } from "react";

export default function PwaRegistry() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.log("Falha ao registrar SW:", err));
    }
  }, []);
  return null;
}
