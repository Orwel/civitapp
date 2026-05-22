import { notFound } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { getAction } from "@/application/actions";

export default async function ActionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const repos = createRepositories(supabase);
  const action = await getAction(repos, id);
  if (!action) notFound();
  return <>{children}</>;
}
