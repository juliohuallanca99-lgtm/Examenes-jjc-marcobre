"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LOGO_JJC_BASE64 } from "@/lib/pdf/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="fixed inset-0 flex items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl sm:p-10">
        <img src={LOGO_JJC_BASE64} alt="JJC" className="mx-auto h-12 w-auto" />

        <h1 className="mt-5 font-display text-2xl font-800 text-ink">Administración Exámenes</h1>
        <p className="mt-1 text-sm text-ink/60">Ingresa tus credenciales para continuar</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-ink">Usuario</label>
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus-ring mt-1.5 w-full rounded-lg border-0 bg-[#EEF1FA] px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-ring mt-1.5 w-full rounded-lg border-0 bg-[#EEF1FA] px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40"
              required
            />
          </div>

          {error && <p className="text-center text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="focus-ring mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-60"
          >
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
