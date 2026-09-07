"use client";

import { Pregunta, TIPO_LABELS } from "@/lib/types";

function resumenRespuesta(p: Pregunta): string {
  if (p.tipo === "opcion_multiple") {
    const correcta = p.opciones?.find((o) => o.id === p.respuestaCorrecta);
    return correcta ? `Correcta: ${correcta.texto}` : "Sin respuesta correcta marcada";
  }
  if (p.tipo === "verdadero_falso") {
    return `Correcta: ${p.respuestaCorrecta ? "Verdadero" : "Falso"}`;
  }
  if (p.tipo === "numerica") {
    return `Correcta: ${p.respuestaCorrecta}${p.margenError ? ` (+/- ${p.margenError})` : ""}`;
  }
  return "Requiere revisión manual";
}

export default function QuestionList({
  preguntas,
  onEdit,
  onDelete,
}: {
  preguntas: Pregunta[];
  onEdit: (p: Pregunta) => void;
  onDelete: (id: string) => void;
}) {
  if (preguntas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white/60 px-6 py-10 text-center">
        <p className="text-sm text-ink/60">Todavía no hay preguntas en este curso.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {preguntas.map((p, i) => (
        <li key={p.id} className="rounded-lg border border-line bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-900 text-[11px] font-medium text-white">
                  {i + 1}
                </span>
                <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-medium text-ink/60">
                  {TIPO_LABELS[p.tipo]}
                </span>
                <span className="text-[11px] font-medium text-gold-600">
                  {p.puntaje} {p.puntaje === 1 ? "punto" : "puntos"}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink">{p.enunciado}</p>
              <p className="mt-1 text-xs text-ink/50">{resumenRespuesta(p)}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => onEdit(p)}
                className="focus-ring rounded-md px-2 py-1 text-xs font-medium text-navy-700 hover:bg-navy-900/5"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="focus-ring rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Eliminar
              </button>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
