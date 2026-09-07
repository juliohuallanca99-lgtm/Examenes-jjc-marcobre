import { supabase } from "./supabase";

export async function registrarAccion(
  usuarioEmail: string | null | undefined,
  accion: "crear" | "eliminar",
  entidad: string,
  descripcion: string
) {
  try {
    await supabase.from("historial_acciones").insert({
      usuario_email: usuarioEmail ?? "desconocido",
      accion,
      entidad,
      descripcion,
    });
  } catch {}
}
