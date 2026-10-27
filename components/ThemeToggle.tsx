"use client";

import { useEffect, useState } from "react";

const CLAVE = "jjc-tema";

export default function ThemeToggle() {
  const [oscuro, setOscuro] = useState(false);
  const [listo, setListo] = useState(false);

  // El tema real ya lo aplico el script del layout antes de pintar la pagina.
  // Aqui solo se lee para que el boton muestre el icono correcto.
  useEffect(() => {
    setOscuro(document.documentElement.classList.contains("dark"));
    setListo(true);
  }, []);

  function alternar() {
    const nuevo = !oscuro;
    setOscuro(nuevo);
    document.documentElement.classList.toggle("dark", nuevo);
    try {
      localStorage.setItem(CLAVE, nuevo ? "oscuro" : "claro");
    } catch {
      // Si el navegador bloquea el almacenamiento, el tema igual cambia:
      // solo se pierde la preferencia al cerrar la pestaña.
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={oscuro}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
      className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-navy-600 text-navy-100 transition-colors hover:bg-navy-700"
    >
      {/* Mientras no se sepa el tema no se dibuja ningun icono, para que no
          aparezca el sol y cambie a luna un instante despues. */}
      {!listo ? null : oscuro ? (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M10 2.6v1.8M10 15.6v1.8M17.4 10h-1.8M4.4 10H2.6M15.2 4.8l-1.3 1.3M6.1 13.9l-1.3 1.3M15.2 15.2l-1.3-1.3M6.1 6.1L4.8 4.8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M16.4 12.6A7 7 0 0 1 7.4 3.6a7 7 0 1 0 9 9z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
