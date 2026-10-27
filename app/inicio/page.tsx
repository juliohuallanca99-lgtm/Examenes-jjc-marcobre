"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Intento } from "@/lib/intento-types";

const UN_ANIO_MS = 365 * 24 * 60 * 60 * 1000;
const DIAS_AVISO = 30;

type Vigencia = "vigente" | "por_vencer" | "vencido";

interface Capacitacion {
  clave: string;
  dni: string;
  trabajador: string;
  cursoId: string;
  curso: string;
  vence: Date;
  diasRestantes: number;
  vigencia: Vigencia;
}

function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function InicioPage() {
  const { cursos, intentos, carpetas, loaded, error } = useStore();

  // Una capacitacion vale un año desde la fecha del examen aprobado. Si un
  // trabajador rindio el mismo curso varias veces, solo cuenta la ultima
  // aprobacion: las anteriores ya quedaron reemplazadas.
  const capacitaciones = useMemo<Capacitacion[]>(() => {
    const nombreCurso = new Map(cursos.map((c) => [c.id, c.nombre]));
    const ultimas = new Map<string, Intento>();

    for (const intento of intentos) {
      if (intento.estado !== "aprobado" || !intento.fecha) continue;
      const dni = intento.dni?.trim();
      if (!dni) continue;

      const clave = `${dni}|${intento.cursoId}`;
      const previa = ultimas.get(clave);
      if (!previa || new Date(intento.fecha) > new Date(previa.fecha)) {
        ultimas.set(clave, intento);
      }
    }

    const ahora = Date.now();
    return Array.from(ultimas.entries()).map(([clave, intento]) => {
      const vence = new Date(new Date(intento.fecha).getTime() + UN_ANIO_MS);
      const diasRestantes = Math.ceil((vence.getTime() - ahora) / (24 * 60 * 60 * 1000));
      const vigencia: Vigencia =
        diasRestantes < 0 ? "vencido" : diasRestantes <= DIAS_AVISO ? "por_vencer" : "vigente";

      return {
        clave,
        dni: intento.dni.trim(),
        trabajador: `${intento.apellidos}, ${intento.nombres}`.trim(),
        cursoId: intento.cursoId,
        curso: nombreCurso.get(intento.cursoId) ?? "(curso eliminado)",
        vence,
        diasRestantes,
        vigencia,
      };
    });
  }, [cursos, intentos]);

  const porVencer = useMemo(
    () =>
      capacitaciones
        .filter((c) => c.vigencia === "por_vencer")
        .sort((a, b) => a.diasRestantes - b.diasRestantes),
    [capacitaciones]
  );

  const vencidas = useMemo(
    () => capacitaciones.filter((c) => c.vigencia === "vencido"),
    [capacitaciones]
  );

  const trabajadores = useMemo(
    () => new Set(capacitaciones.map((c) => c.dni)).size,
    [capacitaciones]
  );

  const cursosActivos = cursos.filter((c) => c.activo).length;

  // Cuantos examenes se rindieron en cada carpeta, para ver donde se concentra
  // la capacitacion. Los cursos sueltos se agrupan como "Sin carpeta".
  const porCarpeta = useMemo(() => {
    const carpetaDeCurso = new Map(cursos.map((c) => [c.id, c.carpetaId]));
    const nombreCarpeta = new Map(carpetas.map((c) => [c.id, c.nombre]));
    const conteo = new Map<string, number>();

    for (const intento of intentos) {
      const carpetaId = carpetaDeCurso.get(intento.cursoId) ?? null;
      const nombre = carpetaId ? nombreCarpeta.get(carpetaId) ?? "Sin carpeta" : "Sin carpeta";
      conteo.set(nombre, (conteo.get(nombre) ?? 0) + 1);
    }

    const filas = Array.from(conteo.entries())
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total);

    const mayor = filas.length > 0 ? filas[0].total : 1;
    return filas.map((f) => ({ ...f, porcentaje: Math.round((f.total / mayor) * 100) }));
  }, [cursos, carpetas, intentos]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        No se pudo conectar con la base de datos: {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel de control</h1>
          <p className="mt-1 text-sm text-slate-500">
            Estado de las capacitaciones del proyecto CC0174.
          </p>
        </div>
        <Link
          href="/estadisticas"
          className="focus-ring rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ver estadísticas
        </Link>
      </div>

      {!loaded ? (
        <p className="mt-10 text-sm text-slate-400">Cargando datos…</p>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Exámenes rendidos</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-800">
                {intentos.length.toLocaleString("es-PE")}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {trabajadores.toLocaleString("es-PE")} trabajadores
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Cursos activos</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-800">
                {cursosActivos}
              </p>
              <p className="mt-1 text-xs text-slate-500">de {cursos.length} creados</p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Vencen en 30 días</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-ambar-600">
                {porVencer.length.toLocaleString("es-PE")}
              </p>
              <p className="mt-1 text-xs font-medium text-ambar-600">Requieren recapacitación</p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Ya vencidas</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-red-700">
                {vencidas.length.toLocaleString("es-PE")}
              </p>
              <p className="mt-1 text-xs font-medium text-red-700">Brecha de cumplimiento</p>
            </article>
          </div>

          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Vencimientos próximos</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Capacitaciones que caducan dentro de {DIAS_AVISO} días
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {porVencer.length}
              </span>
            </div>

            {porVencer.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                Ninguna capacitación vence en los próximos {DIAS_AVISO} días.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 640 }}>
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        Trabajador
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        Curso
                      </th>
                      <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        Vence
                      </th>
                      <th className="px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        Faltan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {porVencer.slice(0, 12).map((c) => (
                      <tr key={c.clave} className="border-t border-slate-100">
                        <td className="px-5 py-3">
                          <p className="text-sm font-semibold text-slate-800">{c.trabajador}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{c.dni}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/cursos/${c.cursoId}`}
                            className="focus-ring text-sm text-slate-600 hover:underline"
                          >
                            {c.curso}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {formatearFecha(c.vence)}
                        </td>
                        <td className="px-5 py-3">
                          <span className="whitespace-nowrap rounded-full bg-ambar-100 px-2.5 py-1 text-xs font-semibold text-ambar-600">
                            {c.diasRestantes} {c.diasRestantes === 1 ? "día" : "días"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {porVencer.length > 12 && (
                  <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                    Se muestran los 12 más próximos de {porVencer.length}.
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-800">Exámenes por carpeta</h2>
            {porCarpeta.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Todavía no hay exámenes rendidos.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3.5">
                {porCarpeta.map((fila) => (
                  <div key={fila.nombre} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-semibold text-slate-700">{fila.nombre}</span>
                      <span className="shrink-0 text-slate-500">
                        {fila.total.toLocaleString("es-PE")} exámenes
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-verde-500"
                        style={{ width: `${fila.porcentaje}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
