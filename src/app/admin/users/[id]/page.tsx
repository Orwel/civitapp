import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import type { RoleGlobal } from "@/core/enums/Roles";
import { UserRoleActions } from "./UserRoleActions";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const role = (profile.role ?? "USER") as RoleGlobal;

  return (
    <div className="max-w-lg space-y-6">
      <Link
        href="/admin/users"
        className="text-sm font-medium text-civitapp-blue hover:text-civitapp-blue-light"
      >
        ← Usuarios
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{profile.full_name ?? "Sin nombre"}</h1>
        <p className="font-mono text-xs text-neutral-500 mt-1">{profile.id}</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          Registro: {new Date(profile.created_at).toLocaleString()}
        </p>
      </div>
      <section>
        <h2 className="text-lg font-semibold mb-3">Rol global</h2>
        <UserRoleActions userId={id} currentRole={role} />
      </section>
    </div>
  );
}
