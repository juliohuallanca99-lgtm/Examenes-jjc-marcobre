import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { Curso, Pregunta } from "../types";
import { Intento, RespuestaDada } from "../intento-types";
import { evaluarPregunta } from "../scoring";
import { LOGO_JJC_BASE64 } from "./logo";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#1C2430" },
  headerBox: { flexDirection: "row", borderWidth: 1, borderColor: "#1C2430" },
  headerLogoCell: {
    width: "20%",
    borderRightWidth: 1,
    borderRightColor: "#1C2430",
    padding: 8,
    justifyContent: "center",
  },
  logoImg: { width: 90, height: 53, objectFit: "contain" },
  headerTitleCell: { flex: 1, padding: 8, justifyContent: "center", alignItems: "center" },
  tituloCurso: { fontSize: 10, fontWeight: 700, textAlign: "center", marginTop: 3 },
  codigoCurso: { fontSize: 8, color: "#555", textAlign: "center", marginTop: 3 },
  cuerpoRow: { flexDirection: "row", alignItems: "stretch" },
  infoBox: {
    flex: 1,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#1C2430",
    padding: 8,
    justifyContent: "center",
  },
  notaBox: {
    width: "18%",
    borderWidth: 1,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderColor: "#1C2430",
    alignItems: "center",
    justifyContent: "center",
  },
  notaLabel: { fontSize: 8, color: "#1C2430" },
  notaValor: { fontSize: 22, fontWeight: 700, marginTop: 3 },
  infoRow: { flexDirection: "row", marginBottom: 3 },
  infoLabel: { fontWeight: 700 },
  seccion: { marginTop: 14, marginBottom: 6, fontSize: 9, fontWeight: 700 },
  pregunta: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E4E2DC",
  },
  enunciado: { fontWeight: 700, marginBottom: 2 },
  respuestaOk: { color: "#B07E22" },
  respuestaMal: { color: "#C0392B" },
  respuestaPendiente: { color: "#1E3E63" },
  correcta: { color: "#555", marginTop: 1 },
  altList: { marginTop: 3, marginLeft: 2 },
  altItem: { fontSize: 8.5, marginBottom: 1.5, lineHeight: 1.3 },
  altPlain: { color: "#555" },
  altCorrectMark: { color: "#B07E22" },
  altBadSel: { color: "#C0392B", fontWeight: 700 },
  altOkSel: { color: "#B07E22", fontWeight: 700 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    fontSize: 7,
    color: "#888",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#E4E2DC",
    paddingTop: 6,
  },
});

function textoRespuesta(p: Pregunta, valor: RespuestaDada["valor"]): string {
  if (valor === null || valor === undefined || valor === "") return "Sin responder";
  if (p.tipo === "opcion_multiple") {
    return p.opciones?.find((o) => o.id === valor)?.texto ?? "Sin responder";
  }
  if (p.tipo === "verdadero_falso") return valor ? "Verdadero" : "Falso";
  return String(valor);
}

function textoCorrecta(p: Pregunta): string {
  if (p.tipo === "opcion_multiple") {
    return p.opciones?.find((o) => o.id === p.respuestaCorrecta)?.texto ?? "-";
  }
  if (p.tipo === "verdadero_falso") return p.respuestaCorrecta ? "Verdadero" : "Falso";
  if (p.tipo === "numerica") {
    return `${p.respuestaCorrecta}${p.margenError ? ` (+/- ${p.margenError})` : ""}`;
  }
  return "-";
}

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface Alternativa {
  letra: string;
  texto: string;
  esSeleccionada: boolean;
  esCorrecta: boolean;
}

function alternativasDe(p: Pregunta, valor: RespuestaDada["valor"]): Alternativa[] {
  const letras = "ABCDEFGHIJ";
  if (p.tipo === "opcion_multiple") {
    return (p.opciones ?? []).map((o, idx) => ({
      letra: letras[idx] ?? String(idx + 1),
      texto: o.texto,
      esSeleccionada: valor === o.id,
      esCorrecta: p.respuestaCorrecta === o.id,
    }));
  }
  if (p.tipo === "verdadero_falso") {
    return [
      {
        letra: "A",
        texto: "Verdadero",
        esSeleccionada: valor === true,
        esCorrecta: p.respuestaCorrecta === true,
      },
      {
        letra: "B",
        texto: "Falso",
        esSeleccionada: valor === false,
        esCorrecta: p.respuestaCorrecta === false,
      },
    ];
  }
  return [];
}

