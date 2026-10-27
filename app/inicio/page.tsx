"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Intento } from "@/lib/intento-types";

const UN_ANIO_MS = 365 * 24 * 60 * 60 * 1000;
const DIAS_AVISO = 30;

// Los colores salen de las variables que define globals.css, que tienen un
// valor distinto en modo claro y en oscuro: los tonos claros sobre fondo
// oscuro pierden contraste y dejan de distinguirse. Ambas ternas estan
// verificadas para daltonismo. El segundo valor es el respaldo, por si esta
// pagina se sube antes que ese archivo.
const COLOR_APROBADO = "var(--grafico-aprobado, #00A080)";
const COLOR_DESAPROBADO = "var(--grafico-desaprobado, #A01008)";
const COLOR_PENDIENTE = "var(--grafico-pendiente, #3A5BC7)";

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
  return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function nombreMes(clave: string): string {
  const [anio, mes] = clave.split("-").map(Number);
  return new Date(anio, mes - 1, 1)
    .toLocaleDateString("es-PE", { month: "short", year: "2-digit" })
    .replace(".", "");
}

export default function InicioPage() {
  const { cursos, intentos, carpetas, loaded, error } = useStore();

  const resultados = useMemo(() => {
    let aprobados = 0;
    let desaprobados = 0;
    let pendientes = 0;
    for (const i of intentos) {
      if (i.estado === "aprobado") aprobados++;
      else if (i.estado === "desaprobado") desaprobados++;
      else if (i.estado === "pendiente_revision") pendientes++;
    }
    const calificados = aprobados + desaprobados;
    return {
      aprobados,
      desaprobados,
      pendientes,
      // El porcentaje se mide sobre los examenes ya calificados: incluir los
      // pendientes de revision lo haria bajar por algo que todavia no se evaluo.
      porcentajeAprobacion: calificados > 0 ? Math.round((aprobados / calificados) * 100) : 0,
    };
  }, [intentos]);

  // Cuanta gente rindio cada curso. Se cuentan personas distintas por DNI, no
  // examenes: quien repite un curso sigue siendo un solo trabajador capacitado.
  const cursosMasRendidos = useMemo(() => {
    const personasPorCurso = new Map<string, Set<string>>();
    const examenesPorCurso = new Map<string, number>();

    for (const i of intentos) {
      const dni = i.dni?.trim();
      if (!dni) continue;
      let gente = personasPorCurso.get(i.cursoId);
      if (!gente) {
        gente = new Set<string>();
        personasPorCurso.set(i.cursoId, gente);
      }
      gente.add(dni);
      examenesPorCurso.set(i.cursoId, (examenesPorCurso.get(i.cursoId) ?? 0) + 1);
    }

    const nombreCurso = new Map(cursos.map((c) => [c.id, c.nombre]));
    const filas = Array.from(personasPorCurso.entries())
      .map(([cursoId, gente]) => ({
        cursoId,
        nombre: nombreCurso.get(cursoId) ?? "(curso eliminado)",
        personas: gente.size,
        examenes: examenesPorCurso.get(cursoId) ?? 0,
      }))
      .sort((a, b) => b.personas - a.personas);

    const mayor = filas.length > 0 ? filas[0].personas : 1;
    return {
      total: filas.length,
      filas: filas.slice(0, 10).map((f) => ({ ...f, porcentaje: Math.round((f.personas / mayor) * 100) })),
    };
  }, [cursos, intentos]);

  // Una capacitacion vale un año desde la fecha del examen aprobado. Si un
  // trabajador rindio el mismo curso varias veces solo cuenta la ultima
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
      if (!previa || new Date(intento.fecha) > new Date(previa.fecha)) ultimas.set(clave, intento);
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
  const vencidas = useMemo(() => capacitaciones.filter((c) => c.vigencia === "vencido"), [capacitaciones]);
  const trabajadores = useMemo(() => new Set(capacitaciones.map((c) => c.dni)).size, [capacitaciones]);
  const cursosActivos = cursos.filter((c) => c.activo).length;

  // Examenes rendidos mes a mes, para ver como avanza la capacitacion.
  const porMes = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const i of intentos) {
      if (!i.fecha) continue;
      const d = new Date(i.fecha);
      conteo.set(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        (conteo.get(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`) ?? 0) + 1
      );
    }
    const filas = Array.from(conteo.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([clave, total]) => ({ clave, total }));
    const mayor = filas.reduce((m, f) => Math.max(m, f.total), 1);
    return filas.map((f) => ({ ...f, porcentaje: Math.round((f.total / mayor) * 100) }));
  }, [intentos]);

  // Reparto de resultados dentro de cada carpeta.
  const porCarpeta = useMemo(() => {
    const carpetaDeCurso = new Map(cursos.map((c) => [c.id, c.carpetaId]));
    const nombreCarpeta = new Map(carpetas.map((c) => [c.id, c.nombre]));
    const acum = new Map<string, { aprobados: number; desaprobados: number; pendientes: number }>();

    for (const i of intentos) {
      const carpetaId = carpetaDeCurso.get(i.cursoId) ?? null;
      const nombre = carpetaId ? nombreCarpeta.get(carpetaId) ?? "Sin carpeta" : "Sin carpeta";
      const fila = acum.get(nombre) ?? { aprobados: 0, desaprobados: 0, pendientes: 0 };
      if (i.estado === "aprobado") fila.aprobados++;
      else if (i.estado === "desaprobado") fila.desaprobados++;
      else if (i.estado === "pendiente_revision") fila.pendientes++;
      acum.set(nombre, fila);
    }

    return Array.from(acum.entries())
      .map(([nombre, v]) => ({ nombre, ...v, total: v.aprobados + v.desaprobados + v.pendientes }))
      .sort((a, b) => b.total - a.total);
  }, [cursos, carpetas, intentos]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        No se pudo conectar con la base de datos: {error}
      </div>
    );
  }

  const leyenda = [
    { etiqueta: "Aprobados", color: COLOR_APROBADO },
    { etiqueta: "Desaprobados", color: COLOR_DESAPROBADO },
    { etiqueta: "Pendientes", color: COLOR_PENDIENTE },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel de control</h1>
          <p className="mt-1 text-sm text-slate-500">
            Estado de las capacitaciones del proyecto CC0174 · actualizado al{" "}
            {new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
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
            <article className="rounded-xl border border-slate-200 border-t-4 border-t-navy-800 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exámenes rendidos</p>
              <p className="mt-1.5 text-3xl font-bold tracking-tight text-slate-800">
                {intentos.length.toLocaleString("es-PE")}
              </p>
              <p className="mt-1 text-xs text-slate-500">{trabajadores.toLocaleString("es-PE")} trabajadores</p>
            </article>

            <article className="rounded-xl border border-slate-200 border-t-4 border-t-verde-500 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aprobación</p>
              <p className="mt-1.5 text-3xl font-bold tracking-tight text-verde-600">
                {resultados.porcentajeAprobacion}%
              </p>
              <p className="mt-1 text-xs text-slate-500">
                sobre {(resultados.aprobados + resultados.desaprobados).toLocaleString("es-PE")} calificados
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 border-t-4 border-t-navy-600 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cursos activos</p>
              <p className="mt-1.5 text-3xl font-bold tracking-tight text-slate-800">{cursosActivos}</p>
              <p className="mt-1 text-xs text-slate-500">de {cursos.length} creados</p>
            </article>

            <article className="rounded-xl border border-slate-200 border-t-4 border-t-ambar-500 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vencen en 30 días</p>
              <p className="mt-1.5 text-3xl font-bold tracking-tight text-ambar-600">{porVencer.length}</p>
              <p className="mt-1 text-xs text-slate-500">{vencidas.length} ya vencidas</p>
            </article>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Cuanta gente paso por cada curso */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-bold text-slate-800">Cursos más rendidos</h2>
                <span className="text-xs text-slate-500">
                  {cursosMasRendidos.filas.length} de {cursosMasRendidos.total}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">Trabajadores distintos que rindieron cada evaluación</p>

              {cursosMasRendidos.filas.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">Todavía no hay exámenes rendidos.</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {cursosMasRendidos.filas.map((f) => (
                    <li key={f.cursoId} className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <Link
                          href={`/cursos/${f.cursoId}`}
                          className="focus-ring min-w-0 truncate font-medium text-slate-700 hover:underline"
                          title={f.nombre}
                        >
                          {f.nombre}
                        </Link>
                        <span className="shrink-0 text-slate-500">
                          <strong className="font-bold text-slate-800">
                            {f.personas.toLocaleString("es-PE")}
                          </strong>{" "}
                          {f.personas === 1 ? "persona" : "personas"}
                          {f.examenes > f.personas && (
                            <span className="text-slate-400"> · {f.examenes} exámenes</span>
                          )}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${f.porcentaje}%`, backgroundColor: COLOR_APROBADO }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Examenes por mes */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-800">Exámenes rendidos por mes</h2>
              <p className="mt-0.5 text-sm text-slate-500">Últimos {porMes.length} meses con actividad</p>
              {porMes.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">Todavía no hay exámenes rendidos.</p>
              ) : (
                <div className="mt-5 flex h-44 items-end gap-2">
                  {porMes.map((m) => (
                    <div key={m.clave} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-700">
                        {m.total.toLocaleString("es-PE")}
                      </span>
                      <div
                        className="w-full rounded-t bg-navy-700"
                        style={{ height: `${Math.max(m.porcentaje, 3)}%` }}
                        title={`${nombreMes(m.clave)}: ${m.total} exámenes`}
                      />
                      <span className="truncate text-xs text-slate-500">{nombreMes(m.clave)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Estado por carpeta, en barras apiladas */}
          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-800">Estado por carpeta</h2>
              <ul className="flex flex-wrap gap-4 text-xs">
                {leyenda.map((s) => (
                  <li key={s.etiqueta} className="flex items-center gap-1.5 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} aria-hidden="true" />
                    {s.etiqueta}
                  </li>
                ))}
              </ul>
            </div>

            {porCarpeta.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Todavía no hay exámenes rendidos.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                {porCarpeta.map((fila) => (
                  <div key={fila.nombre} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-semibold text-slate-700">{fila.nombre}</span>
                      <span className="shrink-0 text-slate-500">
                        {fila.total.toLocaleString("es-PE")} exámenes
                      </span>
                    </div>
                    <div className="flex h-6 gap-0.5 overflow-hidden rounded">
                      {[
                        { v: fila.aprobados, c: COLOR_APROBADO, n: "Aprobados" },
                        { v: fila.desaprobados, c: COLOR_DESAPROBADO, n: "Desaprobados" },
                        { v: fila.pendientes, c: COLOR_PENDIENTE, n: "Pendientes de revisión" },
                      ]
                        .filter((p) => p.v > 0)
                        .map((p) => (
                          <div
                            key={p.n}
                            className="flex items-center justify-center text-xs font-semibold text-white"
                            style={{ width: `${(p.v / fila.total) * 100}%`, backgroundColor: p.c }}
                            title={`${p.n}: ${p.v}`}
                          >
                            {(p.v / fila.total) * 100 > 7 ? p.v.toLocaleString("es-PE") : ""}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Vencimientos */}
          <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                      <th className="px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">Trabajador</th>
                      <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">Curso</th>
                      <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">Vence</th>
                      <th className="px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">Faltan</th>
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
                          <Link href={`/cursos/${c.cursoId}`} className="focus-ring text-sm text-slate-600 hover:underline">
                            {c.curso}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{formatearFecha(c.vence)}</td>
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
        </>
      )}
    </div>
  );
}
