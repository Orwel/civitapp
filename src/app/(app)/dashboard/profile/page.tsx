import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const repos = createRepositories(supabase);
  const profile = await repos.users.getProfile(user.id);

  return (
    <main className="flex-1 p-4 lg:p-6 overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Mi perfil</h2>
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 max-w-md">
        <p className="text-sm text-neutral-500">Correo</p>
        <p className="font-medium">{user.email}</p>
        <p className="text-sm text-neutral-500 mt-2">Nombre</p>
        <p className="font-medium">{profile?.full_name ?? "—"}</p>
      </div>
    </main>
  );
}
