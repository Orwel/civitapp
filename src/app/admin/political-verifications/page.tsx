import { createClient } from "@/infrastructure/supabase/server";
import Link from "next/link";

export default async function AdminPoliticalVerificationsPage() {
  const supabase = await createClient();
  const { data: list } = await supabase
    .from("political_profiles")
    .select("user_id, office_type, region, verification_status, created_at")
    .order("created_at", { ascending: false });

  const pending = (list ?? []).filter((p) => p.verification_status === "PENDING");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Verificaciones políticas</h1>
      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-amber-600 dark:text-amber-400">Pendientes</h2>
          <ul className="space-y-2">
            {pending.map((p) => (
              <li key={p.user_id} className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <div>
                  <p className="font-medium">{p.office_type} · {p.region ?? "—"}</p>
                  <p className="text-xs text-neutral-500 font-mono">{p.user_id.slice(0, 8)}…</p>
                </div>
                <Link href={`/admin/political-verifications/${p.user_id}`} className="text-sm text-blue-600 dark:text-blue-400">Revisar</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <h2 className="text-lg font-semibold mb-3">Todas</h2>
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-800">
            <tr>
              <th className="text-left p-3 font-medium">Cargo</th>
              <th className="text-left p-3 font-medium">Región</th>
              <th className="text-left p-3 font-medium">Estado</th>
              <th className="text-left p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(list ?? []).map((p) => (
              <tr key={p.user_id} className="border-t border-neutral-200 dark:border-neutral-700">
                <td className="p-3">{p.office_type}</td>
                <td className="p-3">{p.region ?? "—"}</td>
                <td className="p-3">{p.verification_status}</td>
                <td className="p-3">
                  <Link href={`/admin/political-verifications/${p.user_id}`} className="text-blue-600 dark:text-blue-400">Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
