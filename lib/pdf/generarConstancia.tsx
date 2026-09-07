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

export async function generarConstanciaPdf(curso: Curso, intento: Intento, preguntas: Pregunta[]) {
  const blob = await pdf(
    <ConstanciaDocument curso={curso} intento={intento} preguntas={preguntas} />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(intento.apellidos)}-${slug(intento.nombres)}-${intento.dni}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
