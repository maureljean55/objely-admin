import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  basePath,
  extraParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  extraParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(extraParams ?? {})) {
      if (value) params.set(key, value);
    }
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="p-3 bg-surface-card flex items-center justify-between text-body-sm text-on-surface-variant border-t border-border-subtle">
      <span>
        Page {page} sur {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`px-3 py-1 rounded-lg bg-surface-bg hover:bg-surface-bg/70 transition-colors text-on-surface font-medium ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
        >
          Précédente
        </Link>
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`px-3 py-1 rounded-lg bg-surface-bg hover:bg-surface-bg/70 transition-colors text-on-surface font-medium ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
        >
          Suivante
        </Link>
      </div>
    </div>
  );
}
