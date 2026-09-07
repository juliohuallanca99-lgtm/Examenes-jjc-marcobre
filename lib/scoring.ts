import { Pregunta } from "./types";
import { RespuestaDada } from "./intento-types";

export function evaluarPregunta(
  p: Pregunta,
  valor: string | boolean | number | null,
  revisionManual?: boolean | null
): boolean | null {
  if (p.tipo === "abierta") return revisionManual ?? null;
  if (p.tipo === "opcion_multiple") {
    return valor !== null && valor === p.respuestaCorrecta;
  }
  if (p.tipo === "verdadero_falso") {
    return typeof valor === "boolean" && valor === p.respuestaCorrecta;
  }
  if (p.tipo === "numerica") {
    const correcto = typeof p.respuestaCorrecta === "number" ? p.respuestaCorrecta : null;
    const margen = p.margenError ?? 0;
    if (correcto === null || typeof valor !== "number") return false;
    return Math.abs(valor - correcto) <= margen;
  }
  return false;
}

export interface ResultadoCalificacion {
  puntajeObtenido: number;
  puntajeTotal: number;
  nota: number | null;
  tienePendientes: boolean;
  estado: "aprobado" | "desaprobado" | "pendiente_revision";
}

export function calificarIntento(
  preguntas: Pregunta[],
  respuestas: RespuestaDada[],
  notaMinima: number
): ResultadoCalificacion {
  let puntajeObtenido = 0;
  let puntajeTotal = 0;
  let tienePendientes = false;

  for (const p of preguntas) {
    puntajeTotal += p.puntaje;
    const rd = respuestas.find((r) => r.preguntaId === p.id);
    const dada = rd?.valor ?? null;

    if (p.tipo === "abierta") {
      if (rd?.revisionManual === undefined || rd?.revisionManual === null) {
        tienePendientes = true;
        continue;
      }
      if (rd.revisionManual) puntajeObtenido += p.puntaje;
      continue;
    }

    if (evaluarPregunta(p, dada)) {
      puntajeObtenido += p.puntaje;
    }
  }

  if (tienePendientes) {
    return {
      puntajeObtenido,
      puntajeTotal,
      nota: null,
      tienePendientes,
      estado: "pendiente_revision",
    };
  }

  const nota = puntajeTotal > 0 ? Math.round((puntajeObtenido / puntajeTotal) * 20 * 10) / 10 : 0;
  return {
    puntajeObtenido,
    puntajeTotal,
    nota,
    tienePendientes,
    estado: nota >= notaMinima ? "aprobado" : "desaprobado",
  };
}
