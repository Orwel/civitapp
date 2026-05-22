"use client";

import Link from "next/link";
import {
  Search,
  Plus,
  Home,
  LogIn,
  UserPlus,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  LogOut,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { ConstitutionalAction } from "@/core/entities/ConstitutionalAction";
import type { ConstitutionalActionPublic } from "@/core/entities/ConstitutionalAction";
import type { ActionState } from "@/core/types/actionState";
import { ACTION_STATE_LABELS } from "@/core/types/actionState";
import { cn } from "@/lib/utils";
import { getCanonicalActionDashboardPath } from "@/lib/actionStateRoutes";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { createClient } from "@/infrastructure/supabase/client";
import { useRouter } from "next/navigation";

type SidebarAction =
  | ConstitutionalAction
  | ConstitutionalActionPublic;

interface SidebarProps {
  user: SupabaseUser | null;
  actions?: ConstitutionalAction[];
  guestActions?: {
    inSignature: ConstitutionalActionPublic[];
    inDraft: ConstitutionalActionPublic[];
  };
  currentId: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

const SIDEBAR_GROUPS: { states: ActionState[]; label: string }[] = [
  { states: ["EN_CREACION"], label: "Borradores" },
  { states: ["EN_FIRMA"], label: "En firma" },
  { states: ["FIRMADO", "RADICADO", "FINALIZADO"], label: "Otras" },
];

function groupUserActions(actions: ConstitutionalAction[]) {
  const used = new Set<string>();
  const groups: { label: string; items: ConstitutionalAction[] }[] = [];
  for (const { states, label } of SIDEBAR_GROUPS) {
    const items = actions.filter((a) => states.includes(a.state) && !used.has(a.id));
    items.forEach((a) => used.add(a.id));
    if (items.length > 0) groups.push({ label, items });
  }
  const rest = actions.filter((a) => !used.has(a.id));
  if (rest.length > 0) groups.push({ label: "Otras", items: rest });
  return groups;
}

function actionHref(action: SidebarAction, isLogged: boolean): string {
  if (isLogged && "created_by" in action) {
    return getCanonicalActionDashboardPath(action);
  }
  return `/acciones/${action.slug}`;
}

function ActionLink({
  action,
  currentId,
  isLogged,
  collapsed,
  onClose,
}: {
  action: SidebarAction;
  currentId: string | null;
  isLogged: boolean;
  collapsed: boolean;
  onClose?: () => void;
}) {
  const initials =
    "action_type" in action && action.action_type?.slug
      ? action.action_type.slug.slice(0, 2).toUpperCase()
      : "AC";

  return (
    <Link
      href={actionHref(action, isLogged)}
      onClick={onClose}
      title={collapsed ? action.title : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-medium transition-colors",
        currentId === action.id
          ? "bg-[var(--accent)]/15 text-[var(--accent)]"
          : "text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
        collapsed && "justify-center px-2"
      )}
    >
      <span className="w-9 h-9 rounded-card bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center text-xs font-semibold shrink-0">
        {initials}
      </span>
      {!collapsed && (
        <span className="truncate flex-1 min-w-0">
          {action.title}
          {action.state !== "EN_FIRMA" && (
            <span className="ml-1 text-[10px] text-[var(--muted)]">
              · {ACTION_STATE_LABELS[action.state]}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({
  user,
  actions = [],
  guestActions,
  currentId,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const { collapsed, toggle, hydrated } = useSidebarCollapsed();
  const router = useRouter();
  const isLogged = Boolean(user);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const showCollapsed = hydrated && collapsed;
  const actionGroups = isLogged ? groupUserActions(actions) : [];

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 lg:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        data-collapsed={showCollapsed ? "true" : "false"}
        style={
          {
            "--sidebar-w": showCollapsed ? "72px" : "280px",
          } as React.CSSProperties
        }
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-[var(--sidebar-w)] max-w-[85vw] border-r border-[var(--border)] bg-[var(--surface)] flex flex-col shadow-card transition-[width] duration-200",
          "lg:static lg:z-auto lg:shrink-0 lg:shadow-none lg:h-screen lg:sticky lg:top-0",
          !isOpen && "hidden lg:flex"
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-[var(--border)] p-3 gap-2",
            showCollapsed && "justify-center"
          )}
        >
          {!showCollapsed && (
            <BrandLogo href={isLogged ? "/dashboard" : "/"} className="flex-1 min-w-0" />
          )}
          {showCollapsed && (
            <BrandLogo href={isLogged ? "/dashboard" : "/"} width={40} height={40} />
          )}
          <button
            type="button"
            onClick={toggle}
            className="hidden lg:flex p-2 rounded-card text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] shrink-0"
            aria-label={showCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {showCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="p-2 space-y-1 border-b border-[var(--border)]">
          {!showCollapsed && (
            <p className="px-3 py-1 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              Navegar
            </p>
          )}
          <Link
            href={isLogged ? "/dashboard" : "/"}
            onClick={onClose}
            title={showCollapsed ? "Inicio" : undefined}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-card text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
              showCollapsed && "justify-center px-2"
            )}
          >
            <Home className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            {!showCollapsed && "Inicio"}
          </Link>
          <Link
            href="/acciones"
            onClick={onClose}
            title={showCollapsed ? "Explorar" : undefined}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-card text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
              showCollapsed && "justify-center px-2"
            )}
          >
            <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            {!showCollapsed && "Explorar acciones"}
          </Link>
          {isLogged ? (
            <Link
              href="/acciones/nueva"
              onClick={onClose}
              title={showCollapsed ? "Nueva acción" : undefined}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-card text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
                showCollapsed && "justify-center px-2"
              )}
            >
              <Plus className="h-4 w-4 shrink-0 text-[var(--muted)]" />
              {!showCollapsed && "Nueva acción"}
            </Link>
          ) : null}
        </div>

        <div className="p-2 flex-1 overflow-auto min-h-0">
          {isLogged ? (
            <>
              {!showCollapsed && (
                <p className="px-3 py-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  Mis acciones
                </p>
              )}
              <nav className="space-y-3">
                {actions.length === 0 ? (
                  !showCollapsed && (
                    <p className="px-3 py-2 text-sm text-[var(--muted)]">
                      Aún no tienes acciones
                    </p>
                  )
                ) : (
                  actionGroups.map((group) => (
                    <div key={group.label} className="space-y-1">
                      {!showCollapsed && (
                        <p className="px-3 py-1 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                          {group.label}
                        </p>
                      )}
                      {group.items.map((action) => (
                        <ActionLink
                          key={action.id}
                          action={action}
                          currentId={currentId}
                          isLogged
                          collapsed={showCollapsed}
                          onClose={onClose}
                        />
                      ))}
                    </div>
                  ))
                )}
              </nav>
            </>
          ) : guestActions ? (
            <>
              {!showCollapsed && (
                <p className="px-3 py-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  Acciones públicas
                </p>
              )}
              <nav className="space-y-1">
                {guestActions.inSignature.map((action) => (
                  <ActionLink
                    key={action.id}
                    action={action}
                    currentId={currentId}
                    isLogged={false}
                    collapsed={showCollapsed}
                    onClose={onClose}
                  />
                ))}
                {guestActions.inDraft.map((action) => (
                  <ActionLink
                    key={action.id}
                    action={action}
                    currentId={currentId}
                    isLogged={false}
                    collapsed={showCollapsed}
                    onClose={onClose}
                  />
                ))}
              </nav>
              {!showCollapsed && (
                <Link
                  href="/acciones"
                  onClick={onClose}
                  className="block px-3 py-2 mt-2 text-xs font-semibold text-[var(--accent)] hover:underline"
                >
                  Ver todas las acciones →
                </Link>
              )}
            </>
          ) : null}
        </div>

        <div className="p-3 border-t border-[var(--border)] space-y-2">
          <Link
            href="/legal/responsabilidad"
            onClick={onClose}
            title={showCollapsed ? "Legal" : undefined}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-card text-xs text-[var(--muted)] hover:bg-[var(--surface-hover)]",
              showCollapsed && "justify-center px-2",
              isLogged && "mb-1"
            )}
          >
            {!showCollapsed && "Recursos legales"}
          </Link>
          {isLogged ? (
            <>
              <Link
                href="/dashboard/profile"
                onClick={onClose}
                title={showCollapsed ? "Perfil" : undefined}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-card text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
                  showCollapsed && "justify-center px-2"
                )}
              >
                <User className="h-4 w-4 shrink-0" />
                {!showCollapsed && "Perfil"}
              </Link>
              <button
                type="button"
                onClick={() => {
                  void handleSignOut();
                  onClose?.();
                }}
                title={showCollapsed ? "Cerrar sesión" : undefined}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-card text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]",
                  showCollapsed && "justify-center px-2"
                )}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!showCollapsed && "Cerrar sesión"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={onClose}
                className={cn(
                  "flex items-center justify-center gap-2 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold",
                  showCollapsed && "px-2"
                )}
              >
                <LogIn className="h-4 w-4 shrink-0" />
                {!showCollapsed && "Iniciar sesión"}
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className={cn(
                  "flex items-center justify-center gap-2 w-full rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-bold text-[var(--accent-foreground)]",
                  showCollapsed && "px-2"
                )}
              >
                <UserPlus className="h-4 w-4 shrink-0" />
                {!showCollapsed && "Registrarse"}
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
