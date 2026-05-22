"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Menu, Bell, User as UserIcon, LogIn } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user?: User | null;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  className?: string;
}

export function Header({
  user,
  onMenuClick,
  showMenuButton = true,
  className,
}: HeaderProps) {
  const isLogged = Boolean(user);

  return (
    <header
      className={cn(
        "flex min-h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-[var(--brand-navy)] px-4 py-2 shadow-card",
        className
      )}
    >
      {showMenuButton && (
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-card text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
      <BrandLogo href={isLogged ? "/dashboard" : "/"} priority />
      <div className="flex-1" />
      {isLogged ? (
        <>
          <Link
            href="/dashboard"
            className="p-2 rounded-card text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
          </Link>
          <Link
            href="/dashboard/profile"
            className="p-2 rounded-card text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Perfil"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
        </>
      ) : (
        <Link
          href="/login"
          className="flex items-center gap-1.5 rounded-card px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
        >
          <LogIn className="h-4 w-4" />
          Entrar
        </Link>
      )}
    </header>
  );
}
