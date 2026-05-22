"use client";

import type { InitiativeMemberWithProfile } from "@/core/entities/Member";
import { Card } from "@/components/ui/card";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Creador",
  LEADER: "Líder",
  MEMBER: "Miembro",
  OBSERVER: "Observador",
  POLITICAL_SPONSOR: "Patrocinador político",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  INVITED: "Invitado",
  REMOVED: "Retirado",
  BANNED: "Bloqueado",
};

interface MembersPanelProps {
  members: InitiativeMemberWithProfile[];
}

export function MembersPanel({ members }: MembersPanelProps) {
  if (members.length === 0) {
    return (
      <Card className="p-8 text-center text-[var(--muted)]">
        No hay miembros en esta iniciativa.
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {members.map((m) => (
        <li key={`${m.initiative_id}-${m.user_id}`}>
          <Card className="p-4 hover:shadow-card-hover transition-shadow" hover>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center text-sm font-semibold shrink-0">
                  {(m.profile?.full_name ?? m.user_id.slice(0, 2)).slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">
                    {m.profile?.full_name ?? "Usuario"}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {ROLE_LABELS[m.role_in_initiative] ?? m.role_in_initiative} ·{" "}
                    {STATUS_LABELS[m.member_status] ?? m.member_status}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
