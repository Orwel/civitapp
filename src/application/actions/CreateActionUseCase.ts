import type { ConstitutionalAction } from "@/core/entities/ConstitutionalAction";

import type { Repositories } from "@/infrastructure/repositories";

import type { CreateActionInput } from "@/core/repositories/IConstitutionalActionRepository";



export async function createAction(

  repos: Repositories,

  input: CreateActionInput

): Promise<ConstitutionalAction> {
  if (input.client_request_id) {
    const existing = await repos.actions.findByCreatorRequest(
      input.created_by,
      input.client_request_id
    );
    if (existing) return existing;
  }

  const action = await repos.actions.create(input);

  await repos.actions.addRole(action.id, input.created_by, "CREADOR", input.created_by);

  await repos.actions.addRole(action.id, input.created_by, "LIDER", input.created_by);

  await repos.chat.createDefaultThread(action.id);



  return action;

}

