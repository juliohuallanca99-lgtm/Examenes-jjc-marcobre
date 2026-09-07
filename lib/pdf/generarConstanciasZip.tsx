import JSZip from "jszip";
import { pdf } from "@react-pdf/renderer";
import ConstanciaDocument from "./ConstanciaDocument";
import { Curso, Pregunta } from "../types";
import { Intento } from "../intento-types";

function slug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function generarConstanciasZip(
  curso: Curso,
  intentos: Intento[],
  preguntas: Pregunta[]
) {
  const calificados = intentos.filter((i) => i.estado !== "pendiente_revision");
  if (calificados.length === 0) return;

  const zip = new JSZip();
  const nombresUsados = new Map<string, number>();

  for (const intento of calificados) {
    const blob = await pdf(
      <ConstanciaDocument curso={curso} intento={intento} preguntas={preguntas} />
    ).toBlob();
    const arrayBuffer = await blob.arrayBuffer();

    let nombreArchivo = `${slug(intento.apellidos)}-${slug(intento.nombres)}-${intento.dni}.pdf`;
    const veces = nombresUsados.get(nombreArchivo) ?? 0;
    if (veces > 0) {
      nombreArchivo = `${slug(intento.apellidos)}-${slug(intento.nombres)}-${intento.dni}-${veces + 1}.pdf`;
    }
    nombresUsados.set(nombreArchivo, veces + 1);

    zip.file(nombreArchivo, arrayBuffer);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `constancias-${slug(curso.nombre)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
