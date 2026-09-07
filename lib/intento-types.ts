export type EstadoIntento = "aprobado" | "desaprobado" | "pendiente_revision";

export interface RespuestaDada {
  preguntaId: string;
  valor: string | boolean | number | null;
  revisionManual?: boolean | null;
}

export interface Intento {
  id: string;
  cursoId: string;
  dni: string;
  nombres: string;
  apellidos: string;
  instructor: string;
  respuestas: RespuestaDada[];
  puntajeObtenido: number;
  puntajeTotal: number;
  nota: number | null;
  estado: EstadoIntento;
  fecha: string;
}
