"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "./supabase";
import { Curso, Pregunta, Carpeta } from "./types";
import { Intento, RespuestaDada, EstadoIntento } from "./intento-types";
import { useAuth } from "./auth";
import { registrarAccion } from "./historial";

interface StoreContextValue {
  cursos: Curso[];
  preguntas: Pregunta[];
  intentos: Intento[];
  carpetas: Carpeta[];
  loaded: boolean;
  error: string | null;
  crearCurso: (curso: Omit<Curso, "id" | "createdAt">) => Promise<Curso>;
  actualizarCurso: (id: string, cambios: Partial<Curso>) => Promise<void>;
  eliminarCurso: (id: string) => Promise<void>;
  obtenerCurso: (id: string) => Curso | undefined;
  preguntasDeCurso: (cursoId: string) => Pregunta[];
  crearPregunta: (pregunta: Omit<Pregunta, "id">) => Promise<void>;
  actualizarPregunta: (id: string, cambios: Partial<Pregunta>) => Promise<void>;
  eliminarPregunta: (id: string) => Promise<void>;
  crearIntento: (intento: Omit<Intento, "id" | "fecha"> & { fecha?: string }) => Promise<Intento>;
  actualizarIntento: (
    id: string,
    cambios: {
      respuestas: RespuestaDada[];
      nota: number | null;
      estado: EstadoIntento;
      puntajeObtenido: number;
      puntajeTotal: number;
    }
  ) => Promise<void>;
  intentosDeCurso: (cursoId: string) => Intento[];
  eliminarIntento: (id: string) => Promise<void>;
  crearCarpeta: (nombre: string) => Promise<Carpeta>;
  actualizarCarpeta: (id: string, nombre: string) => Promise<void>;
  eliminarCarpeta: (id: string) => Promise<void>;
  recargar: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function cursoFromRow(row: any): Curso {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? "",
    notaMinimaAprobatoria: Number(row.nota_minima_aprobatoria),
    activo: row.activo,
    createdAt: row.created_at,
    carpetaId: row.carpeta_id ?? null,
  };
}

function carpetaFromRow(row: any): Carpeta {
  return { id: row.id, nombre: row.nombre, createdAt: row.created_at };
}

function preguntaFromRow(row: any): Pregunta {
  return {
    id: row.id,
    cursoId: row.curso_id,
    orden: row.orden,
    tipo: row.tipo,
    enunciado: row.enunciado,
    opciones: row.opciones ?? undefined,
    respuestaCorrecta: row.respuesta_correcta ?? null,
    margenError: row.margen_error ?? undefined,
    puntaje: Number(row.puntaje),
  };
}

