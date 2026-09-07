"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Pregunta } from "@/lib/types";
import { Intento } from "@/lib/intento-types";
import QuestionForm from "@/components/QuestionForm";
import QuestionList from "@/components/QuestionList";

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fechaLocalISO(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

export default function CursoDetallePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { rol } = useAuth();
  const {
    obtenerCurso,
    preguntasDeCurso,
    crearPregunta,
    actualizarPregunta,
    eliminarPregunta,
    actualizarCurso,
    eliminarCurso,
    intentosDeCurso,
    eliminarIntento,
    loaded,
  } = useStore();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Pregunta | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [generandoZip, setGenerandoZip] = useState(false);
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [guardandoTitulo, setGuardandoTitulo] = useState(false);
  const [editandoCodigo, setEditandoCodigo] = useState(false);
  const [nuevoCodigo, setNuevoCodigo] = useState("");
  const [guardandoCodigo, setGuardandoCodigo] = useState(false);
  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [busquedaFecha, setBusquedaFecha] = useState("");
  const [generandoQr, setGenerandoQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  if (!loaded) return null;

  const curso = obtenerCurso(params.id);
  if (!curso) {
    return (
      <div className="text-center">
        <p className="text-sm text-ink/60">Este curso no existe o fue eliminado.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-navy-700">
          Volver a cursos
        </Link>
      </div>
    );
  }

  const preguntas = preguntasDeCurso(curso.id);
  const puntajeTotal = preguntas.reduce((sum, p) => sum + p.puntaje, 0);
  const intentos = intentosDeCurso(curso.id);

  async function handleGuardar(datos: Omit<Pregunta, "id" | "cursoId" | "orden">) {
    setErrorAccion(null);
    try {
      if (editando) {
        await actualizarPregunta(editando.id, datos);
      } else {
        await crearPregunta({ ...datos, cursoId: curso!.id, orden: preguntas.length });
      }
      setMostrarForm(false);
      setEditando(null);
    } catch (err: any) {
      setErrorAccion(err?.message ?? "No se pudo guardar la pregunta.");
    }
  }

  async function handleEliminarCurso() {
    if (confirm(`¿Eliminar el curso "${curso!.nombre}" y todas sus preguntas?`)) {
      try {
        await eliminarCurso(curso!.id);
        router.push("/");
      } catch (err: any) {
        setErrorAccion(err?.message ?? "No se pudo eliminar el curso.");
      }
    }
  }

  async function handleGuardarTitulo() {
    if (!nuevoTitulo.trim()) return;
    setGuardandoTitulo(true);
    setErrorAccion(null);
    try {
      await actualizarCurso(curso!.id, { nombre: nuevoTitulo.trim() });
      setEditandoTitulo(false);
    } catch (err: any) {
      setErrorAccion(err?.message ?? "No se pudo actualizar el título.");
    } finally {
      setGuardandoTitulo(false);
    }
  }

  async function handleGuardarCodigo() {
    setGuardandoCodigo(true);
    setErrorAccion(null);
    try {
      await actualizarCurso(curso!.id, { descripcion: nuevoCodigo.trim() });
      setEditandoCodigo(false);
    } catch (err: any) {
      setErrorAccion(err?.message ?? "No se pudo actualizar el código.");
    } finally {
      setGuardandoCodigo(false);
    }
  }

  async function handleDescargarTodos() {
    setErrorAccion(null);
    setGenerandoZip(true);
    try {
      const { generarConstanciasZip } = await import("@/lib/pdf/generarConstanciasZip");
      await generarConstanciasZip(curso!, intentos, preguntas);
    } catch (err: any) {
      setErrorAccion(err?.message ?? "No se pudo generar el archivo ZIP.");
    } finally {
      setGenerandoZip(false);
    }
  }

  async function handleGenerarQr() {
    setGenerandoQr(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const url = `${window.location.origin}/examen/${curso!.id}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 480,
        margin: 2,
        color: { dark: "#0F2138", light: "#FFFFFF" },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error(err);
      alert("No se pudo generar el código QR. Intenta de nuevo.");
    } finally {
      setGenerandoQr(false);
    }
  }

  async function handleEliminarIntento(intento: Intento) {
    if (
      confirm(
        `¿Eliminar el examen de ${intento.nombres} ${intento.apellidos} (DNI ${intento.dni})? Esta acción no se puede deshacer.`
      )
    ) {
      try {
        await eliminarIntento(intento.id);
      } catch (err: any) {
        setErrorAccion(err?.message ?? "No se pudo eliminar el examen.");
      }
    }
  }

  const calificados = intentos.filter((i) => i.estado !== "pendiente_revision");
  const intentosFiltrados = intentos.filter((i) => {
    const coincideNombre =
      !busquedaNombre.trim() ||
      `${i.nombres} ${i.apellidos}`.toLowerCase().includes(busquedaNombre.trim().toLowerCase());
    const coincideFecha = !busquedaFecha || fechaLocalISO(i.fecha) === busquedaFecha;
    return coincideNombre && coincideFecha;
  });

  return (
    <div>
      <Link href="/" className="text-sm text-ink/50 hover:text-ink">
        Cursos
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div className="flex-1">
          {editandoTitulo ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nuevoTitulo}
                onChange={(e) => setNuevoTitulo(e.target.value)}
                className="focus-ring w-full max-w-xl rounded-md border border-line bg-white px-3 py-1.5 font-display text-xl font-800 text-ink"
              />
              <button
                onClick={handleGuardarTitulo}
                disabled={guardandoTitulo}
                className="focus-ring shrink-0 rounded-md bg-navy-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-800 disabled:opacity-60"
              >
                {guardandoTitulo ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={() => setEditandoTitulo(false)}
                className="focus-ring shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-ink/60 hover:text-ink"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-800 text-ink">{curso.nombre}</h1>
              {(rol === "admin" || rol === "editor") && (
                <button
                  onClick={() => {
                    setNuevoTitulo(curso.nombre);
                    setEditandoTitulo(true);
                  }}
                  className="focus-ring shrink-0 text-xs font-medium text-navy-700 hover:text-navy-900"
                >
                  Editar
                </button>
              )}
            </div>
          )}
          {editandoCodigo ? (
            <div className="mt-1.5 flex items-center gap-2">
              <input
                autoFocus
                value={nuevoCodigo}
                onChange={(e) => setNuevoCodigo(e.target.value)}
                placeholder="Ej: JU-001-08-26215-0000-16-02-0023"
                className="focus-ring w-full max-w-md rounded-md border border-line bg-white px-3 py-1.5 text-sm text-ink"
              />
              <button
                onClick={handleGuardarCodigo}
                disabled={guardandoCodigo}
                className="focus-ring shrink-0 rounded-md bg-navy-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-800 disabled:opacity-60"
              >
                {guardandoCodigo ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={() => setEditandoCodigo(false)}
                className="focus-ring shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-ink/60 hover:text-ink"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              {curso.descripcion && <p className="text-sm text-ink/60">{curso.descripcion}</p>}
              {(rol === "admin" || rol === "editor") && (
                <button
                  onClick={() => {
                    setNuevoCodigo(curso.descripcion ?? "");
                    setEditandoCodigo(true);
                  }}
                  className="focus-ring shrink-0 text-xs font-medium text-navy-700 hover:text-navy-900"
                >
                  {curso.descripcion ? "Editar código" : "+ Agregar código"}
                </button>
              )}
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-ink/50">
            <span>
              Nota mínima aprobatoria:{" "}
              <span className="font-medium text-gold-600">{curso.notaMinimaAprobatoria}</span>
            </span>
            <span>
              Puntaje total del examen: <span className="font-medium text-ink">{puntajeTotal}</span>
            </span>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={curso.activo}
                onChange={(e) =>
                  actualizarCurso(curso.id, { activo: e.target.checked }).catch((err) =>
                    setErrorAccion(err?.message ?? "No se pudo actualizar el curso.")
                  )
                }
                className="h-3.5 w-3.5 accent-gold-600"
              />
              Curso activo
            </label>
          </div>
        </div>
        {(rol === "admin" || rol === "editor") && (
          <button
            onClick={handleEliminarCurso}
            className="focus-ring shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Eliminar curso
          </button>
        )}
      </div>

      {errorAccion && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {errorAccion}
        </div>
      )}

      {preguntas.length > 0 && (
        <div className="mt-6 rounded-lg border border-line bg-white p-4">
          <p className="text-sm font-medium text-ink">Link para que el trabajador rinda el examen</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-paper px-3 py-2 text-xs text-ink/70">
              {typeof window !== "undefined" ? window.location.origin : ""}/examen/{curso.id}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/examen/${curso.id}`);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 1500);
              }}
              className="focus-ring shrink-0 rounded-md bg-navy-900 px-3 py-2 text-xs font-medium text-white hover:bg-navy-800"
            >
              {copiado ? "Copiado" : "Copiar"}
            </button>
            <button
              onClick={handleGenerarQr}
              disabled={generandoQr}
              className="focus-ring shrink-0 rounded-md border border-line bg-white px-3 py-2 text-xs font-medium text-ink hover:bg-paper disabled:opacity-60"
            >
              {generandoQr ? "Generando..." : "Generar QR"}
            </button>
          </div>
          {!curso.activo && (
            <p className="mt-2 text-xs text-red-600">
              El curso está inactivo: el trabajador verá un mensaje de no disponible hasta que lo
              actives.
            </p>
          )}
        </div>
      )}

      {qrDataUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setQrDataUrl(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-base font-800 text-ink">{curso.nombre}</p>
            <p className="mt-1 text-xs text-ink/50">
              Escanea para rendir el examen desde el celular
            </p>
            <img src={qrDataUrl} alt="Código QR del examen" className="mx-auto mt-4 h-56 w-56" />
            <div className="mt-4 flex gap-2">
              <a
                href={qrDataUrl}
                download={`qr-${curso.id}.png`}
                className="focus-ring flex-1 rounded-md bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
              >
                Descargar PNG
              </a>
              <button
                onClick={() => setQrDataUrl(null)}
                className="focus-ring rounded-md px-4 py-2.5 text-sm font-medium text-ink/60 hover:text-ink"
              >
                Cerrar
              </button>
            </div>
            <p className="mt-3 text-[11px] text-ink/40">
              Imprime esta imagen y pégala en el mural, o compártela en tus grupos.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-base font-700 text-ink">
          Preguntas <span className="text-ink/40">({preguntas.length})</span>
        </h2>
        {!mostrarForm && (
          <button
            onClick={() => {
              setEditando(null);
              setMostrarForm(true);
            }}
            className="focus-ring rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
          >
            + Agregar pregunta
          </button>
        )}
      </div>

      <div className="mt-4">
        {mostrarForm && (
          <div className="mb-4">
            <QuestionForm
              cursoId={curso.id}
              siguienteOrden={preguntas.length}
              initial={editando ?? undefined}
              onSave={handleGuardar}
              onCancel={() => {
                setMostrarForm(false);
                setEditando(null);
              }}
            />
          </div>
        )}

        <QuestionList
          preguntas={preguntas}
          onEdit={(p) => {
            setEditando(p);
            setMostrarForm(true);
          }}
          onDelete={(id) => {
            if (confirm("¿Eliminar esta pregunta?"))
              eliminarPregunta(id).catch((err) =>
                setErrorAccion(err?.message ?? "No se pudo eliminar la pregunta.")
              );
          }}
        />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-700 text-ink">
            Resultados <span className="text-ink/40">({intentos.length})</span>
          </h2>
          <p className="mt-1 text-xs text-ink/50">
            Se actualiza en tiempo real conforme los trabajadores van rindiendo el examen.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={busquedaNombre}
            onChange={(e) => setBusquedaNombre(e.target.value)}
            placeholder="Buscar por apellido o nombre"
            className="focus-ring w-52 rounded-md border border-line bg-white px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={busquedaFecha}
            onChange={(e) => setBusquedaFecha(e.target.value)}
            className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm"
          />
          {calificados.length > 0 && (
            <button
              onClick={handleDescargarTodos}
              disabled={generandoZip}
              className="focus-ring shrink-0 rounded-md bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
            >
              {generandoZip ? "Generando ZIP..." : `Descargar todos (${calificados.length})`}
            </button>
          )}
        </div>
      </div>

      {intentos.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-line bg-white/60 px-6 py-8 text-center">
          <p className="text-sm text-ink/60">Todavía nadie ha rendido este examen.</p>
        </div>
      ) : intentosFiltrados.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-line bg-white/60 px-6 py-8 text-center">
          <p className="text-sm text-ink/60">Ningún resultado coincide con la búsqueda.</p>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-lg border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs text-ink/50">
              <tr>
                <th className="px-4 py-2 font-medium">Trabajador</th>
                <th className="px-4 py-2 font-medium">DNI</th>
                <th className="px-4 py-2 font-medium">Nota</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium"></th>
                {(rol === "admin" || rol === "editor") && <th className="px-4 py-2 font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {intentosFiltrados.map((i) => (
                <tr
                  key={i.id}
                  onClick={() => (window.location.href = `/cursos/${curso.id}/resultados/${i.id}`)}
                  className="cursor-pointer border-t border-line hover:bg-paper"
                >
                  <td className="px-4 py-2.5 text-ink">
                    {i.nombres} {i.apellidos}
                  </td>
                  <td className="px-4 py-2.5 text-ink/70">{i.dni}</td>
                  <td className="px-4 py-2.5 font-medium text-ink">{i.nota ?? "-"}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        i.estado === "aprobado"
                          ? "bg-gold-100 text-gold-600"
                          : i.estado === "pendiente_revision"
                          ? "bg-line text-navy-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {i.estado === "aprobado"
                        ? "Aprobado"
                        : i.estado === "pendiente_revision"
                        ? "Pendiente"
                        : "Desaprobado"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink/50">{formatearFecha(i.fecha)}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-medium text-navy-700">
                    Ver detalle
                  </td>
                  {(rol === "admin" || rol === "editor") && (
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminarIntento(i);
                        }}
                        className="focus-ring rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
