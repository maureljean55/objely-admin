import Link from "next/link";
import { listConversations, type SupportStatus } from "@/lib/queries/support";
import { Badge } from "@/components/Badge";
import { formatNumber, formatRelativeTime, initials } from "@/lib/format";
import { Pagination } from "@/components/Pagination";

const STATUS_TABS: { key: SupportStatus | "all"; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "escalated", label: "Escaladées" },
  { key: "bot", label: "Bot" },
  { key: "closed", label: "Fermées" },
];

const STATUS_BADGE: Record<SupportStatus, { label: string; variant: "warning" | "success" | "primary" }> = {
  bot: { label: "Bot", variant: "primary" },
  escalated: { label: "Escaladée", variant: "warning" },
  closed: { label: "Fermée", variant: "success" },
};

export default async function ServiceClientPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = (["bot", "escalated", "closed"].includes(params.status ?? "") ? params.status : "all") as SupportStatus | "all";

  const { rows, total, pageSize } = await listConversations(page, status);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-headline-md text-on-surface">Service client &amp; support</h1>
        <p className="text-body-sm text-on-surface-variant">{formatNumber(total)} conversations de support</p>
      </div>

      <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl shadow-card self-start">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/service-client" : `/service-client?status=${tab.key}`}
            className={`px-3.5 py-1.5 rounded-lg text-label-md transition-all ${
              status === tab.key ? "bg-primary text-white font-semibold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="bg-surface-card rounded-xl shadow-card overflow-hidden divide-y divide-border-subtle">
        {rows.map((c) => {
          const badge = STATUS_BADGE[c.status];
          return (
            <Link key={c.id} href={`/service-client/${c.id}`} className="flex items-center gap-4 p-4 hover:bg-surface-bg/50 transition-colors">
              <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-md font-semibold shrink-0">
                {initials(c.userName)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-label-md text-on-surface font-semibold truncate">{c.userName}</span>
                  {c.userEmail && <span className="text-body-sm text-on-surface-variant truncate">{c.userEmail}</span>}
                </div>
                <p className="text-body-sm text-on-surface-variant truncate mt-0.5">{c.lastMessagePreview}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Badge variant={badge.variant}>{badge.label}</Badge>
                <span className="text-label-sm text-on-surface-variant">{formatRelativeTime(c.updatedAt)}</span>
              </div>
            </Link>
          );
        })}
        {rows.length === 0 && <p className="p-10 text-center text-body-sm text-on-surface-variant">Aucune conversation dans cette catégorie.</p>}
        <Pagination page={page} totalPages={totalPages} basePath="/service-client" extraParams={{ status: status !== "all" ? status : undefined }} />
      </div>
    </div>
  );
}
