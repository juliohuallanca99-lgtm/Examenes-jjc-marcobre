export type TipoPregunta = "opcion_multiple" | "verdadero_falso" | "numerica" | "abierta";

export interface Opcion {
  id: string;
  texto: string;
}

export interface Pregunta {
  id: string;
  cursoId: string;
  orden: number;
  tipo: TipoPregunta;
  enunciado: string;
  opciones?: Opcion[];
  respuestaCorrecta?: string | string[] | boolean | number | null;
  margenError?: number;
  puntaje: number;
}

export interface Carpeta {
  id: string;
  nombre: string;
  createdAt: string;
}

export interface Curso {
  id: string;
  nombre: string;
  descripcion: string;
  notaMinimaAprobatoria: number;
  activo: boolean;
  createdAt: string;
  carpetaId: string | null;
}

export const TIPO_LABELS: Record<TipoPregunta, string> = {
  opcion_multiple: "Opción múltiple",
  verdadero_falso: "Verdadero / Falso",
  numerica: "Numérica",
  abierta: "Respuesta abierta (revisión manual)",
};
