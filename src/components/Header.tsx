import Image from "next/image";
import type { AdminSession } from "@/lib/auth";

export function Header({ session, avatarUrl }: { session: AdminSession; avatarUrl: string | null }) {
  return (
    <header className="fixed top-0 left-[250px] right-0 h-16 bg-surface-card/90 backdrop-blur-md border-b border-border-subtle z-40 px-6 flex items-center justify-between gap-6">
      <div className="flex items-center gap-6 flex-1 max-w-2xl">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="search"
            placeholder="Rechercher objets, utilisateurs..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-bg border border-border-subtle text-body-sm text-on-surface placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="h-4 w-px bg-border-subtle" />
        <div className="flex items-center gap-2 pl-1">
          <span className="relative w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-sm font-semibold shrink-0 overflow-hidden">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill sizes="32px" className="object-cover" />
            ) : (
              session.fullName
                .split(" ")
                .slice(0, 2)
                .map((p) => p[0])
                .join("")
                .toUpperCase()
            )}
          </span>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-label-md text-on-surface leading-none">{session.fullName}</span>
            <span className="text-label-sm text-on-surface-variant mt-0.5">{session.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
