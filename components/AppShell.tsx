"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session } = useAuth();

  // El trabajador que rinde un examen o consulta sus capacitaciones no navega
  // por el panel: esas pantallas se quedan sin menu, centradas y sin distraccion.
  const esVistaPublica =
    pathname?.startsWith("/examen") || pathname === "/verificacion" || pathname === "/login";

  if (esVistaPublica || !session) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="flex min-h-[calc(100vh-56px)] flex-col lg:flex-row">
        <Sidebar />
        {/* El menu lateral ocupa 240 px, asi que el contenido se ensancha a
            max-w-6xl para que la tabla de cursos no quede apretada. */}
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-7 lg:px-9">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </>
  );
}
