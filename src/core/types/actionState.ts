export type ActionState =
  | "EN_CREACION"
  | "EN_FIRMA"
  | "FIRMADO"
  | "RADICADO"
  | "APELADO"
  | "EN_ESPERA_DE_OTRO_PROCESO"
  | "FINALIZADO";

export type RadicadoMilestone =
  | "RECIBIDA"
  | "ADMITIDA"
  | "INADMITIDA"
  | "EN_TRASLADO"
  | "EN_PRUEBAS"
  | "EN_AUDIENCIA"
  | "EN_DECISION"
  | "SENTENCIA";

export type FinalizadoResult =
  | "FAVORABLE"
  | "PARCIALMENTE_FAVORABLE"
  | "DESFAVORABLE"
  | "IMPROCEDENTE"
  | "DESISTIDA"
  | "ARCHIVADA_SIN_DECISION";

export type ActionContentMode = "TEMPLATE" | "TEXT" | "PDF";
export type PublicacionMode = "MANUAL" | "SCHEDULED";
export type ActionVisibility = "PUBLIC" | "UNLISTED";
export type ActionRole = "CREADOR" | "LIDER" | "CO_LIDER" | "APOYO";

export const ACTION_STATE_LABELS: Record<ActionState, string> = {
  EN_CREACION: "En creación",
  EN_FIRMA: "En firma",
  FIRMADO: "Firmado",
  RADICADO: "Radicado",
  APELADO: "Apelado",
  EN_ESPERA_DE_OTRO_PROCESO: "En espera",
  FINALIZADO: "Finalizado",
};

export const RADICADO_MILESTONE_LABELS: Record<RadicadoMilestone, string> = {
  RECIBIDA: "Recibida",
  ADMITIDA: "Admitida",
  INADMITIDA: "Inadmitida",
  EN_TRASLADO: "En traslado",
  EN_PRUEBAS: "En pruebas",
  EN_AUDIENCIA: "En audiencia",
  EN_DECISION: "En decisión",
  SENTENCIA: "Sentencia",
};

export const FINALIZADO_RESULT_LABELS: Record<FinalizadoResult, string> = {
  FAVORABLE: "Favorable",
  PARCIALMENTE_FAVORABLE: "Parcialmente favorable",
  DESFAVORABLE: "Desfavorable",
  IMPROCEDENTE: "Improcedente",
  DESISTIDA: "Desistida",
  ARCHIVADA_SIN_DECISION: "Archivada sin decisión",
};
