"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const EMAIL_SUPERADMIN = "70246124@jjc.com.pe";

// Los iconos van dibujados como SVG y no como simbolos de texto: un simbolo
// depende de la fuente del equipo y en varias maquinas se ve como un cuadro.
function IconoInicio() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3.2 8.4L10 3l6.8 5.4V16a1 1 0 01-1 1h-3.4v-4.6H7.6V17H4.2a1 1 0 01-1-1V8.4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function IconoCursos() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3.2" y="3.4" width="13.6" height="13.2" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6.6 7.6h6.8M6.6 10.6h6.8M6.6 13.4h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconoEstadisticas() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4.6 15.4V9M10 15.4V4.6M15.4 15.4v-4.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function IconoVerificar() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3.4l5.8 2.3v4.1c0 3.3-2.3 5.7-5.8 6.8-3.5-1.1-5.8-3.5-5.8-6.8V5.7L10 3.4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M7.6 9.8l1.8 1.8 3.2-3.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoHistorial() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="6.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 6.2V10l2.6 1.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconoAlmacenamiento() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <ellipse cx="10" cy="5.6" rx="6.2" ry="2.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.8 5.6v8.8c0 1.3 2.8 2.4 6.2 2.4s6.2-1.1 6.2-2.4V5.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.8 10c0 1.3 2.8 2.4 6.2 2.4s6.2-1.1 6.2-2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { session, rol, cerrarSesion } = useAuth();

  const esSuperAdmin =
    rol === "admin" && session?.user?.email?.toLowerCase() === EMAIL_SUPERADMIN;

  const enlaces = [
    { href: "/inicio", etiqueta: "Inicio", icono: <IconoInicio />, visible: true },
    { href: "/", etiqueta: "Cursos", icono: <IconoCursos />, visible: true },
    { href: "/estadisticas", etiqueta: "Estadísticas", icono: <IconoEstadisticas />, visible: true },
    { href: "/verificacion", etiqueta: "Verificar capacitaciones", icono: <IconoVerificar />, visible: true },
    { href: "/historial", etiqueta: "Historial", icono: <IconoHistorial />, visible: rol === "admin" },
    { href: "/almacenamiento", etiqueta: "Almacenamiento", icono: <IconoAlmacenamiento />, visible: esSuperAdmin },
  ].filter((e) => e.visible);

  return (
    <nav
      aria-label="Navegación principal"
      className="w-full shrink-0 border-b border-line bg-white lg:w-60 lg:border-b-0 lg:border-r"
    >
      {/* En pantallas anchas la lista baja en columna. En celular se convierte
          en una fila que se desliza, para no empujar el contenido hacia abajo. */}
      <div className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-col lg:px-3 lg:py-5">
        {enlaces.map((enlace) => {
          const activo =
            enlace.href === "/" ? pathname === "/" : pathname?.startsWith(enlace.href);
          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              aria-current={activo ? "page" : undefined}
              className={`focus-ring flex shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition-colors ${
                activo
                  ? "bg-verde-100 font-semibold text-verde-600"
                  : "font-medium text-slate-600 hover:bg-slate-50"
              }`}
            >
              {enlace.icono}
              {enlace.etiqueta}
            </Link>
          );
        })}

        {/* El rol y la salida cierran la lista. En celular quedan al final de
            la fila deslizable; en pantalla ancha, al pie de la columna. */}
        <span className="hidden lg:mt-4 lg:block lg:border-t lg:border-line" />

        <span className="flex shrink-0 items-center whitespace-nowrap rounded-full border border-verde-500/40 px-3 py-1.5 text-xs font-semibold text-verde-600 lg:mt-4 lg:self-start">
          {rol === "admin" ? "Acceso total" : rol === "editor" ? "Editor" : "..."}
        </span>

        <button
          onClick={() => cerrarSesion()}
          className="focus-ring flex shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 lg:mt-1"
        >
          <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.4 6.2V4.8a1.4 1.4 0 00-1.4-1.4H4.8a1.4 1.4 0 00-1.4 1.4v10.4a1.4 1.4 0 001.4 1.4H11a1.4 1.4 0 001.4-1.4v-1.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M8.6 10h8m0 0l-2.6-2.6M16.6 10L14 12.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
