"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { LOGO_JJC_BASE64 } from "@/lib/pdf/logo";

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calcularVencimiento(iso: string) {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

export default function VerificacionPage() {
  const { cursos, intentos, loaded } = useStore();
  const [dni, setDni] = useState("");
  const [buscado, setBuscado] = useState("");

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    setBuscado(dni.trim());
  }

  const resultado = useMemo(() => {
    if (!buscado) return null;
    const aprobados = intentos.filter((i) => i.dni.trim() === buscado && i.estado === "aprobado");
    if (aprobados.length === 0) return { encontrado: false as const };

    const porCurso = new Map<string, (typeof aprobados)[number]>();
    for (const i of aprobados) {
      const actual = porCurso.get(i.cursoId);
      if (!actual || new Date(i.fecha) > new Date(actual.fecha)) {
        porCurso.set(i.cursoId, i);
      }
    }

    const masReciente = aprobados.reduce((a, b) => (new Date(a.fecha) > new Date(b.fecha) ? a : b));

    const filas = Array.from(porCurso.values())
      .map((i) => {
        const curso = cursos.find((c) => c.id === i.cursoId);
        const vencimiento = calcularVencimiento(i.fecha);
        const vigente = new Date() <= vencimiento;
        return {
          nombreCurso: curso?.nombre ?? "(curso eliminado)",
          fecha: i.fecha,
          vigente,
        };
      })
      .sort((a, b) => a.nombreCurso.localeCompare(b.nombreCurso));

    return {
      encontrado: true as const,
      nombres: masReciente.nombres,
      apellidos: masReciente.apellidos,
      filas,
    };
  }, [buscado, intentos, cursos]);

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
          disabled={!loaded || !dni.trim()}
          className="focus-ring shrink-0 rounded-lg bg-navy-900 px-5 py-3 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
        >
          Buscar
        </button>
      </form>

      {!loaded && buscado && <p className="mt-8 text-center text-sm text-ink/50">Cargando...</p>}

      {loaded && resultado && !resultado.encontrado && (
        <div className="mt-8 rounded-lg border border-dashed border-line bg-white/60 px-6 py-10 text-center">
          <p className="text-sm text-ink/60">
            No se encontró ningún registro de capacitaciones aprobadas para el DNI {buscado}.
          </p>
        </div>
      )}

      {loaded && resultado?.encontrado && (
        <div className="mt-6 rounded-lg border border-line bg-white p-4">
          <p className="text-xs text-ink/50">JJC Contratistas Generales S.A.</p>
          <p className="mt-0.5 font-display text-lg font-800 text-ink">
            {resultado.apellidos}, {resultado.nombres}
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
                {resultado.filas.map((f, idx) => (
                  <tr key={idx} className="border-t border-line">
                    <td className="px-3 py-2.5 text-ink">{f.nombreCurso}</td>
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
