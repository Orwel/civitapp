import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { IdentityVerifyActions } from "@/components/features/admin/IdentityVerifyActions";

export default async function AdminIdentityVerificationsPage() {
  const supabase = await createClient();
  const repos = createRepositories(supabase);
  const profiles = await repos.users.listProfilesPendingIdentity(50);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Verificación de identidad</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
        Perfiles con identidad firmable enviada y pendiente de revisión.
      </p>
      {profiles.length === 0 ? (
        <p className="text-sm text-neutral-500">No hay solicitudes pendientes.</p>
      ) : (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800">
              <tr>
                <th className="text-left p-3 font-medium">Nombre</th>
                <th className="text-left p-3 font-medium">Cédula</th>
                <th className="text-left p-3 font-medium">Rutas</th>
                <th className="text-left p-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-t border-neutral-200 dark:border-neutral-700">
                  <td className="p-3">{p.full_name ?? p.id.slice(0, 8)}</td>
                  <td className="p-3 font-mono text-xs">{p.cedula}</td>
                  <td className="p-3 text-xs text-neutral-500 max-w-xs truncate">
                    {p.cedula_front_path} · {p.signature_image_path}
                  </td>
                  <td className="p-3">
                    <IdentityVerifyActions userId={p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
