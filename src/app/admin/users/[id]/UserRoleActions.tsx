"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/client";
import type { RoleGlobal } from "@/core/enums/Roles";

const ROLES: RoleGlobal[] = ["USER", "ADMIN", "POLITICAL_VERIFIED"];

export function UserRoleActions({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: RoleGlobal;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function changeRole(role: RoleGlobal) {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        El rol global está en la columna <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1 rounded">profiles.role</code>.
      </p>
      <label className="block text-sm font-medium" htmlFor="user-role">
        Rol
      </label>
      <select
        id="user-role"
        disabled={loading}
        value={currentRole}
        onChange={(e) => changeRole(e.target.value as RoleGlobal)}
        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
