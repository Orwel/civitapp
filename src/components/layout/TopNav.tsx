"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Bell, User as UserIcon, LogIn } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { cn } from "@/lib/utils";

export function TopNav({
  user,
  className,
}: {
  user?: User | null;
  className?: string;
}) {
  const isLogged = Boolean(user);

  return (
    <nav
      className={cn(
        "hidden lg:flex min-h-14 shrink-0 items-center gap-6 border-b border-white/10 bg-[var(--brand-navy)] px-6 py-2 shadow-card",
        className
      )}
    >
      <div className="flex gap-1">
        <Link
          href={isLogged ? "/dashboard" : "/"}
          className="px-3 py-2 rounded-card text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-[var(--brand-blue-soft)]"
        >
          {isLogged ? "Mis acciones" : "Inicio"}
        </Link>
        <Link
          href="/acciones"
          className="px-3 py-2 rounded-card text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-[var(--brand-blue-soft)]"
        >
          Explorar
        </Link>
        {isLogged && (
          <Link
            href="/acciones/nueva"
            className="px-3 py-2 rounded-card text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-[var(--brand-blue-soft)]"
          >
            Nueva acción
          </Link>
        )}
      </div>
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
            className="flex items-center gap-2 rounded-card p-2 text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Perfil"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-3 py-2 rounded-card text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="px-3 py-2 rounded-lg bg-[var(--brand-indigo)] text-sm font-bold text-white hover:brightness-110"
          >
            Registrarse
          </Link>
        </div>
      )}
    </nav>
  );
}
