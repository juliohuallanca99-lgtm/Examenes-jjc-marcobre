"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";

const NUEVA_CARPETA = "__nueva__";

export default function NuevoCursoPage() {
  const router = useRouter();
  const { crearCurso, crearCarpeta, carpetas } = useStore();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [notaMinima, setNotaMinima] = useState(14);
  const [carpetaId, setCarpetaId] = useState<string>("");
  const [creandoCarpeta, setCreandoCarpeta] = useState(false);
  const [nombreNuevaCarpeta, setNombreNuevaCarpeta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelectCarpeta(valor: string) {
    if (valor === NUEVA_CARPETA) {
      setCreandoCarpeta(true);
      setNombreNuevaCarpeta("");
    } else {
      setCarpetaId(valor);
    }
  }

  async function handleCrearCarpeta() {
    if (!nombreNuevaCarpeta.trim()) return;
    try {
      const nueva = await crearCarpeta(nombreNuevaCarpeta.trim());
      setCarpetaId(nueva.id);
      setCreandoCarpeta(false);
    } catch (err: any) {
      setError(err?.message ?? "No se pudo crear la carpeta.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setEnviando(true);
    setError(null);
    try {
      const curso = await crearCurso({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        notaMinimaAprobatoria: notaMinima,
        activo: true,
        carpetaId: carpetaId || null,
      });
      router.push(`/cursos/${curso.id}`);
    } catch (err: any) {
      setError(err?.message ?? "No se pudo crear el curso. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/" className="text-sm text-ink/50 hover:text-ink">
        Cursos
      </Link>
      <h1 className="mt-2 font-display text-2xl font-800 text-ink">Nuevo curso</h1>
      <p className="mt-1 text-sm text-ink/60">
        Después de crearlo podrás agregar sus preguntas de examen.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink">Nombre del curso</label>
          <input
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Trabajos en altura"
            className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">
            Código <span className="text-ink/40">(opcional)</span>
          </label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: PETS-JJC-SIG-01"
            className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">
            Carpeta <span className="text-ink/40">(opcional)</span>
          </label>
          {creandoCarpeta ? (
            <div className="mt-1.5 flex items-center gap-2">
              <input
                autoFocus
                value={nombreNuevaCarpeta}
                onChange={(e) => setNombreNuevaCarpeta(e.target.value)}
                placeholder="Nombre de la carpeta"
                className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={handleCrearCarpeta}
                className="focus-ring shrink-0 rounded-md bg-navy-900 px-3 py-2.5 text-xs font-medium text-white hover:bg-navy-800"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => setCreandoCarpeta(false)}
                className="focus-ring shrink-0 rounded-md px-2 py-2.5 text-xs font-medium text-ink/60 hover:text-ink"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <select
              value={carpetaId}
              onChange={(e) => handleSelectCarpeta(e.target.value)}
              className="focus-ring mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm"
            >
              <option value="">Sin carpeta</option>
              {carpetas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
              <option value={NUEVA_CARPETA}>+ Crear nueva carpeta...</option>
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">Nota mínima aprobatoria</label>
          <div className="mt-1.5 flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={notaMinima}
              onChange={(e) => setNotaMinima(Number(e.target.value))}
              className="focus-ring w-24 rounded-md border border-line bg-white px-3 py-2.5 text-sm"
            />
            <span className="text-sm text-ink/50">sobre 20</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={enviando}
            className="focus-ring rounded-md bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
          >
            {enviando ? "Creando..." : "Crear curso"}
          </button>
          <Link
            href="/"
            className="focus-ring rounded-md px-5 py-2.5 text-sm font-medium text-ink/60 hover:text-ink"
          >
            Cancelar
          </Link>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