export default function ConstanciaDocument({
  curso,
  intento,
  preguntas,
}: {
  curso: Curso;
  intento: Intento;
  preguntas: Pregunta[];
}) {
  const aprobado = intento.estado === "aprobado";
  const pendiente = intento.estado === "pendiente_revision";
  const estadoTexto = aprobado ? "APROBADO" : pendiente ? "PENDIENTE DE REVISION" : "DESAPROBADO";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBox}>
          <View style={styles.headerLogoCell}>
            <Image src={LOGO_JJC_BASE64} style={styles.logoImg} />
          </View>
          <View style={styles.headerTitleCell}>
            <Text style={[styles.tituloCurso, { marginTop: 0 }]}>{curso.nombre.toUpperCase()}</Text>
            {curso.descripcion ? <Text style={styles.codigoCurso}>{curso.descripcion}</Text> : null}
          </View>
        </View>

        <View style={styles.cuerpoRow}>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Empresa: </Text>
              <Text>JJC Contratistas Generales S.A.</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Apellidos y nombres: </Text>
              <Text>
                {intento.apellidos} {intento.nombres}
              </Text>
              <Text style={[styles.infoLabel, { marginLeft: 20 }]}>DNI: </Text>
              <Text>{intento.dni}</Text>
            </View>
            {intento.instructor ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Instructor: </Text>
                <Text>{intento.instructor}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha: </Text>
              <Text>{formatearFecha(intento.fecha)}</Text>
              <Text style={[styles.infoLabel, { marginLeft: 20 }]}>Nota minima aprobatoria: </Text>
              <Text>{curso.notaMinimaAprobatoria}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Resultado: </Text>
              <Text>{estadoTexto}</Text>
            </View>
          </View>
          <View style={styles.notaBox}>
            <Text style={styles.notaLabel}>Nota</Text>
            <Text style={styles.notaValor}>{intento.nota ?? "-"}</Text>
          </View>
        </View>

        <Text style={styles.seccion}>
          I. Detalle de respuestas ({preguntas.length}{" "}
          {preguntas.length === 1 ? "pregunta" : "preguntas"})
        </Text>

        {preguntas.map((p, i) => {
          const rd = intento.respuestas.find((r) => r.preguntaId === p.id);
          const dada = rd?.valor ?? null;
          const correcta = evaluarPregunta(p, dada, rd?.revisionManual);
          const estilo =
            correcta === null
              ? styles.respuestaPendiente
              : correcta
              ? styles.respuestaOk
              : styles.respuestaMal;
          const marca = correcta === null ? "[?]" : correcta ? "[OK]" : "[X]";
          const conAlternativas = p.tipo === "opcion_multiple" || p.tipo === "verdadero_falso";
          const alternativas = conAlternativas ? alternativasDe(p, dada) : [];
          return (
            <View key={p.id} style={styles.pregunta} wrap={false}>
              <Text style={styles.enunciado}>
                {conAlternativas ? <Text style={estilo}>{marca} </Text> : null}
                {i + 1}. {p.enunciado}
              </Text>

              {conAlternativas ? (
                <View style={styles.altList}>
                  {alternativas.map((a) => {
                    const altStyle =
                      a.esSeleccionada && a.esCorrecta
                        ? styles.altOkSel
                        : a.esSeleccionada && !a.esCorrecta
                        ? styles.altBadSel
                        : a.esCorrecta
                        ? styles.altCorrectMark
                        : styles.altPlain;
                    const etiqueta =
                      a.esSeleccionada && a.esCorrecta
                        ? "  (Respondio - Correcta)"
                        : a.esSeleccionada
                        ? "  (Respondio)"
                        : a.esCorrecta
                        ? "  (Correcta)"
                        : "";
                    return (
                      <Text key={a.letra} style={[styles.altItem, altStyle]}>
                        {a.letra}) {a.texto}
                        {etiqueta}
                      </Text>
                    );
                  })}
                </View>
              ) : (
                <>
                  <Text style={estilo}>
                    {marca} Respondio: {textoRespuesta(p, dada)}
                  </Text>
                  {correcta === false ? (
                    <Text style={styles.correcta}>Correcta: {textoCorrecta(p)}</Text>
                  ) : null}
                  {correcta === null ? (
                    <Text style={styles.correcta}>Requiere revision manual</Text>
                  ) : null}
                </>
              )}
            </View>
          );
        })}

        <Text style={styles.footer}>
          Constancia generada digitalmente por el Sistema de Examenes CC0174 - JJC Contratistas
          Generales S.A.
        </Text>
      </Page>
    </Document>
  );
}
