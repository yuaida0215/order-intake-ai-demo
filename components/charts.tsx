import type { ReactNode } from "react";

// パレット (トークンと同一のHEX)
export const CHART = {
  brand: "#a855f7",
  accent: "#ec4899",
  info: "#38bdf8",
  emerald: "#10b981",
  amber: "#f59e0b",
  orange: "#fb923c",
  teal: "#2dd4bf",
  grid: "#242731",
  axis: "#606673",
};

type Point = { label: string; value: number };

// ------------------------------------------------------------
// LineChart (エリア付き折れ線) — 推移・トレンド用
// ------------------------------------------------------------
export function LineChart({
  data,
  color = CHART.brand,
  height = 200,
  format = (v) => v.toLocaleString(),
}: {
  data: Point[];
  color?: string;
  height?: number;
  format?: (v: number) => string;
}) {
  const W = 640;
  const H = height;
  const padL = 8;
  const padR = 8;
  const padT = 16;
  const padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pad = range * 0.15;
  const lo = min - pad;
  const hi = max + pad;

  const x = (i: number) => padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - ((v - lo) / (hi - lo)) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const last = data[data.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="none" role="img" aria-label="推移グラフ">
      {gridLines.map((g) => {
        const gy = padT + innerH * g;
        return <line key={g} x1={padL} x2={W - padR} y1={gy} y2={gy} stroke={CHART.grid} strokeWidth={1} />;
      })}
      <path d={areaPath} fill={color} opacity={0.12} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.value)} r={i === data.length - 1 ? 4 : 0} fill={color} />
      ))}
      {/* 末尾の値 */}
      <text x={x(data.length - 1)} y={y(last.value) - 10} textAnchor="end" fontSize="13" fontWeight="700" fill={color}>
        {format(last.value)}
      </text>
      {/* x 軸ラベル (間引き) */}
      {data.map((d, i) =>
        i % 2 === 0 || i === data.length - 1 ? (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill={CHART.axis}>
            {d.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

// ------------------------------------------------------------
// VBarChart (縦棒) — 件数など離散量の推移用
// ------------------------------------------------------------
export function VBarChart({
  data,
  color = CHART.info,
  height = 200,
  format = (v) => v.toLocaleString(),
}: {
  data: Point[];
  color?: string;
  height?: number;
  format?: (v: number) => string;
}) {
  const W = 640;
  const H = height;
  const padT = 20;
  const padB = 26;
  const innerH = H - padT - padB;
  const max = Math.max(...data.map((d) => d.value)) || 1;
  const n = data.length;
  const slot = W / n;
  const bw = Math.min(34, slot * 0.6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="none" role="img" aria-label="件数グラフ">
      <line x1={0} x2={W} y1={padT + innerH} y2={padT + innerH} stroke={CHART.grid} strokeWidth={1} />
      {data.map((d, i) => {
        const h = (d.value / max) * innerH;
        const cx = i * slot + slot / 2;
        const isLast = i === n - 1;
        return (
          <g key={i}>
            <rect
              x={cx - bw / 2}
              y={padT + innerH - h}
              width={bw}
              height={h}
              rx={3}
              fill={color}
              opacity={isLast ? 1 : 0.55}
            />
            {(i % 2 === 0 || isLast) && (
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill={CHART.axis}>
                {d.label}
              </text>
            )}
            {isLast && (
              <text x={cx} y={padT + innerH - h - 7} textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
                {format(d.value)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ------------------------------------------------------------
// DonutChart (ドーナツ) — 構成比用
// ------------------------------------------------------------
type Slice = { label: string; value: number; color: string };

export function DonutChart({
  data,
  size = 168,
  centerLabel,
  centerValue,
}: {
  data: Slice[];
  size?: number;
  centerLabel?: string;
  centerValue?: ReactNode;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2;
  const stroke = 22;
  const radius = r - stroke / 2;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-none" role="img" aria-label="構成比グラフ">
        <g transform={`rotate(-90 ${r} ${r})`}>
          <circle cx={r} cy={r} r={radius} fill="none" stroke={CHART.grid} strokeWidth={stroke} />
          {data.map((d, i) => {
            const frac = d.value / total;
            const len = frac * circ;
            const el = (
              <circle
                key={i}
                cx={r}
                cy={r}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </g>
        {centerValue !== undefined && (
          <>
            <text x={r} y={r - 2} textAnchor="middle" fontSize="22" fontWeight="700" fill="#F7F8FA">
              {centerValue as string}
            </text>
            {centerLabel && (
              <text x={r} y={r + 16} textAnchor="middle" fontSize="11" fill={CHART.axis}>
                {centerLabel}
              </text>
            )}
          </>
        )}
      </svg>
      <ul className="flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm">
            <span className="h-2.5 w-2.5 flex-none rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="flex-1 text-ink-soft">{d.label}</span>
            <span className="tabular-nums text-ink-muted">{d.value}件</span>
            <span className="w-12 text-right tabular-nums font-medium text-ink">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------
// HBarChart (横棒) — 順位・ランキング用
// ------------------------------------------------------------
export function HBarChart({
  data,
  format = (v) => v.toLocaleString(),
  emptyLabel = "データがありません",
}: {
  data: { label: string; value: number; color?: string }[];
  format?: (v: number) => string;
  emptyLabel?: string;
}) {
  if (data.length === 0) return <p className="py-6 text-center text-sm text-ink-faint">{emptyLabel}</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-[13px] text-ink-soft" title={d.label}>
            {d.label}
          </span>
          <div className="flex flex-1 items-center gap-2">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(3, (d.value / max) * 100)}%`, backgroundColor: d.color ?? CHART.brand }}
              />
            </div>
            <span className="w-24 shrink-0 text-right text-[13px] font-semibold tabular-nums text-ink">
              {format(d.value)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
