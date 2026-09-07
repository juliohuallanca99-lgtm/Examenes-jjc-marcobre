"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, cargando } = useAuth();
  const esPublico =
    pathname?.startsWith("/examen") || pathname === "/verificacion" || pathname === "/login";

  useEffect(() => {
    if (!cargando && !esPublico && !session) {
      router.replace("/login");
    }
  }, [cargando, esPublico, session, router]);

  if (esPublico) return <>{children}</>;

  if (cargando || !session) {
    return <div className="mx-auto max-w-md py-16 text-center text-sm text-ink/50">Cargando...</div>;
  }

  return <>{children}</>;
}
