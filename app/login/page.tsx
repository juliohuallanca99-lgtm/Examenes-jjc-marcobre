"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LOGO_JJC_BASE64 } from "@/lib/pdf/logo";

// La foto vive en el mismo bucket publico de Supabase que el logotipo.
// Si todavia no esta subida, la pantalla cae al fondo navy y sigue
// funcionando: no se rompe el ingreso por una imagen que falta.
const FOTO_FONDO =
  "https://jxdfqqrwrvqtwyamewvi.supabase.co/storage/v1/object/public/publico/fondo-ingreso.jpeg";

function IconoOjo({ tachado }: { tachado: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M2 10s3-5.4 8-5.4S18 10 18 10s-3 5.4-8 5.4S2 10 2 10z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      {tachado && <path d="M3.5 3.5l13 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setError("Usuario o contraseña incorrectos.");
      setCargando(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 overflow-auto bg-navy-900">
      {/* La foto se ancla abajo: al recortarse en pantallas anchas se pierde
          cielo y no la planta, que es lo que importa de la imagen.
          Encima van dos velos navy, uno lateral y otro superior, para que el
          texto de la tarjeta tenga contraste sin tapar la foto. */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-cover bg-bottom bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(32,33,64,.62) 0%, rgba(32,33,64,.18) 42%, rgba(32,33,64,0) 62%), linear-gradient(180deg, rgba(21,22,43,.35) 0%, rgba(21,22,43,0) 24%), url(${FOTO_FONDO})`,
        }}
      />

      {/* Marca arriba a la izquierda, sobre la foto */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_JJC_BASE64}
        alt="JJC Contratistas Generales"
        className="fixed left-5 top-5 z-10 h-11 w-auto rounded-md bg-white/95 px-2.5 py-1.5 shadow-lg sm:left-16 sm:top-10 sm:h-14"
      />

      <div className="relative z-20 ml-auto flex min-h-full w-[min(470px,calc(100%-2rem))] flex-col justify-center gap-3.5 px-0 py-10 sm:mr-[max(1rem,13vw)] max-sm:mx-auto max-sm:pt-24">
        {/* Tarjeta del logotipo, como en reclutamiento. En celular se oculta
            para no empujar el formulario fuera de la pantalla. */}
        <div className="hidden place-items-center rounded-[22px] bg-white px-5 py-6 shadow-2xl sm:grid">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_JJC_BASE64} alt="" className="h-16 w-auto" />
        </div>

        <div className="rounded-[22px] bg-white px-7 pb-6 pt-8 shadow-2xl sm:px-8">
          <h1 className="text-center font-display text-[1.8rem] font-extrabold leading-tight tracking-tight text-navy-800">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-center text-base text-slate-600">
            Ingresa tus datos para acceder al sistema
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            <label htmlFor="correo" className="mb-1.5 block text-[0.9375rem] font-semibold text-slate-800">
              Usuario
            </label>
            <input
              id="correo"
              type="email"
              autoFocus
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus-ring w-full rounded-[10px] border border-slate-300 bg-white px-3.5 text-base text-slate-800"
              required
            />

            <label htmlFor="clave" className="mb-1.5 mt-4 block text-[0.9375rem] font-semibold text-slate-800">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="clave"
                type={verClave ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-ring w-full rounded-[10px] border border-slate-300 bg-white px-3.5 pr-12 text-base text-slate-800"
                required
              />
              <button
                type="button"
                onClick={() => setVerClave((v) => !v)}
                aria-pressed={verClave}
                aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="focus-ring absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-navy-800 hover:bg-slate-100"
              >
                <IconoOjo tachado={verClave} />
              </button>
            </div>

            {error && (
              <p className="mt-3 text-center text-sm font-medium text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="focus-ring mx-auto mt-6 block w-[min(240px,100%)] rounded-[10px] bg-navy-800 px-5 py-3.5 text-[1.0625rem] font-semibold text-white transition hover:bg-navy-700 disabled:cursor-progress disabled:bg-slate-500"
            >
              {cargando ? "Ingresando…" : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-4 text-center text-[0.84375rem] leading-relaxed text-slate-500">
            Sistema de Exámenes · Proyecto CC0174
            <br />
            JJC Contratistas Generales S.A.
          </p>
        </div>
      </div>
    </div>
  );
}
