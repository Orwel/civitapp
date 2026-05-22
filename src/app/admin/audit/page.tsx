import { createClient } from "@/infrastructure/supabase/server";

export default async function AdminAuditPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("initiative_events")
    .select("id, initiative_id, event_type, actor_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Auditoría</h1>
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-800">
            <tr>
              <th className="text-left p-3 font-medium">Fecha</th>
              <th className="text-left p-3 font-medium">Tipo</th>
              <th className="text-left p-3 font-medium">Iniciativa</th>
              <th className="text-left p-3 font-medium">Actor</th>
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((e) => (
              <tr key={e.id} className="border-t border-neutral-200 dark:border-neutral-700">
                <td className="p-3">{new Date(e.created_at).toLocaleString()}</td>
                <td className="p-3">{e.event_type}</td>
                <td className="p-3 font-mono text-xs">{e.initiative_id?.slice(0, 8)}…</td>
                <td className="p-3 font-mono text-xs">{e.actor_id?.slice(0, 8) ?? "—"}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
