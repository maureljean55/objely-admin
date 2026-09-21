"use client";

import { useRef, useState, type PointerEvent } from "react";

const WIDTH = 720;
const HEIGHT = 220;
const PADDING_LEFT = 34;
const PADDING_BOTTOM = 22;
const PADDING_TOP = 12;
const GRID_COLOR = "#E2E8F0";
const AXIS_TEXT_COLOR = "#64748B";
const LINE_COLOR = "#087BEA";

function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function DailyChart({ data }: { data: { day: string; visits: number }[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotWidth = WIDTH - PADDING_LEFT - 8;
  const plotHeight = HEIGHT - PADDING_BOTTOM - PADDING_TOP;
  const max = Math.max(1, ...data.map((d) => d.visits));

  if (data.length === 0) {
    return <p className="text-body-sm text-on-surface-variant text-center py-10">Aucune donnée sur cette période.</p>;
  }

  const points = data.map((d, i) => ({
    ...d,
    x: PADDING_LEFT + (data.length === 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth),
    y: PADDING_TOP + plotHeight - (d.visits / max) * plotHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const baseline = PADDING_TOP + plotHeight;
  const areaPath = `${linePath} L${points[points.length - 1].x},${baseline} L${points[0].x},${baseline} Z`;

  const yTicks = [0, Math.ceil(max / 2), max];
  const labelStep = Math.max(1, Math.ceil(points.length / 8));

  function handlePointerMove(e: PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const localX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - localX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        style={{ minWidth: 480 }}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
        role="img"
        aria-label="Visites par jour"
      >
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

        <path d={areaPath} fill={LINE_COLOR} fillOpacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={LINE_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) =>
          i % labelStep === 0 || i === points.length - 1 ? (
            <text key={p.day} x={p.x} y={HEIGHT - 6} textAnchor="middle" fontSize="9" fill={AXIS_TEXT_COLOR}>
              {formatDay(p.day)}
            </text>
          ) : null,
        )}

        {hovered && (
          <>
            <line x1={hovered.x} x2={hovered.x} y1={PADDING_TOP} y2={baseline} stroke="#CBD5E1" strokeWidth={1} />
            <circle cx={hovered.x} cy={hovered.y} r={4} fill={LINE_COLOR} stroke="#FFFFFF" strokeWidth={2} />
          </>
        )}
      </svg>

      {hovered && (
        <div
          className="absolute pointer-events-none bg-on-surface text-white text-label-sm rounded-lg px-2.5 py-1.5 shadow-elevated -translate-x-1/2"
          style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%`, marginTop: -46 }}
        >
          <div className="font-semibold">
            {hovered.visits} visite{hovered.visits === 1 ? "" : "s"}
          </div>
          <div className="opacity-80">{formatDay(hovered.day)}</div>
        </div>
      )}
    </div>
  );
}
