"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Curso } from "@/lib/types";

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
        open ? "rotate-0" : "-rotate-90"
      }`}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-slate-400">
      <path
        d="M2.5 5.5A1.5 1.5 0 0 1 4 4h3.5l1.5 1.7H16a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 15.7H4a1.5 1.5 0 0 1-1.5-1.5v-8.7Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-slate-400">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M17 17L13.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M13.5 3.5a1.6 1.6 0 0 1 2.26 2.26L6.5 15l-3 .8.8-3 9.2-9.3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M4 6h12M8 6V4.5A1 1 0 0 1 9 3.5h2a1 1 0 0 1 1 1V6M6 6l.6 9.2a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L14 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M4 10h12M11 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`focus-ring relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-teal-500" : "bg-slate-300"
      }`}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(4px)" }}
      />
    </button>
  );
}

export default function DashboardPage() {
  const {
    cursos,
    preguntasDeCurso,
    loaded,
    error,
    carpetas,
    crearCarpeta,
    actualizarCarpeta,
    eliminarCarpeta,
    actualizarCurso,
    eliminarCurso,
  } = useStore();
  const { rol } = useAuth();
  const puedeGestionar = rol === "admin" || rol === "editor";

  const [busqueda, setBusqueda] = useState("");
  const [mostrarNuevaCarpeta, setMostrarNuevaCarpeta] = useState(false);
  const [nombreNuevaCarpeta, setNombreNuevaCarpeta] = useState("");
  const [editandoCarpetaId, setEditandoCarpetaId] = useState<string | null>(null);
  const [nombreEditCarpeta, setNombreEditCarpeta] = useState("");
  const [errorCarpeta, setErrorCarpeta] = useState<string | null>(null);
  const [colapsadas, setColapsadas] = useState<Record<string, boolean>>({});

  async function handleCrearCarpeta() {
    if (!nombreNuevaCarpeta.trim()) return;
    setErrorCarpeta(null);
    try {
      await crearCarpeta(nombreNuevaCarpeta.trim());
      setNombreNuevaCarpeta("");
      setMostrarNuevaCarpeta(false);
    } catch (err: any) {
      setErrorCarpeta(err?.message ?? "No se pudo crear la carpeta.");
    }
  }

  async function handleRenombrarCarpeta(id: string) {
    if (!nombreEditCarpeta.trim()) return;
    setErrorCarpeta(null);
    try {
      await actualizarCarpeta(id, nombreEditCarpeta.trim());
      setEditandoCarpetaId(null);
    } catch (err: any) {
      setErrorCarpeta(err?.message ?? "No se pudo renombrar la carpeta.");
    }
  }

  async function handleEliminarCarpeta(id: string, nombre: string) {
    if (
      confirm(
        `¿Eliminar la carpeta "${nombre}"? Los cursos que contiene no se eliminarán, quedarán como Sin carpeta.`
      )
    ) {
      try {
        await eliminarCarpeta(id);
      } catch (err: any) {
        setErrorCarpeta(err?.message ?? "No se pudo eliminar la carpeta.");
      }
    }
  }

  async function handleEliminarCurso(curso: Curso) {
    if (confirm(`¿Eliminar el curso "${curso.nombre}" y todas sus preguntas?`)) {
      try {
        await eliminarCurso(curso.id);
      } catch (err: any) {
        setErrorCarpeta(err?.message ?? "No se pudo eliminar el curso.");
      }
    }
  }

  const filtro = busqueda.trim().toLowerCase();
  const cursosFiltrados = useMemo(() => {
    if (!filtro) return cursos;
    return cursos.filter(
      (c) => c.nombre.toLowerCase().includes(filtro) || c.descripcion.toLowerCase().includes(filtro)
    );
  }, [cursos, filtro]);

  const cursosSinCarpeta = cursosFiltrados.filter((c) => !c.carpetaId);

  function toggleColapsada(id: string) {
    setColapsadas((s) => ({ ...s, [id]: !s[id] }));
  }

  function CarpetaCabecera({ id, nombre, conteo }: { id: string; nombre: string; conteo: number }) {
    const abierta = !colapsadas[id];
    const editando = editandoCarpetaId === id;
    return (
      <tr className="border-t border-slate-200 bg-slate-50">
        <td colSpan={5} className="px-4 py-2.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => toggleColapsada(id)}
              className="focus-ring flex min-w-0 items-center gap-2 text-left"
            >
              <IconChevron open={abierta} />
              <IconFolder />
              {editando ? (
                <input
                  autoFocus
                  value={nombreEditCarpeta}
                  onChange={(e) => setNombreEditCarpeta(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="focus-ring rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-semibold"
                />
              ) : (
                <span className="truncate text-sm font-semibold text-slate-800">{nombre}</span>
              )}
              <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {conteo} {conteo === 1 ? "curso" : "cursos"}
              </span>
            </button>

            {id !== "sin-carpeta" && puedeGestionar && (
              <div className="flex shrink-0 items-center gap-1">
                {editando ? (
                  <>
                    <button
                      onClick={() => handleRenombrarCarpeta(id)}
                      className="focus-ring rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditandoCarpetaId(null)}
                      className="focus-ring rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditandoCarpetaId(id);
                        setNombreEditCarpeta(nombre);
                      }}
                      className="focus-ring rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                      title="Editar carpeta"
                    >
                      <IconPencil />
                    </button>
                    <button
                      onClick={() => handleEliminarCarpeta(id, nombre)}
                      className="focus-ring rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Eliminar carpeta"
                    >
                      <IconTrash />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  }

  function CursoRow({ curso }: { curso: Curso }) {
    const numPreguntas = preguntasDeCurso(curso.id).length;
    return (
      <tr className="border-t border-slate-100 transition hover:bg-slate-50">
        <td className="px-4 py-3">
          <Toggle
            checked={curso.activo}
            onChange={(v) =>
              actualizarCurso(curso.id, { activo: v }).catch((err) =>
                setErrorCarpeta(err?.message ?? "No se pudo actualizar el curso.")
              )
            }
          />
        </td>
        <td className="px-4 py-3">
          <Link href={`/cursos/${curso.id}`} className="focus-ring block min-w-0">
            <p className="break-words text-sm font-semibold leading-snug text-slate-800">
              {curso.nombre}
            </p>
            {curso.descripcion && (
              <p className="mt-0.5 break-words text-xs text-slate-400">{curso.descripcion}</p>
            )}
          </Link>
        </td>
        <td className="px-4 py-3">
          <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {numPreguntas} {numPreguntas === 1 ? "pregunta" : "preguntas"}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="whitespace-nowrap rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
            {curso.notaMinimaAprobatoria} nota mínima
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1">
            {puedeGestionar && (
              <select
                value={curso.carpetaId ?? ""}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  actualizarCurso(curso.id, { carpetaId: e.target.value || null }).catch(() => {})
                }
                title="Mover a carpeta"
                className="focus-ring w-full min-w-[6.5rem] rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-600"
              >
                <option value="">Sin carpeta</option>
                {carpetas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            )}
            <Link
              href={`/cursos/${curso.id}`}
              className="focus-ring rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Editar curso"
            >
              <IconPencil />
            </Link>
            {puedeGestionar && (
              <button
                onClick={() => handleEliminarCurso(curso)}
                className="focus-ring rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Eliminar curso"
              >
                <IconTrash />
              </button>
            )}
            <Link
              href={`/cursos/${curso.id}`}
              className="focus-ring rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Ver detalle"
            >
              <IconArrowRight />
            </Link>
          </div>
        </td>
      </tr>
    );
  }

  const sinResultados = filtro.length > 0 && cursosFiltrados.length === 0;

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudo conectar con la base de datos: {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cursos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Organiza tus cursos en carpetas y arma sus preguntas antes de habilitarlos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {puedeGestionar && !mostrarNuevaCarpeta && (
            <button
              onClick={() => setMostrarNuevaCarpeta(true)}
              className="focus-ring rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              + Nueva carpeta
            </button>
          )}
          <Link
            href="/cursos/nuevo"
            className="focus-ring rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Nuevo curso
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <IconSearch />
          </span>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código"
            className="focus-ring w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {mostrarNuevaCarpeta && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
          <input
            autoFocus
            value={nombreNuevaCarpeta}
            onChange={(e) => setNombreNuevaCarpeta(e.target.value)}
            placeholder="Nombre de la carpeta"
            className="focus-ring w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <button
            onClick={handleCrearCarpeta}
            className="focus-ring shrink-0 rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
          >
            Crear
          </button>
          <button
            onClick={() => {
              setMostrarNuevaCarpeta(false);
              setNombreNuevaCarpeta("");
            }}
            className="focus-ring shrink-0 rounded-md px-2 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            Cancelar
          </button>
        </div>
      )}

      {errorCarpeta && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {errorCarpeta}
        </div>
      )}

      {!loaded ? null : cursos.length === 0 && carpetas.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-base font-semibold text-slate-800">Todavía no hay cursos</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Crea el primer curso para empezar a cargar sus preguntas de examen.
          </p>
          <Link
            href="/cursos/nuevo"
            className="focus-ring mt-5 inline-block rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Crear curso
          </Link>
        </div>
      ) : sinResultados ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
          Ningún curso coincide con la búsqueda.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full table-fixed text-left" style={{ minWidth: 760 }}>
            <colgroup>
              <col style={{ width: "64px" }} />
              <col />
              <col style={{ width: "108px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "216px" }} />
            </colgroup>
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Estado
                </th>
                <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Curso / Evaluación
                </th>
                <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Preguntas
                </th>
                <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Nota mínima
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {carpetas.map((carpeta) => {
                const cursosDeCarpeta = cursosFiltrados.filter((c) => c.carpetaId === carpeta.id);
                const abierta = !colapsadas[carpeta.id];
                return (
                  <Fragment key={carpeta.id}>
                    <CarpetaCabecera
                      id={carpeta.id}
                      nombre={carpeta.nombre}
                      conteo={cursosDeCarpeta.length}
                    />
                    {abierta &&
                      (cursosDeCarpeta.length === 0 ? (
                        <tr className="border-t border-slate-100">
                          <td colSpan={5} className="px-4 py-3 text-sm text-slate-400">
                            Esta carpeta todavía no tiene cursos.{" "}
                            <Link
                              href="/cursos/nuevo"
                              className="font-medium text-slate-600 hover:underline"
                            >
                              + Agregar curso
                            </Link>
                          </td>
                        </tr>
                      ) : (
                        cursosDeCarpeta.map((curso) => <CursoRow key={curso.id} curso={curso} />)
                      ))}
                  </Fragment>
                );
              })}

              {cursosSinCarpeta.length > 0 && (
                <Fragment>
                  <CarpetaCabecera
                    id="sin-carpeta"
                    nombre="Sin carpeta"
                    conteo={cursosSinCarpeta.length}
                  />
                  {!colapsadas["sin-carpeta"] &&
                    cursosSinCarpeta.map((curso) => <CursoRow key={curso.id} curso={curso} />)}
                </Fragment>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
