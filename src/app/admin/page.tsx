import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const repos = createRepositories(supabase);

  const [profilesResult, initiativesResult] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("initiatives").select("*", { count: "exact", head: true }),
  ]);

  const usersCount = profilesResult.count ?? 0;
  const initiativesCount = initiativesResult.count ?? 0;

  const pendingVerifications = await supabase
    .from("political_profiles")
    .select("user_id", { count: "exact", head: true })
    .eq("verification_status", "PENDING");
  const pendingCount = pendingVerifications.count ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Panel de administración</h1>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-sm text-neutral-500">Usuarios</p>
          <p className="text-2xl font-semibold">{usersCount}</p>
          <Link href="/admin/users" className="text-sm text-blue-600 dark:text-blue-400 mt-2 inline-block">
            Ver lista
          </Link>
        </div>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-sm text-neutral-500">Iniciativas</p>
          <p className="text-2xl font-semibold">{initiativesCount}</p>
          <Link href="/admin/initiatives" className="text-sm text-blue-600 dark:text-blue-400 mt-2 inline-block">
            Ver lista
          </Link>
        </div>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-sm text-neutral-500">Verificaciones pendientes</p>
          <p className="text-2xl font-semibold">{pendingCount}</p>
          <Link href="/admin/political-verifications" className="text-sm text-blue-600 dark:text-blue-400 mt-2 inline-block">
            Revisar
          </Link>
        </div>
      </div>
    </div>
  );
}
