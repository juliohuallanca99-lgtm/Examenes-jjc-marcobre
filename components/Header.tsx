"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const EMAIL_SUPERADMIN = "70246124@jjc.com.pe";

export default function Header() {
  const pathname = usePathname();
  const { session, rol, cerrarSesion } = useAuth();
  const esVistaPublica = pathname?.startsWith("/examen") || pathname === "/verificacion";
  const esSuperAdmin =
    rol === "admin" && session?.user?.email?.toLowerCase() === EMAIL_SUPERADMIN;

  if (pathname === "/login") return null;

  return (
    <header className="bg-navy-900 text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href={session ? "/" : pathname!} className="flex items-baseline gap-3">
          <span className="font-display text-lg font-800 tracking-tight">JJC</span>
          <span className="h-4 w-px bg-navy-600" />
          <span className="font-body text-sm text-navy-100/80 tracking-wide">
            Sistema de Exámenes · CC0174
          </span>
        </Link>
        {!esVistaPublica && session && (
          <div className="flex items-center gap-3">
            <Link
              href="/estadisticas"
              className="focus-ring text-xs font-medium text-navy-100/70 hover:text-white"
            >
              Estadísticas
            </Link>
            <Link
              href="/verificacion"
              className="focus-ring text-xs font-medium text-navy-100/70 hover:text-white"
            >
              Verificar capacitaciones
            </Link>
            {rol === "admin" && (
              <Link
                href="/historial"
                className="focus-ring text-xs font-medium text-navy-100/70 hover:text-white"
              >
                Historial
              </Link>
            )}
            {esSuperAdmin && (
              <Link
                href="/almacenamiento"
                className="focus-ring text-xs font-medium text-navy-100/70 hover:text-white"
              >
                Almacenamiento
              </Link>
            )}
            <span className="rounded-full border border-gold-500/40 px-3 py-1 text-xs font-medium text-gold-500">
              {rol === "admin" ? "Acceso total" : rol === "editor" ? "Editor" : "..."}
            </span>
            <button
              onClick={() => cerrarSesion()}
              className="focus-ring text-xs font-medium text-navy-100/70 hover:text-white"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
