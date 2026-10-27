"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Header() {
  const pathname = usePathname();
  const { session } = useAuth();

  if (pathname === "/login") return null;

  // La barra de marca ya no lleva la navegacion: esa vive ahora en el menu
  // lateral. Aqui solo queda la identidad y quien tiene la sesion abierta,
  // para que haya una sola jerarquia de navegacion y no tres compitiendo.
  return (
    <header className="bg-navy-800 text-white">
      <div className="flex items-center gap-4 px-5 py-3.5 sm:px-7">
        <Link
          href={session ? "/" : pathname!}
          className="focus-ring flex items-baseline gap-3"
        >
          <span className="font-display text-xl font-extrabold tracking-tight">JJC</span>
          <span className="h-4 w-px bg-navy-600" />
          <span className="font-body text-sm tracking-wide text-navy-100">
            Sistema de Exámenes
          </span>
        </Link>

        <span className="rounded-full bg-navy-700 px-3 py-1 text-xs font-medium text-navy-100">
          CC0174
        </span>

        <span className="flex-1" />

        {session && (
          <span className="hidden text-sm text-navy-100 sm:inline">
            {session.user?.email}
          </span>
        )}
      </div>
    </header>
  );
}
