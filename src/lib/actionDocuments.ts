export const ACTION_DOCUMENTS_BUCKET = "action_documents";

export function draftPdfStoragePath(actionId: string): string {
  return `${actionId}/draft.pdf`;
}

/** Documento definitivo (escrito + anexo de firmas). Solo legible por líderes y admin. */
export function finalPdfStoragePath(actionId: string): string {
  return `${actionId}/final/firmado.pdf`;
}
