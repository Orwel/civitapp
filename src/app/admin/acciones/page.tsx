import { createClient } from "@/infrastructure/supabase/server";
import Link from "next/link";
import { ACTION_STATE_LABELS } from "@/core/types/actionState";

export default async function AdminAccionesPage() {
  const supabase = await createClient();
  const { data: actions } = await supabase
    .from("constitutional_actions")
    .select("id, title, slug, state, minimum_required, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Acciones constitucionales</h1>
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-800">
            <tr>
              <th className="text-left p-3 font-medium">Título</th>
              <th className="text-left p-3 font-medium">Estado</th>
              <th className="text-left p-3 font-medium">Mín. firmas</th>
              <th className="text-left p-3 font-medium">Fecha</th>
              <th className="text-left p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(actions ?? []).map((a) => (
              <tr key={a.id} className="border-t border-neutral-200 dark:border-neutral-700">
                <td className="p-3">{a.title}</td>
                <td className="p-3">
                  {ACTION_STATE_LABELS[a.state as keyof typeof ACTION_STATE_LABELS] ?? a.state}
                </td>
                <td className="p-3">{a.minimum_required}</td>
                <td className="p-3">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <Link
                    href={`/dashboard/acciones/${a.id}`}
                    className="text-blue-600 dark:text-blue-400"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
