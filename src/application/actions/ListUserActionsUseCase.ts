import type { ConstitutionalAction } from "@/core/entities/ConstitutionalAction";
import type { Repositories } from "@/infrastructure/repositories";

export async function listUserActions(
  repos: Repositories,
  userId: string
): Promise<{ led: ConstitutionalAction[]; signed: ConstitutionalAction[] }> {
  const [led, signed] = await Promise.all([
    repos.actions.listByCreator(userId),
    repos.actions.listSignedByUser(userId),
  ]);
  return { led, signed };
}
