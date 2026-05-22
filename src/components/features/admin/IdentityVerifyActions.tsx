"use client";

import { useRouter } from "next/navigation";
import {
  approveIdentityAction,
  rejectIdentityAction,
} from "@/app/admin/identity-verifications/actions";

export function IdentityVerifyActions({ userId }: { userId: string }) {
  const router = useRouter();

  async function approve() {
    const res = await approveIdentityAction(userId);
    if (!res.error) router.refresh();
  }

  async function reject() {
    const res = await rejectIdentityAction(userId);
    if (!res.error) router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={approve}
        className="rounded-lg bg-green-600 text-white px-3 py-1.5 text-xs font-medium"
      >
        Aprobar
      </button>
      <button
        type="button"
        onClick={reject}
        className="rounded-lg border border-red-600 text-red-600 px-3 py-1.5 text-xs font-medium"
      >
        Rechazar
      </button>
    </div>
  );
}
