"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { formatCompactNumber } from "@/lib/format";
import type { NavCounts } from "@/lib/queries/counts";
import type { AdminSession } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "Tableau de bord", icon: "dashboard" },
  { href: "/utilisateurs", label: "Utilisateurs", icon: "group", countKey: "users" as const },
  { href: "/objets", label: "Objets", icon: "inventory_2" },
  { href: "/correspondances", label: "Correspondances", icon: "link", countKey: "activeMatches" as const, badgeStyle: "primary" as const },
  { href: "/service-client", label: "Service client", icon: "support_agent", countKey: "escalatedTickets" as const, badgeStyle: "secondary" as const },
  { href: "/signalements", label: "Signalements", icon: "flag", countKey: "openReports" as const, badgeStyle: "danger" as const },
  { href: "/verifications-identite", label: "Vérification d'identité", icon: "badge", countKey: "pendingIdentityVerifications" as const, badgeStyle: "primary" as const },
];

const SECONDARY_NAV_ITEMS = [
  { href: "/administrateurs", label: "Administrateurs", icon: "admin_panel_settings" },
  { href: "/journal-activite", label: "Journal d'activité", icon: "history" },
];

const BADGE_STYLES: Record<string, string> = {
  neutral: "bg-surface-bg text-on-surface-variant",
  primary: "bg-primary-container text-on-primary-container font-semibold",
  secondary: "bg-tertiary-container text-tertiary font-semibold",
  danger: "bg-danger-crimson text-white font-semibold",
};

export function Sidebar({ counts, session }: { counts: NavCounts; session: AdminSession }) {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[250px] bg-surface-card border-r border-border-subtle z-50 flex flex-col justify-between select-none">
      <div className="flex flex-col h-full">
        <div className="h-16 px-4 border-b border-border-subtle flex items-center shrink-0">
          <Logo className="h-8 w-auto" />
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const count = item.countKey ? counts[item.countKey] : undefined;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-body-sm transition-colors group ${
                  active ? "bg-primary text-white font-medium shadow-sm" : "text-on-surface-variant hover:bg-surface-bg hover:text-on-surface"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                {typeof count === "number" && count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-label-sm ${
                      active ? "bg-white/20 text-white" : BADGE_STYLES[item.badgeStyle ?? "neutral"]
                    }`}
                  >
                    {formatCompactNumber(count)}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="my-2 border-t border-border-subtle" />
          {SECONDARY_NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-body-sm transition-colors ${
                  active ? "bg-primary text-white font-medium shadow-sm" : "text-on-surface-variant hover:bg-surface-bg hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-2 border-t border-border-subtle bg-surface-card">
        <Link href="/parametres" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-bg transition-colors group">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-sm font-semibold shrink-0">
              {session.fullName
                .split(" ")
                .slice(0, 2)
                .map((p) => p[0])
                .join("")
                .toUpperCase()}
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-label-md text-on-surface truncate">{session.fullName}</span>
              <span className="text-label-sm text-on-surface-variant truncate">{session.role === "super_admin" ? "Super Admin" : "Admin"}</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">settings</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-label-sm text-danger-crimson hover:bg-danger-container transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
