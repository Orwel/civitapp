import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/infrastructure/supabase/server";
import { VerifyActions } from "./VerifyActions";

export default async function AdminPoliticalVerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("id, full_name").eq("id", id).single();
  const { data: political } = await supabase.from("political_profiles").select("*").eq("user_id", id).single();
  if (!political) notFound();

  return (
    <div>
      <Link href="/admin/political-verifications" className="text-sm text-neutral-500 hover:underline mb-4 inline-block">
        ← Verificaciones
      </Link>
      <h1 className="text-2xl font-bold mb-6">Verificación: {profile?.full_name ?? id.slice(0, 8)}</h1>
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 max-w-lg space-y-2 mb-6">
        <p><span className="text-neutral-500">Cargo:</span> {political.office_type}</p>
        <p><span className="text-neutral-500">Región:</span> {political.region ?? "—"}</p>
        <p><span className="text-neutral-500">Estado:</span> {political.verification_status}</p>
        {political.public_profile && Object.keys(political.public_profile as object).length > 0 && (
          <pre className="text-xs bg-neutral-100 dark:bg-neutral-800 p-2 rounded mt-2">
            {JSON.stringify(political.public_profile, null, 2)}
          </pre>
        )}
      </div>
      <VerifyActions userId={id} status={political.verification_status} />
    </div>
  );
}
