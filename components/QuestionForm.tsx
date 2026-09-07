"use client";

import { useState } from "react";
import { Opcion, Pregunta, TipoPregunta, TIPO_LABELS } from "@/lib/types";

const TIPOS: TipoPregunta[] = ["opcion_multiple", "verdadero_falso", "numerica", "abierta"];

function uid(): string {
  return Math.random().toString(36).slice(2, 8);
}

interface Props {
  cursoId: string;
  siguienteOrden: number;
  initial?: Pregunta;
  onSave: (pregunta: Omit<Pregunta, "id" | "cursoId" | "orden">) => void;
  onCancel: () => void;
}

export default function QuestionForm({ initial, onSave, onCancel }: Props) {
  const [tipo, setTipo] = useState<TipoPregunta>(initial?.tipo ?? "opcion_multiple");
  const [enunciado, setEnunciado] = useState(initial?.enunciado ?? "");
  const [puntaje, setPuntaje] = useState(initial?.puntaje ?? 1);
  const [opciones, setOpciones] = useState<Opcion[]>(
    initial?.opciones ?? [
      { id: uid(), texto: "" },
      { id: uid(), texto: "" },
    ]
  );
  const [correctaMultiple, setCorrectaMultiple] = useState<string>(
    typeof initial?.respuestaCorrecta === "string" ? initial.respuestaCorrecta : ""
  );
  const [correctaVF, setCorrectaVF] = useState<boolean>(
    typeof initial?.respuestaCorrecta === "boolean" ? initial.respuestaCorrecta : true
  );
  const [correctaNumerica, setCorrectaNumerica] = useState<number>(
    typeof initial?.respuestaCorrecta === "number" ? initial.respuestaCorrecta : 0
  );
  const [margenError, setMargenError] = useState<number>(initial?.margenError ?? 0);

  function actualizarOpcion(id: string, texto: string) {
    setOpciones((ops) => ops.map((o) => (o.id === id ? { ...o, texto } : o)));
  }
  function agregarOpcion() {
    setOpciones((ops) => [...ops, { id: uid(), texto: "" }]);
  }
  function quitarOpcion(id: string) {
    setOpciones((ops) => ops.filter((o) => o.id !== id));
    if (correctaMultiple === id) setCorrectaMultiple("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enunciado.trim()) return;

    let respuestaCorrecta: Pregunta["respuestaCorrecta"] = null;
    let opcionesFinal: Opcion[] | undefined = undefined;
    let margenFinal: number | undefined = undefined;

    if (tipo === "opcion_multiple") {
      opcionesFinal = opciones.filter((o) => o.texto.trim() !== "");
      respuestaCorrecta = correctaMultiple || null;
    } else if (tipo === "verdadero_falso") {
      respuestaCorrecta = correctaVF;
    } else if (tipo === "numerica") {
      respuestaCorrecta = correctaNumerica;
      margenFinal = margenError;
    }

    onSave({
      tipo,
      enunciado: enunciado.trim(),
      puntaje,
      opciones: opcionesFinal,
      respuestaCorrecta,
      margenError: margenFinal,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="grid grid-cols-[1fr_auto] gap-4">
        <div>
          <label className="block text-sm font-medium text-ink">Tipo de pregunta</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoPregunta)}
            className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm"
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {TIPO_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Puntaje</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={puntaje}
            onChange={(e) => setPuntaje(Number(e.target.value))}
            className="focus-ring mt-1.5 w-24 rounded-md border border-line bg-white px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-ink">Enunciado</label>
        <textarea
          value={enunciado}
          onChange={(e) => setEnunciado(e.target.value)}
          rows={2}
          placeholder="Escribe la pregunta tal como la verá el trabajador"
          className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm"
          required
        />
      </div>

      {tipo === "opcion_multiple" && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-ink">
            Opciones <span className="text-ink/40">(marca la correcta)</span>
          </label>
          <div className="mt-1.5 space-y-2">
            {opciones.map((op, i) => (
              <div key={op.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correcta"
                  checked={correctaMultiple === op.id}
                  onChange={() => setCorrectaMultiple(op.id)}
                  className="h-4 w-4 accent-gold-600"
                />
                <input
                  value={op.texto}
                  onChange={(e) => actualizarOpcion(op.id, e.target.value)}
                  placeholder={`Opción ${i + 1}`}
                  className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                />
                {opciones.length > 2 && (
                  <button
                    type="button"
                    onClick={() => quitarOpcion(op.id)}
                    className="focus-ring px-2 text-ink/40 hover:text-ink"
                    aria-label="Quitar opción"
                  >
                    X
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={agregarOpcion}
            className="focus-ring mt-2 text-sm font-medium text-navy-700 hover:text-navy-900"
          >
            + Agregar opción
          </button>
        </div>
      )}

      {tipo === "verdadero_falso" && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-ink">Respuesta correcta</label>
          <div className="mt-1.5 flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="vf"
                checked={correctaVF === true}
                onChange={() => setCorrectaVF(true)}
                className="h-4 w-4 accent-gold-600"
              />
              Verdadero
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="vf"
                checked={correctaVF === false}
                onChange={() => setCorrectaVF(false)}
                className="h-4 w-4 accent-gold-600"
              />
              Falso
            </label>
          </div>
        </div>
      )}

      {tipo === "numerica" && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink">Valor correcto</label>
            <input
              type="number"
              value={correctaNumerica}
              onChange={(e) => setCorrectaNumerica(Number(e.target.value))}
              className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">
              Margen de error <span className="text-ink/40">(+/-)</span>
            </label>
            <input
              type="number"
              min={0}
              value={margenError}
              onChange={(e) => setMargenError(Number(e.target.value))}
              className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm"
            />
          </div>
        </div>
      )}

      {tipo === "abierta" && (
        <p className="mt-4 rounded-md bg-gold-100/60 px-3 py-2.5 text-sm text-navy-900">
          Esta pregunta no se califica sola: el examen quedará pendiente de revisión hasta que tú la
          evalúes manualmente.
        </p>
      )}

      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          className="focus-ring rounded-md bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
        >
          {initial ? "Guardar cambios" : "Agregar pregunta"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="focus-ring rounded-md px-4 py-2.5 text-sm font-medium text-ink/60 hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
