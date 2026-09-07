"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { LOGO_JJC_BASE64 } from "@/lib/pdf/logo";

interface FilaCapacitacion {
  nombres: string;
  apellidos: string;
  curso: string;
  fecha: string;
  vigente: boolean;
}

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function VerificacionPage() {
  const [dni, setDni] = useState("");
  const [buscado, setBuscado] = useState("");
  const [filas, setFilas] = useState<FilaCapacitacion[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    const consulta = dni.trim();
    if (!consulta) return;

    setBuscando(true);
    setError(null);
    setFilas(null);
    setBuscado(consulta);

    try {
      const { data, error } = await supabase.rpc("consultar_capacitaciones", {
        p_dni: consulta,
      });
      if (error) throw error;
      setFilas((data as FilaCapacitacion[]) ?? []);
    } catch (err: any) {
      setError(err?.message ?? "No se pudo realizar la consulta. Intenta de nuevo.");
    } finally {
      setBuscando(false);
    }
  }

  const trabajador = filas && filas.length > 0 ? filas[0] : null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center text-center">
        <img src={LOGO_JJC_BASE64} alt="JJC" className="h-10 w-auto" />
        <h1 className="mt-3 font-display text-xl font-800 text-ink">
          Verificación de capacitaciones
        </h1>
        <p className="mt-1 text-sm text-ink/50">
          Consulta el estado de vigencia de las capacitaciones de un trabajador. Vigencia: 1 año
          desde la fecha del examen.
        </p>
      </div>

      <form onSubmit={handleBuscar} className="mt-6 flex gap-2">
        <input
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          inputMode="numeric"
          placeholder="Buscar por DNI"
          autoFocus
          className="focus-ring w-full rounded-lg border border-line bg-white px-4 py-3 text-sm"
        />
        <button
          type="submit"
          disabled={buscando || !dni.trim()}
          className="focus-ring shrink-0 rounded-lg bg-navy-900 px-5 py-3 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
        >
          {buscando ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!buscando && filas !== null && filas.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-line bg-white/60 px-6 py-10 text-center">
          <p className="text-sm text-ink/60">
            No se encontró ningún registro de capacitaciones aprobadas para el DNI {buscado}.
          </p>
        </div>
      )}

      {!buscando && trabajador && (
        <div className="mt-6 rounded-lg border border-line bg-white p-4">
          <p className="text-xs text-ink/50">JJC Contratistas Generales S.A.</p>
          <p className="mt-0.5 font-display text-lg font-800 text-ink">
            {trabajador.apellidos}, {trabajador.nombres}
          </p>

          <div className="mt-4 overflow-hidden rounded-md border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper text-xs text-ink/50">
                <tr>
                  <th className="px-3 py-2 font-medium">Curso</th>
                  <th className="px-3 py-2 font-medium">Vigencia</th>
                  <th className="px-3 py-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filas!.map((f, idx) => (
                  <tr key={idx} className="border-t border-line">
                    <td className="px-3 py-2.5 text-ink">{f.curso}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          f.vigente ? "bg-gold-100 text-gold-600" : "bg-red-50 text-red-600"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            f.vigente ? "bg-gold-600" : "bg-red-500"
                          }`}
                        />
                        {f.vigente ? "Vigente" : "Vencido"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-ink/60">{formatearFecha(f.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
