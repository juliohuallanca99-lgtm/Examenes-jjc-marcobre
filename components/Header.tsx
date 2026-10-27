"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { LOGO_JJC_BASE64 } from "@/lib/pdf/logo";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const pathname = usePathname();
  const { session } = useAuth();

  if (pathname === "/login") return null;

  // La barra de marca ya no lleva la navegacion: esa vive ahora en el menu
  // lateral. Aqui solo queda la identidad y quien tiene la sesion abierta,
  // para que haya una sola jerarquia de navegacion y no tres compitiendo.
  return (
    <header className="bg-navy-800 text-white">
      <div className="flex items-center gap-4 px-5 py-3 sm:px-7">
        <Link href={session ? "/" : pathname!} className="focus-ring flex items-center gap-3">
          {/* El logotipo es un JPG: no tiene fondo transparente, asi que va
              dentro de una pastilla blanca. Ademas se recorta por CSS para
              mostrar solo el simbolo: el archivo trae debajo el texto
              "INGENIERIA Y CONSTRUCCION", que a esta altura quedaria en
              cuatro pixeles y no se leeria.
              El original mide 469 x 279 y el simbolo ocupa de la fila 18 a
              la 184; de ahi salen el alto y el desplazamiento de abajo. */}
          <span
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-white px-2"
            style={{ height: 36 }}
          >
            <span className="block overflow-hidden" style={{ height: 30, width: 85 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LOGO_JJC_BASE64}
                alt="JJC Contratistas Generales"
                style={{ height: 50, width: 85, maxWidth: "none", marginTop: -3 }}
              />
            </span>
          </span>

          <span className="hidden h-4 w-px bg-navy-600 sm:block" />
          <span className="hidden font-body text-sm tracking-wide text-navy-100 sm:block">
            Sistema de Exámenes
          </span>
        </Link>

        <span className="rounded-full bg-navy-700 px-3 py-1 text-xs font-medium text-navy-100">
          CC0174
        </span>

        <span className="flex-1" />

        {session && (
          <span className="hidden text-sm text-navy-100 sm:inline">{session.user?.email}</span>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
