import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { BrandLogo } from "@/components/brand/BrandLogo";

export const runtime = "nodejs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin");

  const repos = createRepositories(supabase);
  const isAdmin = await repos.users.isAdmin(user.id);
  if (!isAdmin) redirect("/403");

  return (
    <div className="min-h-screen flex flex-col bg-civitapp-bg">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-civitapp-sky/20 bg-white px-4">
        <Link href="/admin" className="flex items-center gap-2 shrink-0">
          <span className="inline-flex rounded-lg bg-[var(--brand-navy)] px-2.5 py-1.5 ring-1 ring-black/10">
            <BrandLogo href={null} width={128} height={36} className="h-8 max-w-[7.5rem]" />
          </span>
          <span className="text-sm font-semibold text-civitapp-blue">Admin</span>
        </Link>
        <nav className="flex gap-2">
          <Link href="/admin" className="px-3 py-2 rounded-lg text-sm font-semibold text-civitapp-charcoal hover:bg-civitapp-sky/10 hover:text-civitapp-blue">
            Dashboard
          </Link>
          <Link href="/admin/users" className="px-3 py-2 rounded-lg text-sm font-semibold text-civitapp-charcoal hover:bg-civitapp-sky/10 hover:text-civitapp-blue">
            Usuarios
          </Link>
          <Link href="/admin/political-verifications" className="px-3 py-2 rounded-lg text-sm font-semibold text-civitapp-charcoal hover:bg-civitapp-sky/10 hover:text-civitapp-blue">
            Verificaciones
          </Link>
          <Link href="/admin/acciones" className="px-3 py-2 rounded-lg text-sm font-semibold text-civitapp-charcoal hover:bg-civitapp-sky/10 hover:text-civitapp-blue">
            Acciones
          </Link>
          <Link href="/admin/identity-verifications" className="px-3 py-2 rounded-lg text-sm font-semibold text-civitapp-charcoal hover:bg-civitapp-sky/10 hover:text-civitapp-blue">
            Identidad
          </Link>
          <Link href="/admin/initiatives" className="px-3 py-2 rounded-lg text-sm font-semibold text-civitapp-charcoal hover:bg-civitapp-sky/10 hover:text-civitapp-blue">
            Iniciativas
          </Link>
          <Link href="/admin/audit" className="px-3 py-2 rounded-lg text-sm font-semibold text-civitapp-charcoal hover:bg-civitapp-sky/10 hover:text-civitapp-blue">
            Auditoría
          </Link>
        </nav>
        <div className="flex-1" />
        <Link href="/dashboard" className="text-sm font-medium text-civitapp-blue hover:text-civitapp-blue-light">
          Salir de admin
        </Link>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
