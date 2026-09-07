"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { evaluarPregunta, calificarIntento } from "@/lib/scoring";
import { Pregunta } from "@/lib/types";
import { RespuestaDada } from "@/lib/intento-types";

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function textoRespuesta(p: Pregunta, valor: RespuestaDada["valor"]): string {
  if (valor === null || valor === undefined || valor === "") return "Sin responder";
  if (p.tipo === "opcion_multiple") {
    return p.opciones?.find((o) => o.id === valor)?.texto ?? "Sin responder";
  }
  if (p.tipo === "verdadero_falso") return valor ? "Verdadero" : "Falso";
  return String(valor);
}

function textoCorrecta(p: Pregunta): string {
  if (p.tipo === "opcion_multiple") {
    return p.opciones?.find((o) => o.id === p.respuestaCorrecta)?.texto ?? "-";
  }
  if (p.tipo === "verdadero_falso") return p.respuestaCorrecta ? "Verdadero" : "Falso";
  if (p.tipo === "numerica") {
    return `${p.respuestaCorrecta}${p.margenError ? ` (+/- ${p.margenError})` : ""}`;
  }
  return "-";
}

export default function ResultadoDetallePage({
  params,
}: {
  params: { id: string; intentoId: string };
}) {
  const { obtenerCurso, preguntasDeCurso, intentosDeCurso, actualizarIntento, loaded } = useStore();
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [revisionesLocales, setRevisionesLocales] = useState<Record<string, boolean>>({});

  if (!loaded) return null;

  const curso = obtenerCurso(params.id);
  const intento = intentosDeCurso(params.id).find((i) => i.id === params.intentoId);

  if (!curso || !intento) {
    return (
      <div className="text-center">
        <p className="text-sm text-ink/60">No se encontró este resultado.</p>
        <Link
          href={`/cursos/${params.id}`}
          className="mt-3 inline-block text-sm font-medium text-navy-700"
        >
          Volver al curso
        </Link>
      </div>
    );
  }

  const preguntas = preguntasDeCurso(curso.id);
  const aprobado = intento.estado === "aprobado";
  const pendiente = intento.estado === "pendiente_revision";
  const preguntasAbiertas = preguntas.filter((p) => p.tipo === "abierta");
  const faltanPorRevisar = preguntasAbiertas.filter((p) => {
    const rd = intento.respuestas.find((r) => r.preguntaId === p.id);
    return (
      (rd?.revisionManual === undefined || rd?.revisionManual === null) &&
      revisionesLocales[p.id] === undefined
    );
  });

  async function handleDescargarPdf() {
    setGenerandoPdf(true);
    try {
      const { generarConstanciaPdf } = await import("@/lib/pdf/generarConstancia");
      await generarConstanciaPdf(curso!, intento!, preguntas);
    } catch (err) {
      console.error(err);
      alert("No se pudo generar el PDF. Intenta de nuevo.");
    } finally {
      setGenerandoPdf(false);
    }
  }

  async function handleGuardarRevision() {
    setErrorGuardar(null);
    setGuardando(true);
    try {
      const respuestasActualizadas: RespuestaDada[] = intento!.respuestas.map((r) => {
        if (revisionesLocales[r.preguntaId] === undefined) return r;
        return { ...r, revisionManual: revisionesLocales[r.preguntaId] };
      });
      const calificacion = calificarIntento(
        preguntas,
        respuestasActualizadas,
        curso!.notaMinimaAprobatoria
      );
      await actualizarIntento(intento!.id, {
        respuestas: respuestasActualizadas,
        nota: calificacion.nota,
        estado: calificacion.estado,
        puntajeObtenido: calificacion.puntajeObtenido,
        puntajeTotal: calificacion.puntajeTotal,
      });
      setRevisionesLocales({});
    } catch (err: any) {
      setErrorGuardar(err?.message ?? "No se pudo guardar la calificación.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/cursos/${curso.id}`} className="text-sm text-ink/50 hover:text-ink">
        {curso.nombre}
      </Link>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-800 text-ink">
            {intento.nombres} {intento.apellidos}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            DNI {intento.dni} · {formatearFecha(intento.fecha)}
            {intento.instructor && <> · Instructor: {intento.instructor}</>}
          </p>
        </div>
        <div className="text-right">
          <div
            className={`font-display text-2xl font-800 ${
              pendiente ? "text-navy-700" : aprobado ? "text-gold-600" : "text-red-500"
            }`}
          >
            {intento.nota ?? "-"}
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              aprobado
                ? "bg-gold-100 text-gold-600"
                : pendiente
                ? "bg-line text-navy-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {aprobado ? "Aprobado" : pendiente ? "Pendiente de revisión" : "Desaprobado"}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={handleDescargarPdf}
          disabled={generandoPdf || pendiente}
          className="focus-ring rounded-md bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
        >
          {generandoPdf ? "Generando PDF..." : "Descargar constancia PDF"}
        </button>
      </div>
      {pendiente && (
        <p className="mt-2 text-xs text-navy-700">
          La constancia se habilita una vez que califiques las preguntas de respuesta abierta.
        </p>
      )}

      {errorGuardar && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {errorGuardar}
        </div>
      )}

      <ol className="mt-8 space-y-3">
        {preguntas.map((p, i) => {
          const rd = intento.respuestas.find((r) => r.preguntaId === p.id);
          const dada = rd?.valor ?? null;
          const revisionGuardada = rd?.revisionManual;
          const seleccionLocal = revisionesLocales[p.id];
          const correcta = evaluarPregunta(p, dada, seleccionLocal ?? revisionGuardada);

          return (
            <li
              key={p.id}
              className={`rounded-lg border p-4 ${
                correcta === null
                  ? "border-line bg-white"
                  : correcta
                  ? "border-gold-500/40 bg-gold-100/30"
                  : "border-red-300 bg-red-50/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                    correcta === null ? "bg-navy-700" : correcta ? "bg-gold-600" : "bg-red-500"
                  }`}
                >
                  {correcta === null ? "?" : correcta ? "OK" : "X"}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">
                    {i + 1}. {p.enunciado}
                  </p>
                  <p className="mt-1.5 text-sm text-ink/70">
                    Respondió: <span className="font-medium">{textoRespuesta(p, dada)}</span>
                  </p>
                  {correcta === false && p.tipo !== "abierta" && (
                    <p className="mt-0.5 text-sm text-gold-600">
                      Correcta: <span className="font-medium">{textoCorrecta(p)}</span>
                    </p>
                  )}

                  {p.tipo === "abierta" &&
                    (revisionGuardada === undefined || revisionGuardada === null) && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-ink/50">¿Es correcta esta respuesta?</span>
                        <button
                          type="button"
                          onClick={() => setRevisionesLocales((r) => ({ ...r, [p.id]: true }))}
                          className={`focus-ring rounded-md px-3 py-1 text-xs font-medium ${
                            seleccionLocal === true
                              ? "bg-gold-600 text-white"
                              : "border border-line bg-white text-navy-700 hover:bg-paper"
                          }`}
                        >
                          Correcta
                        </button>
                        <button
                          type="button"
                          onClick={() => setRevisionesLocales((r) => ({ ...r, [p.id]: false }))}
                          className={`focus-ring rounded-md px-3 py-1 text-xs font-medium ${
                            seleccionLocal === false
                              ? "bg-red-500 text-white"
                              : "border border-line bg-white text-navy-700 hover:bg-paper"
                          }`}
                        >
                          Incorrecta
                        </button>
                      </div>
                    )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {pendiente && preguntasAbiertas.length > 0 && (
        <div className="mt-6 rounded-lg border border-line bg-white p-4">
          <button
            onClick={handleGuardarRevision}
            disabled={guardando || faltanPorRevisar.length > 0}
            className="focus-ring rounded-md bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-40"
          >
            {guardando ? "Guardando..." : "Guardar calificación final"}
          </button>
          {faltanPorRevisar.length > 0 && (
            <p className="mt-2 text-xs text-ink/50">
              Marca correcta o incorrecta las {faltanPorRevisar.length}{" "}
              {faltanPorRevisar.length === 1
                ? "pregunta abierta pendiente"
                : "preguntas abiertas pendientes"}{" "}
              antes de guardar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
