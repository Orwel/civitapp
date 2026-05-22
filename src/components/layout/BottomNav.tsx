"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  MessageSquare,
  Calendar,
  CalendarDays,
  FileText,
  Home,
  Search,
  Plus,
  User as UserIcon,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function BottomNav({
  user,
  actionId,
}: {
  user: User | null;
  actionId: string | null;
}) {
  const pathname = usePathname();
  const isLogged = Boolean(user);
  const base = actionId ? `/dashboard/acciones/${actionId}` : null;

  let items: NavItem[] = [];

  if (base) {
    items = [
      { href: base, label: "Resumen", icon: FileText },
      { href: `${base}/chat`, label: "Chat", icon: MessageSquare },
      { href: `${base}/events`, label: "Bitácora", icon: Calendar },
      { href: `${base}/meetups`, label: "Eventos", icon: CalendarDays },
    ];
  } else if (isLogged) {
    items = [
      { href: "/dashboard", label: "Inicio", icon: Home },
      { href: "/acciones", label: "Explorar", icon: Search },
      { href: "/acciones/nueva", label: "Nueva", icon: Plus },
      { href: "/dashboard/profile", label: "Perfil", icon: UserIcon },
    ];
  } else {
    items = [
      { href: "/", label: "Inicio", icon: Home },
      { href: "/acciones", label: "Explorar", icon: Search },
      { href: "/login", label: "Entrar", icon: LogIn },
    ];
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around h-14 border-t border-[var(--border)] bg-[var(--surface)] px-2">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href ||
          (href !== "/dashboard" &&
            href !== "/acciones" &&
            href !== "/" &&
            pathname.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-card text-xs font-semibold transition-colors",
              isActive
                ? "text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
