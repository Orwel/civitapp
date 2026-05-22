"use client";

import Link from "next/link";
import { Search, Plus } from "lucide-react";
import type { ConstitutionalAction } from "@/core/entities/ConstitutionalAction";
import { cn } from "@/lib/utils";

interface ActionDrawerProps {
  actions: ConstitutionalAction[];
  currentId: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ActionDrawer({
  actions,
  currentId,
  isOpen = false,
  onClose,
}: ActionDrawerProps) {
  return (
    <>
      <DrawerOverlay isOpen={isOpen} onClose={onClose} />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 max-w-[85vw] border-r border-[var(--border)] bg-[var(--surface)] flex flex-col shadow-card",
          "lg:static lg:z-auto lg:block lg:shrink-0 lg:shadow-none",
          !isOpen && "hidden lg:flex"
        )}
      >
        <div className="p-4 space-y-2 border-b border-[var(--border)]">
          <Link
            href="/acciones"
            className="flex items-center gap-2 px-3 py-2.5 rounded-card text-[var(--foreground)] hover:bg-[var(--surface-hover)] text-sm font-medium transition-colors"
            onClick={onClose}
          >
            <Search className="h-4 w-4 text-[var(--muted)]" />
            Explorar acciones
          </Link>
          <Link
            href="/acciones/nueva"
            className="flex items-center gap-2 px-3 py-2.5 rounded-card text-[var(--foreground)] hover:bg-[var(--surface-hover)] text-sm font-medium transition-colors"
            onClick={onClose}
          >
            <Plus className="h-4 w-4 text-[var(--muted)]" />
            Nueva acción
          </Link>
        </div>
        <div className="p-2 flex-1 overflow-auto">
          <p className="px-3 py-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            Mis acciones
          </p>
          <nav className="space-y-1">
            {actions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-[var(--muted)]">
                Aún no tienes acciones
              </p>
            ) : (
              actions.map((action) => (
                <Link
                  key={action.id}
                  href={`/dashboard/acciones/${action.id}`}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-medium transition-colors",
                    currentId === action.id
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                  )}
                >
                  <span className="w-9 h-9 rounded-card bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center text-xs font-semibold shrink-0">
                    {action.action_type?.slug?.slice(0, 2).toUpperCase() ?? "AC"}
                  </span>
                  <span className="truncate">{action.title}</span>
                </Link>
              ))
            )}
          </nav>
        </div>
      </aside>
    </>
  );
}

function DrawerOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose?: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-40 bg-black/50 lg:hidden",
        isOpen ? "block" : "hidden"
      )}
      onClick={onClose}
      aria-hidden
    />
  );
}
