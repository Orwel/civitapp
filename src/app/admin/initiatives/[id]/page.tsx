import { redirect } from "next/navigation";

export default async function AdminInitiativeLegacyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/acciones`);
}
