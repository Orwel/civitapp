/** Estados de la iniciativa (nuevo modelo) */
export type InitiativeState =
  | "BORRADOR"
  | "ABIERTA"
  | "EN_EJECUCION"
  | "CON_INSTRUMENTOS_ACTIVOS"
  | "EN_INCIDENCIA"
  | "EN_ESPERA_DE_RESPUESTA"
  | "LOGRADA"
  | "CERRADA"
  | "ARCHIVADA";

/** Subestados de la iniciativa */
export type InitiativeSubstate =
  | "SIN_INSTRUMENTOS"
  | "CON_INSTRUMENTO_JUDICIAL_ACTIVO"
  | "CON_RECOLECCION_DE_FIRMAS_EN_CURSO"
  | "CON_AUDIENCIA_PROGRAMADA";

export const INITIATIVE_STATE_LABELS: Record<InitiativeState, string> = {
  BORRADOR: "Borrador",
  ABIERTA: "Abierta",
  EN_EJECUCION: "En ejecución",
  CON_INSTRUMENTOS_ACTIVOS: "Con instrumentos activos",
  EN_INCIDENCIA: "En incidencia",
  EN_ESPERA_DE_RESPUESTA: "En espera de respuesta",
  LOGRADA: "Lograda",
  CERRADA: "Cerrada",
  ARCHIVADA: "Archivada",
};

export const INITIATIVE_SUBSTATE_LABELS: Record<InitiativeSubstate, string> = {
  SIN_INSTRUMENTOS: "Sin instrumentos",
  CON_INSTRUMENTO_JUDICIAL_ACTIVO: "Con instrumento judicial activo",
  CON_RECOLECCION_DE_FIRMAS_EN_CURSO: "Con recolección de firmas en curso",
  CON_AUDIENCIA_PROGRAMADA: "Con audiencia programada",
};
