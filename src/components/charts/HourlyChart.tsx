"use client";

import { useState } from "react";

const WIDTH = 640;
const HEIGHT = 200;
const PADDING_LEFT = 30;
const PADDING_BOTTOM = 22;
const PADDING_TOP = 10;
const GRID_COLOR = "#E2E8F0";
const AXIS_TEXT_COLOR = "#64748B";
const BAR_COLOR = "#087BEA";
const BAR_HOVER_COLOR = "#0666C5";

export function HourlyChart({ data }: { data: { hour: number; visits: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const plotWidth = WIDTH - PADDING_LEFT - 4;
  const plotHeight = HEIGHT - PADDING_BOTTOM - PADDING_TOP;
  const max = Math.max(1, ...data.map((d) => d.visits));
  const barGap = 3;
  const barWidth = data.length > 0 ? plotWidth / data.length - barGap : 0;
  const yTicks = [0, Math.ceil(max / 2), max];

  if (data.length === 0) {
    return <p className="text-body-sm text-on-surface-variant text-center py-10">Aucune donnée sur cette période.</p>;
  }

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ minWidth: 420 }} role="img" aria-label="Visites par heure de la journée">
        {yTicks.map((t) => {
          const y = PADDING_TOP + plotHeight - (t / max) * plotHeight;
          return (
            <g key={t}>
              <line x1={PADDING_LEFT} x2={WIDTH} y1={y} y2={y} stroke={GRID_COLOR} strokeWidth={1} />
              <text x={PADDING_LEFT - 6} y={y} textAnchor="end" dy="0.32em" fontSize="10" fill={AXIS_TEXT_COLOR}>
                {t}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const x = PADDING_LEFT + i * (barWidth + barGap);
          const barHeight = (d.visits / max) * plotHeight;
          const y = PADDING_TOP + plotHeight - barHeight;
          const isHovered = hovered === i;
          return (
            <g
              key={d.hour}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
            >
              <rect x={x} y={PADDING_TOP} width={barWidth} height={plotHeight} fill="transparent" />
              <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 1)} rx={3} fill={isHovered ? BAR_HOVER_COLOR : BAR_COLOR} />
              {d.hour % 3 === 0 && (
                <text x={x + barWidth / 2} y={HEIGHT - 6} textAnchor="middle" fontSize="9" fill={AXIS_TEXT_COLOR}>
                  {String(d.hour).padStart(2, "0")}h
                </text>
              )}
              {isHovered && (
                <g>
                  <rect x={x + barWidth / 2 - 22} y={Math.max(y - 24, 0)} width={44} height={18} rx={4} fill="#1C1B1F" />
                  <text x={x + barWidth / 2} y={Math.max(y - 24, 0) + 12} textAnchor="middle" fontSize="10" fontWeight={600} fill="#FFFFFF">
                    {d.visits}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