function intentoFromRow(row: any): Intento {
  const payload = row.respuestas ?? {};
  const esArray = Array.isArray(payload);
  const respuestas: RespuestaDada[] = esArray ? payload : payload.respuestas ?? [];
  const puntajeObtenido = esArray ? 0 : payload.puntajeObtenido ?? 0;
  const puntajeTotal = esArray ? 0 : payload.puntajeTotal ?? 0;
  return {
    id: row.id,
    cursoId: row.curso_id,
    dni: row.dni,
    nombres: row.nombres,
    apellidos: row.apellidos,
    instructor: row.instructor ?? "",
    respuestas,
    puntajeObtenido,
    puntajeTotal,
    nota: row.nota === null || row.nota === undefined ? null : Number(row.nota),
    estado: row.estado as EstadoIntento,
    fecha: row.fecha_fin ?? row.created_at,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const usuarioEmail = session?.user?.email;
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [intentos, setIntentos] = useState<Intento[]>([]);
  const [carpetas, setCarpetas] = useState<Carpeta[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      const [cursosRes, preguntasRes, intentosRes, carpetasRes] = await Promise.all([
        supabase.from("cursos").select("*").order("created_at", { ascending: false }),
        supabase.from("preguntas").select("*").order("orden", { ascending: true }),
        supabase.from("intentos_examen").select("*").order("created_at", { ascending: false }),
        supabase.from("carpetas").select("*").order("nombre", { ascending: true }),
      ]);
      if (cursosRes.error) throw cursosRes.error;
      if (preguntasRes.error) throw preguntasRes.error;
      if (intentosRes.error) throw intentosRes.error;
      setCursos((cursosRes.data ?? []).map(cursoFromRow));
      setPreguntas((preguntasRes.data ?? []).map(preguntaFromRow));
      setIntentos((intentosRes.data ?? []).map(intentoFromRow));
      setCarpetas(carpetasRes.error ? [] : (carpetasRes.data ?? []).map(carpetaFromRow));
      setError(null);
    } catch (e: any) {
      console.error("Error cargando datos de Supabase", e);
      setError(e?.message ?? "No se pudo conectar con la base de datos");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const crearCurso: StoreContextValue["crearCurso"] = async (curso) => {
    const { data, error } = await supabase
      .from("cursos")
      .insert({
        nombre: curso.nombre,
        descripcion: curso.descripcion,
        nota_minima_aprobatoria: curso.notaMinimaAprobatoria,
        activo: curso.activo,
        carpeta_id: curso.carpetaId,
      })
      .select()
      .single();
    if (error || !data) throw error ?? new Error("No se pudo crear el curso");
    const nuevo = cursoFromRow(data);
    setCursos((c) => [nuevo, ...c]);
    registrarAccion(usuarioEmail, "crear", "curso", nuevo.nombre);
    return nuevo;
  };

  const actualizarCurso: StoreContextValue["actualizarCurso"] = async (id, cambios) => {
    const patch: Record<string, any> = {};
    if (cambios.nombre !== undefined) patch.nombre = cambios.nombre;
    if (cambios.descripcion !== undefined) patch.descripcion = cambios.descripcion;
    if (cambios.notaMinimaAprobatoria !== undefined)
      patch.nota_minima_aprobatoria = cambios.notaMinimaAprobatoria;
    if (cambios.activo !== undefined) patch.activo = cambios.activo;
    if (cambios.carpetaId !== undefined) patch.carpeta_id = cambios.carpetaId;
    const { error } = await supabase.from("cursos").update(patch).eq("id", id);
    if (error) throw error;
    setCursos((cs) => cs.map((c) => (c.id === id ? { ...c, ...cambios } : c)));
  };

  const eliminarCurso: StoreContextValue["eliminarCurso"] = async (id) => {
    const cursoEliminado = cursos.find((c) => c.id === id);
    await supabase.from("intentos_examen").delete().eq("curso_id", id);
    const { error } = await supabase.from("cursos").delete().eq("id", id);
    if (error) throw error;
    setCursos((cs) => cs.filter((c) => c.id !== id));
    setPreguntas((ps) => ps.filter((p) => p.cursoId !== id));
    setIntentos((is) => is.filter((i) => i.cursoId !== id));
    registrarAccion(usuarioEmail, "eliminar", "curso", cursoEliminado?.nombre ?? id);
  };

  const obtenerCurso: StoreContextValue["obtenerCurso"] = (id) => cursos.find((c) => c.id === id);

  const preguntasDeCurso: StoreContextValue["preguntasDeCurso"] = (cursoId) =>
    preguntas.filter((p) => p.cursoId === cursoId).sort((a, b) => a.orden - b.orden);

  const crearPregunta: StoreContextValue["crearPregunta"] = async (pregunta) => {
    const { data, error } = await supabase
      .from("preguntas")
      .insert({
        curso_id: pregunta.cursoId,
        orden: pregunta.orden,
        tipo: pregunta.tipo,
        enunciado: pregunta.enunciado,
        opciones: pregunta.opciones ?? null,
        respuesta_correcta: pregunta.respuestaCorrecta ?? null,
        margen_error: pregunta.margenError ?? null,
        puntaje: pregunta.puntaje,
      })
      .select()
      .single();
    if (error || !data) throw error ?? new Error("No se pudo crear la pregunta");
    setPreguntas((ps) => [...ps, preguntaFromRow(data)]);
    registrarAccion(usuarioEmail, "crear", "pregunta", pregunta.enunciado.slice(0, 80));
  };

  const actualizarPregunta: StoreContextValue["actualizarPregunta"] = async (id, cambios) => {
    const patch: Record<string, any> = {};
    if (cambios.tipo !== undefined) patch.tipo = cambios.tipo;
    if (cambios.enunciado !== undefined) patch.enunciado = cambios.enunciado;
    if (cambios.opciones !== undefined) patch.opciones = cambios.opciones;
    if (cambios.respuestaCorrecta !== undefined)
      patch.respuesta_correcta = cambios.respuestaCorrecta;
    if (cambios.margenError !== undefined) patch.margen_error = cambios.margenError;
    if (cambios.puntaje !== undefined) patch.puntaje = cambios.puntaje;
    const { error } = await supabase.from("preguntas").update(patch).eq("id", id);
    if (error) throw error;
    setPreguntas((ps) => ps.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
  };

  const eliminarPregunta: StoreContextValue["eliminarPregunta"] = async (id) => {
    const preguntaEliminada = preguntas.find((p) => p.id === id);
    const { error } = await supabase.from("preguntas").delete().eq("id", id);
    if (error) throw error;
    setPreguntas((ps) => ps.filter((p) => p.id !== id));
    registrarAccion(
      usuarioEmail,
      "eliminar",
      "pregunta",
      preguntaEliminada?.enunciado.slice(0, 80) ?? id
    );
  };

  const crearIntento: StoreContextValue["crearIntento"] = async (intento) => {
    const payload = {
      respuestas: intento.respuestas,
      puntajeObtenido: intento.puntajeObtenido,
      puntajeTotal: intento.puntajeTotal,
    };
    const fila = {
      curso_id: intento.cursoId,
      dni: intento.dni,
      nombres: intento.nombres,
      apellidos: intento.apellidos,
      instructor: intento.instructor,
      respuestas: payload,
      nota: intento.nota,
      estado: intento.estado,
      fecha_fin: intento.fecha ?? new Date().toISOString(),
    };

    // El trabajador que rinde el examen no tiene permiso de LECTURA sobre
    // intentos_examen (por privacidad). Pedir la fila de vuelta con .select()
    // haria fallar el registro, asi que solo se insertan sus datos.
    if (!session) {
      const { error } = await supabase.from("intentos_examen").insert(fila);
      if (error) throw error;
      return {
        id: "",
        cursoId: intento.cursoId,
        dni: intento.dni,
        nombres: intento.nombres,
        apellidos: intento.apellidos,
        instructor: intento.instructor,
        respuestas: intento.respuestas,
        puntajeObtenido: intento.puntajeObtenido,
        puntajeTotal: intento.puntajeTotal,
        nota: intento.nota,
        estado: intento.estado,
        fecha: fila.fecha_fin,
      };
    }

    // Con sesion iniciada si se recupera la fila, para refrescar la tabla al instante.
    const { data, error } = await supabase
      .from("intentos_examen")
      .insert(fila)
      .select()
      .single();
    if (error || !data) throw error ?? new Error("No se pudo registrar el examen");
    const nuevo = intentoFromRow(data);
    setIntentos((is) => [nuevo, ...is]);
    return nuevo;
  };

  const intentosDeCurso: StoreContextValue["intentosDeCurso"] = (cursoId) =>
    intentos.filter((i) => i.cursoId === cursoId);

  const actualizarIntento: StoreContextValue["actualizarIntento"] = async (id, cambios) => {
    const payload = {
      respuestas: cambios.respuestas,
      puntajeObtenido: cambios.puntajeObtenido,
      puntajeTotal: cambios.puntajeTotal,
    };
    const { error } = await supabase
      .from("intentos_examen")
      .update({ respuestas: payload, nota: cambios.nota, estado: cambios.estado })
      .eq("id", id);
    if (error) throw error;
    setIntentos((is) =>
      is.map((i) =>
        i.id === id
          ? {
              ...i,
              respuestas: cambios.respuestas,
              nota: cambios.nota,
              estado: cambios.estado,
              puntajeObtenido: cambios.puntajeObtenido,
              puntajeTotal: cambios.puntajeTotal,
            }
          : i
      )
    );
  };

  const eliminarIntento: StoreContextValue["eliminarIntento"] = async (id) => {
    const intentoEliminado = intentos.find((i) => i.id === id);
    const { error } = await supabase.from("intentos_examen").delete().eq("id", id);
    if (error) throw error;
    setIntentos((is) => is.filter((i) => i.id !== id));
    registrarAccion(
      usuarioEmail,
      "eliminar",
      "examen",
      intentoEliminado
        ? `${intentoEliminado.nombres} ${intentoEliminado.apellidos} (DNI ${intentoEliminado.dni})`
        : id
    );
  };

  const crearCarpeta: StoreContextValue["crearCarpeta"] = async (nombre) => {
    const { data, error } = await supabase
      .from("carpetas")
      .insert({ nombre: nombre.trim() })
      .select()
      .single();
    if (error || !data) throw error ?? new Error("No se pudo crear la carpeta");
    const nueva = carpetaFromRow(data);
    setCarpetas((cs) => [...cs, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    registrarAccion(usuarioEmail, "crear", "carpeta", nueva.nombre);
    return nueva;
  };

  const actualizarCarpeta: StoreContextValue["actualizarCarpeta"] = async (id, nombre) => {
    const { error } = await supabase.from("carpetas").update({ nombre: nombre.trim() }).eq("id", id);
    if (error) throw error;
    setCarpetas((cs) =>
      cs
        .map((c) => (c.id === id ? { ...c, nombre: nombre.trim() } : c))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
    );
  };

  const eliminarCarpeta: StoreContextValue["eliminarCarpeta"] = async (id) => {
    const carpetaEliminada = carpetas.find((c) => c.id === id);
    const { error } = await supabase.from("carpetas").delete().eq("id", id);
    if (error) throw error;
    setCarpetas((cs) => cs.filter((c) => c.id !== id));
    setCursos((cs) => cs.map((c) => (c.carpetaId === id ? { ...c, carpetaId: null } : c)));
    registrarAccion(usuarioEmail, "eliminar", "carpeta", carpetaEliminada?.nombre ?? id);
  };

  return (
    <StoreContext.Provider
      value={{
        cursos,
        preguntas,
        intentos,
        carpetas,
        loaded,
        error,
        crearCurso,
        actualizarCurso,
        eliminarCurso,
        obtenerCurso,
        preguntasDeCurso,
        crearPregunta,
        actualizarPregunta,
        eliminarPregunta,
        crearIntento,
        actualizarIntento,
        intentosDeCurso,
        eliminarIntento,
        crearCarpeta,
        actualizarCarpeta,
        eliminarCarpeta,
        recargar,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}
