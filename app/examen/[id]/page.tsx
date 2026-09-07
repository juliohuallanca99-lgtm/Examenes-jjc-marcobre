"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { calificarIntento } from "@/lib/scoring";
import { RespuestaDada } from "@/lib/intento-types";

type Paso = "identificacion" | "examen" | "resultado";

export default function ExamenPage({ params }: { params: { id: string } }) {
  const { obtenerCurso, preguntasDeCurso, crearIntento, loaded } = useStore();
  const [paso, setPaso] = useState<Paso>("identificacion");
  const [dni, setDni] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [instructor, setInstructor] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [respuestas, setRespuestas] = useState<Record<string, string | boolean | number | null>>({});
  const [faltantes, setFaltantes] = useState<string[]>([]);
  const [resultado, setResultado] = useState<ReturnType<typeof calificarIntento> | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const curso = obtenerCurso(params.id);
  const preguntas = useMemo(
    () => (curso ? preguntasDeCurso(curso.id) : []),
    [curso, preguntasDeCurso]
  );

  if (!loaded) return null;

  if (!curso || !curso.activo) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="font-display text-lg font-700 text-ink">Examen no disponible</p>
        <p className="mt-2 text-sm text-ink/60">
          Este examen no existe o todavía no está habilitado. Consulta con tu supervisor.
        </p>
      </div>
    );
  }

  if (preguntas.length === 0) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="font-display text-lg font-700 text-ink">Examen no disponible</p>
        <p className="mt-2 text-sm text-ink/60">
          Este curso todavía no tiene preguntas cargadas. Consulta con tu supervisor.
        </p>
      </div>
    );
  }

  function handleIniciar(e: React.FormEvent) {
    e.preventDefault();
    if (!dni.trim() || !nombres.trim() || !apellidos.trim()) return;
    setPaso("examen");
  }

  function actualizarRespuesta(preguntaId: string, valor: string | boolean | number | null) {
    setRespuestas((r) => ({ ...r, [preguntaId]: valor }));
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    const sinResponder = preguntas.filter((p) => {
      const v = respuestas[p.id];
      return v === undefined || v === null || v === "";
    });
    if (sinResponder.length > 0) {
      setFaltantes(sinResponder.map((p) => p.id));
      return;
    }
    setFaltantes([]);
    setErrorEnvio(null);
    setEnviando(true);

    const respuestasArray: RespuestaDada[] = preguntas.map((p) => ({
      preguntaId: p.id,
      valor: respuestas[p.id] ?? null,
    }));

    const calificacion = calificarIntento(preguntas, respuestasArray, curso!.notaMinimaAprobatoria);

    const ahora = new Date();
    const [anio, mes, dia] = fecha.split("-").map(Number);
    const fechaFinal = new Date(
      anio,
      mes - 1,
      dia,
      ahora.getHours(),
      ahora.getMinutes(),
      ahora.getSeconds()
    );

    try {
      await crearIntento({
        cursoId: curso!.id,
        dni: dni.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        instructor: instructor.trim(),
        respuestas: respuestasArray,
        puntajeObtenido: calificacion.puntajeObtenido,
        puntajeTotal: calificacion.puntajeTotal,
        nota: calificacion.nota,
        estado: calificacion.estado,
        fecha: fechaFinal.toISOString(),
      });
      setResultado(calificacion);
      setPaso("resultado");
    } catch (err: any) {
      setErrorEnvio(
        err?.message ?? "No se pudo enviar el examen. Verifica tu conexión e intenta de nuevo."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (paso === "identificacion") {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-2xl font-800 text-ink">{curso.nombre}</h1>
        {curso.descripcion && <p className="mt-1 text-sm text-ink/60">{curso.descripcion}</p>}
        <p className="mt-4 text-sm text-ink/70">
          Antes de comenzar, ingresa tus datos. Tu examen quedará registrado con esta información.
        </p>

        <form onSubmit={handleIniciar} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">DNI</label>
            <input
              autoFocus
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              inputMode="numeric"
              placeholder="12345678"
              className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Nombres</label>
            <input
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Apellidos</label>
            <input
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Instructor</label>
            <input
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="focus-ring w-full rounded-md bg-navy-900 px-5 py-3 text-sm font-medium text-white hover:bg-navy-800"
          >
            Comenzar examen
          </button>
        </form>
      </div>
    );
  }

  if (paso === "examen") {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-xl font-800 text-ink">{curso.nombre}</h1>
        <p className="mt-1 text-sm text-ink/50">
          {nombres} {apellidos} · DNI {dni}
        </p>

        <form onSubmit={handleEnviar} className="mt-6 space-y-4">
          {faltantes.length > 0 && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              Te faltan {faltantes.length} {faltantes.length === 1 ? "pregunta" : "preguntas"} por
              responder.
            </div>
          )}

          {preguntas.map((p, i) => (
            <div
              key={p.id}
              className={`rounded-lg border bg-white p-4 ${
                faltantes.includes(p.id) ? "border-red-400" : "border-line"
              }`}
            >
              <p className="text-sm font-medium text-ink">
                {i + 1}. {p.enunciado}
              </p>

              {p.tipo === "opcion_multiple" && (
                <div className="mt-3 space-y-2">
                  {p.opciones?.map((op) => (
                    <label key={op.id} className="flex items-center gap-2 text-sm text-ink/80">
                      <input
                        type="radio"
                        name={p.id}
                        checked={respuestas[p.id] === op.id}
                        onChange={() => actualizarRespuesta(p.id, op.id)}
                        className="h-4 w-4 accent-gold-600"
                      />
                      {op.texto}
                    </label>
                  ))}
                </div>
              )}

              {p.tipo === "verdadero_falso" && (
                <div className="mt-3 flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-ink/80">
                    <input
                      type="radio"
                      name={p.id}
                      checked={respuestas[p.id] === true}
                      onChange={() => actualizarRespuesta(p.id, true)}
                      className="h-4 w-4 accent-gold-600"
                    />
                    Verdadero
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink/80">
                    <input
                      type="radio"
                      name={p.id}
                      checked={respuestas[p.id] === false}
                      onChange={() => actualizarRespuesta(p.id, false)}
                      className="h-4 w-4 accent-gold-600"
                    />
                    Falso
                  </label>
                </div>
              )}

              {p.tipo === "numerica" && (
                <input
                  type="number"
                  value={typeof respuestas[p.id] === "number" ? (respuestas[p.id] as number) : ""}
                  onChange={(e) =>
                    actualizarRespuesta(p.id, e.target.value === "" ? null : Number(e.target.value))
                  }
                  className="focus-ring mt-3 w-32 rounded-md border border-line bg-white px-3 py-2 text-sm"
                />
              )}

              {p.tipo === "abierta" && (
                <textarea
                  value={typeof respuestas[p.id] === "string" ? (respuestas[p.id] as string) : ""}
                  onChange={(e) => actualizarRespuesta(p.id, e.target.value)}
                  rows={3}
                  placeholder="Escribe tu respuesta"
                  className="focus-ring mt-3 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                />
              )}
            </div>
          ))}

          {errorEnvio && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{errorEnvio}</div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="focus-ring w-full rounded-md bg-navy-900 px-5 py-3 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
          >
            {enviando ? "Enviando..." : "Enviar examen"}
          </button>
        </form>
      </div>
    );
  }

  const aprobado = resultado?.estado === "aprobado";
  const pendiente = resultado?.estado === "pendiente_revision";

  return (
    <div className="mx-auto max-w-md text-center">
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-800 text-white ${
          pendiente ? "bg-navy-700" : aprobado ? "bg-navy-900" : "bg-red-500"
        }`}
      >
        {pendiente ? "?" : resultado?.nota}
      </div>

      <h1 className="mt-4 font-display text-xl font-800 text-ink">
        {pendiente ? "Examen enviado" : aprobado ? "Aprobado" : "No aprobado"}
      </h1>

      <p className="mt-2 text-sm text-ink/60">
        {pendiente
          ? "Tu examen tiene preguntas de respuesta abierta que serán revisadas manualmente. Te notificarán tu nota final."
          : `Nota: ${resultado?.nota} / 20 · Mínimo para aprobar: ${curso.notaMinimaAprobatoria}`}
      </p>

      <p className="mt-6 text-xs text-ink/40">
        {nombres} {apellidos} · DNI {dni} · {curso.nombre}
      </p>
    </div>
  );
}
