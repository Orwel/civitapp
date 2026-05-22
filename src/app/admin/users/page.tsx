import { createClient } from "@/infrastructure/supabase/server";
import Link from "next/link";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Usuarios</h1>
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-800">
            <tr>
              <th className="text-left p-3 font-medium">Nombre</th>
              <th className="text-left p-3 font-medium">ID</th>
              <th className="text-left p-3 font-medium">Rol</th>
              <th className="text-left p-3 font-medium">Registro</th>
              <th className="text-left p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p) => (
              <tr key={p.id} className="border-t border-neutral-200 dark:border-neutral-700">
                <td className="p-3">{p.full_name ?? "—"}</td>
                <td className="p-3 font-mono text-xs">{p.id.slice(0, 8)}…</td>
                <td className="p-3 font-mono text-xs">{p.role ?? "USER"}</td>
                <td className="p-3">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <Link href={`/admin/users/${p.id}`} className="text-blue-600 dark:text-blue-400">Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
