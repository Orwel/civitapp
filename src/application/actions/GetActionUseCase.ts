import type {
  ConstitutionalAction,
  ConstitutionalActionPublic,
} from "@/core/entities/ConstitutionalAction";
import type { Repositories } from "@/infrastructure/repositories";

export async function getAction(
  repos: Repositories,
  id: string
): Promise<ConstitutionalAction | null> {
  return repos.actions.getByIdWithType(id);
}

export async function getActionBySlug(
  repos: Repositories,
  slug: string
): Promise<ConstitutionalAction | null> {
  return repos.actions.getBySlug(slug);
}

export async function getPublicActionBySlug(
  repos: Repositories,
  slug: string
): Promise<ConstitutionalActionPublic | null> {
  return repos.actions.getPublicBySlug(slug);
}
