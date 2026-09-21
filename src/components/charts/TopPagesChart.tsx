"use client";

import { useState } from "react";

export function TopPagesChart({ data }: { data: { path: string; visits: number }[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.visits));

  if (data.length === 0) {
    return <p className="text-body-sm text-on-surface-variant text-center py-10">Aucune visite sur cette période.</p>;
  }

  return (
    <div className="flex flex-col gap-3" role="img" aria-label="Pages les plus visitées">
      {data.map((d, i) => {
        const percent = Math.max((d.visits / max) * 100, 3);
        const isActive = activeIndex === i;
        return (
          <div
            key={d.path}
            className="flex items-center gap-3"
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(i)}
            onBlur={() => setActiveIndex(null)}
            tabIndex={0}
          >
            <span className="w-36 sm:w-44 shrink-0 truncate text-body-sm text-on-surface-variant" title={d.path}>
              {d.path}
            </span>
            <div className="relative flex-1 h-5 rounded-sm bg-surface-bg overflow-hidden">
              <div
                className="h-full transition-[width,background-color] duration-150"
                style={{
                  width: `${percent}%`,
                  backgroundColor: isActive ? "#0666C5" : "#087BEA",
                  borderRadius: "0 4px 4px 0",
                }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-label-md text-on-surface font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
              {d.visits}
            </span>
          </div>
        );
      })}
    </div>
  );
}
