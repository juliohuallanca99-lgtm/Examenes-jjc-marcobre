"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MetricaHero({
  etiqueta,
  valor,
  tono,
}: {
  etiqueta: string;
  valor: string | number;
  tono: "neutro" | "verde" | "rojo";
}) {
  const fondos = { neutro: "bg-white/5", verde: "bg-green-500/10", rojo: "bg-red-500/10" };
  const etiquetaColor = {
    neutro: "text-white/50",
    verde: "text-green-300",
    rojo: "text-red-300",
  };
  return (
    <div className={`rounded-lg ${fondos[tono]} p-3.5`}>
      <p className={`text-[11px] ${etiquetaColor[tono]}`}>{etiqueta}</p>
      <p className="mt-0.5 font-display text-xl font-800 text-white">{valor}</p>
    </div>
  );
}

export default function EstadisticasPage() {
  const { rol, cargando } = useAuth();
  const { cursos, intentos, intentosDeCurso, loaded } = useStore();

  const totales = useMemo(() => {
    const aprobados = intentos.filter((i) => i.estado === "aprobado").length;
    const desaprobados = intentos.filter((i) => i.estado === "desaprobado").length;
    const pendientes = intentos.filter((i) => i.estado === "pendiente_revision").length;
    const calificados = aprobados + desaprobados;
    const porcentajeAprobacion = calificados > 0 ? Math.round((aprobados / calificados) * 100) : 0;
    return {
      totalCursos: cursos.length,
      cursosActivos: cursos.filter((c) => c.activo).length,
      totalIntentos: intentos.length,
      aprobados,
      desaprobados,
      pendientes,
      porcentajeAprobacion,
    };
  }, [cursos, intentos]);

  const statsPorCurso = useMemo(() => {
    return cursos
      .map((curso) => {
        const intentosCurso = intentosDeCurso(curso.id);
        const aprobados = intentosCurso.filter((i) => i.estado === "aprobado").length;
        const desaprobados = intentosCurso.filter((i) => i.estado === "desaprobado").length;
        const pendientes = intentosCurso.filter((i) => i.estado === "pendiente_revision").length;
        const notasValidas = intentosCurso.filter((i) => i.nota !== null).map((i) => i.nota as number);
        const notaPromedio =
          notasValidas.length > 0
            ? Math.round((notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length) * 10) / 10
            : null;
        return {
          curso,
          total: intentosCurso.length,
          aprobados,
          desaprobados,
          pendientes,
          notaPromedio,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [cursos, intentosDeCurso]);

  const actividadReciente = useMemo(() => {
    return [...intentos]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 15)
      .map((i) => ({
        intento: i,
        curso: cursos.find((c) => c.id === i.cursoId)?.nombre ?? "(curso eliminado)",
      }));
  }, [intentos, cursos]);

  if (cargando || !loaded) return null;

  if (rol !== "admin" && rol !== "editor") {
    return (
      <div className="text-center">
        <p className="text-sm text-ink/60">No tienes acceso a esta página.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-navy-700">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/" className="text-sm text-ink/50 hover:text-ink">
        Cursos
      </Link>

      <div className="mt-4 rounded-2xl bg-navy-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gold-500">
              JJC Contratistas Generales
            </p>
            <h1 className="mt-0.5 font-display text-xl font-800 text-white">
              Estadísticas del sistema · CC0174
            </h1>
          </div>
          <span className="shrink-0 rounded-full bg-gold-500/15 px-3 py-1.5 text-xs font-medium text-gold-500">
            {totales.porcentajeAprobacion}% de aprobación
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          <MetricaHero
            etiqueta="Cursos activos"
            valor={`${totales.cursosActivos}/${totales.totalCursos}`}
            tono="neutro"
          />
          <MetricaHero etiqueta="Rendidos" valor={totales.totalIntentos} tono="neutro" />
          <MetricaHero etiqueta="Aprobados" valor={totales.aprobados} tono="verde" />
          <MetricaHero etiqueta="Desaprobados" valor={totales.desaprobados} tono="rojo" />
          <MetricaHero etiqueta="Pendientes" valor={totales.pendientes} tono="neutro" />
        </div>
      </div>

      <h2 className="mt-10 font-display text-base font-700 text-ink">Avance por curso</h2>
      {statsPorCurso.length === 0 ? (
        <p className="mt-3 text-sm text-ink/50">Todavía no hay cursos creados.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full text-left text-sm" style={{ minWidth: 640 }}>
            <thead className="bg-paper text-xs text-ink/50">
              <tr>
                <th className="px-4 py-2 font-medium">Curso</th>
                <th className="px-4 py-2 font-medium">Rendidos</th>
                <th className="px-4 py-2 font-medium">Aprobados</th>
                <th className="px-4 py-2 font-medium">Desaprobados</th>
                <th className="px-4 py-2 font-medium">Pendientes</th>
                <th className="px-4 py-2 font-medium">Nota promedio</th>
              </tr>
            </thead>
            <tbody>
              {statsPorCurso.map((s) => (
                <tr key={s.curso.id} className="border-t border-line">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/cursos/${s.curso.id}`}
                      className="font-medium text-ink hover:text-navy-700"
                    >
                      {s.curso.nombre}
                    </Link>
                    {!s.curso.activo && (
                      <span className="ml-2 rounded-full bg-line px-1.5 py-0.5 text-[10px] font-medium text-ink/50">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-ink/70">{s.total}</td>
                  <td className="px-4 py-2.5 text-gold-600">{s.aprobados}</td>
                  <td className="px-4 py-2.5 text-red-500">{s.desaprobados}</td>
                  <td className="px-4 py-2.5 text-navy-700">{s.pendientes}</td>
                  <td className="px-4 py-2.5 text-ink/70">{s.notaPromedio ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-10 font-display text-base font-700 text-ink">Actividad reciente</h2>
      {actividadReciente.length === 0 ? (
        <p className="mt-3 text-sm text-ink/50">Todavía no hay exámenes rendidos.</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-lg border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs text-ink/50">
              <tr>
                <th className="px-4 py-2 font-medium">Trabajador</th>
                <th className="px-4 py-2 font-medium">Curso</th>
                <th className="px-4 py-2 font-medium">Nota</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {actividadReciente.map(({ intento, curso }) => (
                <tr
                  key={intento.id}
                  onClick={() =>
                    (window.location.href = `/cursos/${intento.cursoId}/resultados/${intento.id}`)
                  }
                  className="cursor-pointer border-t border-line hover:bg-paper"
                >
                  <td className="px-4 py-2.5 text-ink">
                    {intento.nombres} {intento.apellidos}
                  </td>
                  <td className="px-4 py-2.5 text-ink/70">{curso}</td>
                  <td className="px-4 py-2.5 font-medium text-ink">{intento.nota ?? "-"}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        intento.estado === "aprobado"
                          ? "bg-gold-100 text-gold-600"
                          : intento.estado === "pendiente_revision"
                          ? "bg-line text-navy-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {intento.estado === "aprobado"
                        ? "Aprobado"
                        : intento.estado === "pendiente_revision"
                        ? "Pendiente"
                        : "Desaprobado"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink/50">{formatearFecha(intento.fecha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
