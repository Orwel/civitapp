"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";

export async function approveIdentityAction(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const repos = createRepositories(supabase);
  const isAdmin = await repos.users.isAdmin(user.id);
  if (!isAdmin) return { error: "No autorizado" };
  try {
    await repos.users.setIdentityVerification(userId, "APPROVED", user.id);
    revalidatePath("/admin/identity-verifications");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error" };
  }
}

export async function rejectIdentityAction(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const repos = createRepositories(supabase);
  const isAdmin = await repos.users.isAdmin(user.id);
  if (!isAdmin) return { error: "No autorizado" };
  try {
    await repos.users.setIdentityVerification(userId, "REJECTED", user.id);
    revalidatePath("/admin/identity-verifications");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error" };
  }
}
