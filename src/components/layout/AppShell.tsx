"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Header } from "./Header";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import type { ConstitutionalAction } from "@/core/entities/ConstitutionalAction";
import type { ConstitutionalActionPublic } from "@/core/entities/ConstitutionalAction";
import { usePathname } from "next/navigation";

export function AppShell({
  user,
  children,
  actions = [],
  guestActions,
}: {
  user: User | null;
  children: React.ReactNode;
  actions?: ConstitutionalAction[];
  guestActions?: {
    inSignature: ConstitutionalActionPublic[];
    inDraft: ConstitutionalActionPublic[];
  };
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const actionIdFromPath =
    pathname.match(/^\/dashboard\/acciones\/([^/]+)/)?.[1] ?? null;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[auto_1fr] lg:h-screen lg:overflow-hidden">
      <Sidebar
        user={user}
        actions={actions}
        guestActions={guestActions}
        currentId={actionIdFromPath}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <div className="flex flex-col min-h-screen lg:min-h-0 lg:overflow-hidden">
        <div className="lg:hidden shrink-0">
          <Header
            user={user}
            onMenuClick={() => setDrawerOpen((o) => !o)}
            showMenuButton
          />
        </div>
        <TopNav user={user} className="hidden lg:flex shrink-0" />
        <main className="flex-1 flex flex-col min-h-0 pb-14 lg:pb-0 bg-[var(--background)] overflow-hidden">
          {children}
        </main>
        <BottomNav user={user} actionId={actionIdFromPath} />
      </div>
    </div>
  );
}
