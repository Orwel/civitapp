"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signActionAction } from "@/app/(app)/dashboard/acciones/[id]/actions";
import { getActionDashboardPath } from "@/lib/actionStateRoutes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SignActionButton({
  actionId,
  identityStatus,
}: {
  actionId: string;
  identityStatus: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSign() {
    setError(null);
    setLoading(true);
    const res = await signActionAction(actionId);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push(getActionDashboardPath(actionId, "EN_FIRMA"));
    router.refresh();
  }

  return (
    <Card className="p-0 border-0 shadow-none bg-transparent space-y-3">
      <p className="text-sm text-[var(--muted)]">
        Estado de identidad: <span className="font-medium">{identityStatus}</span>
        {identityStatus === "PENDING" && (
          <span className="block mt-1 text-xs">
            Tu identidad está pendiente de validación; puedes firmar mientras tanto.
          </span>
        )}
      </p>
      <Button type="button" variant="accent" disabled={loading} onClick={handleSign}>
        {loading ? "Firmando…" : "Confirmar mi firma"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </Card>
  );
}
