import { ACTION_DOCUMENTS_BUCKET } from "@/lib/actionDocuments";

export function actionSignatureStoragePath(actionId: string, userId: string): string {
  return `${actionId}/signatures/${userId}.png`;
}

export function actionSignatureStorageRef(actionId: string, userId: string): string {
  return `${ACTION_DOCUMENTS_BUCKET}/${actionSignatureStoragePath(actionId, userId)}`;
}
