"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/client";

export function VerifyActions({
  userId,
  status,
}: {
  userId: string;
  status: string;
}) {
  const router = useRouter();

  async function setStatus(newStatus: "VERIFIED" | "REJECTED") {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("political_profiles")
      .update({
        verification_status: newStatus,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (newStatus === "VERIFIED") {
      await supabase
        .from("profiles")
        .update({ role: "POLITICAL_VERIFIED", updated_at: new Date().toISOString() })
        .eq("id", userId);
    }
    router.refresh();
  }

  if (status !== "PENDING") {
    return <p className="text-neutral-500">Esta solicitud ya fue revisada.</p>;
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setStatus("VERIFIED")}
        className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium"
      >
        Aprobar
      </button>
      <button
        type="button"
        onClick={() => setStatus("REJECTED")}
        className="rounded-lg border border-red-600 text-red-600 px-4 py-2 text-sm font-medium"
      >
        Rechazar
      </button>
    </div>
  );
}
