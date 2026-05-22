export const ACTION_DOCUMENTS_BUCKET = "action_documents";

export function draftPdfStoragePath(actionId: string): string {
  return `${actionId}/draft.pdf`;
}
