/** Estados del instrumento (base y especiales por tipo) */
export type InstrumentState =
  | "BORRADOR"
  | "CONFIGURACION"
  | "RECOLECCION"
  | "RADICADO"
  | "EN_TRAMITE"
  | "EN_AUDIENCIA"
  | "EN_DECISION"
  | "FAVORABLE"
  | "DESFAVORABLE"
  | "ARCHIVADO"
  | "CERRADO"
  | "PENDIENTE_VALIDACION"
  | "VALIDACION_REGISTRADURIA"
  | "META_ALCANZADA"
  | "META_NO_ALCANZADA"
  | "ADMITIDA"
  | "INADMITIDA"
  | "EN_TRASLADO"
  | "EN_PRUEBAS"
  | "SENTENCIA"
  | "EN_TERMINO"
  | "RESPONDIDO"
  | "SILENCIO_ADMINISTRATIVO";

export const INSTRUMENT_STATE_LABELS: Record<InstrumentState, string> = {
  BORRADOR: "Borrador",
  CONFIGURACION: "Configuración",
  RECOLECCION: "Recolección",
  RADICADO: "Radicado",
  EN_TRAMITE: "En trámite",
  EN_AUDIENCIA: "En audiencia",
  EN_DECISION: "En decisión",
  FAVORABLE: "Favorable",
  DESFAVORABLE: "Desfavorable",
  ARCHIVADO: "Archivado",
  CERRADO: "Cerrado",
  PENDIENTE_VALIDACION: "Pendiente validación",
  VALIDACION_REGISTRADURIA: "Validación Registraduría",
  META_ALCANZADA: "Meta alcanzada",
  META_NO_ALCANZADA: "Meta no alcanzada",
  ADMITIDA: "Admitida",
  INADMITIDA: "Inadmitida",
  EN_TRASLADO: "En traslado",
  EN_PRUEBAS: "En pruebas",
  SENTENCIA: "Sentencia",
  EN_TERMINO: "En término",
  RESPONDIDO: "Respondido",
  SILENCIO_ADMINISTRATIVO: "Silencio administrativo",
};
