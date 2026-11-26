"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { LOT_FLOW, type H3, type LotStatus } from "@/lib/mc/data";
import { barcodeBars } from "@/lib/mc/calc";

// ------------------------------------------------------------
// 共通パーツ（基幹システムらしい、詰まっていて読みやすい見た目）
// ------------------------------------------------------------

export function PageHead({ title, sub, right, kicker }: { title: string; sub?: ReactNode; right?: ReactNode; kicker?: string }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {kicker && <div className="mb-1 text-[11px] font-semibold tracking-[0.12em] text-brand-500">{kicker}</div>}
        <h1 className="text-[22px] font-bold tracking-tightish text-ink sm:text-[24px]">{title}</h1>
        {sub && <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{sub}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export function Panel({ title, right, children, className = "", pad = true, sub }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; pad?: boolean; sub?: ReactNode }) {
  return (
    <section className={`rounded-xl border border-line bg-white shadow-[0_1px_2px_rgba(16,42,70,0.06)] ${className}`}>
      {(title || right) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line-subtle px-4 py-3">
          <div>
            <h2 className="text-[14px] font-bold text-ink">{title}</h2>
            {sub && <p className="mt-0.5 text-[12px] text-ink-muted">{sub}</p>}
          </div>
          {right}
        </header>
      )}
      <div className={pad ? "p-4" : ""}>{children}</div>
    </section>
  );
}

export type Tone = "gray" | "blue" | "green" | "amber" | "red" | "cyan" | "violet" | "navy";
const TONE: Record<Tone, string> = {
  gray: "bg-slate-100 text-slate-600 border-slate-200",
  blue: "bg-brand-50 text-brand-700 border-brand-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-rose-50 text-rose-700 border-rose-200",
  cyan: "bg-accent-soft text-accent-600 border-accent-300/60",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  navy: "bg-navy text-white border-navy",
};
export function Chip({ tone = "gray", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${TONE[tone]} ${className}`}>{children}</span>;
}

export function H3Badge({ h3, large }: { h3?: H3; large?: boolean }) {
  if (!h3) return <span className="text-[11px] text-ink-faint">—</span>;
  const tone: Tone = h3 === "初めて" ? "red" : h3 === "久しぶり" ? "amber" : "violet";
  return (
    <Chip tone={tone} className={large ? "px-2 py-1 text-[12px]" : ""}>
      {h3 === "初めて" ? "初" : h3 === "久しぶり" ? "久" : "変"}｜{h3}
    </Chip>
  );
}

const STATUS_TONE: Record<LotStatus, Tone> = {
  ticketed: "blue",
  processing: "cyan",
  completed: "violet",
  delivered: "amber",
  sold: "green",
  billed: "navy",
  paid: "gray",
};
export function StatusChip({ status }: { status: LotStatus }) {
  const f = LOT_FLOW.find((x) => x.key === status)!;
  return <Chip tone={STATUS_TONE[status]}>{f.short}</Chip>;
}

/** 7段階のどこにいるかを示す小さなバー */
export function FlowMini({ status }: { status: LotStatus }) {
  const idx = LOT_FLOW.findIndex((x) => x.key === status);
  return (
    <div className="flex items-center gap-[3px]" title={LOT_FLOW[idx].label}>
      {LOT_FLOW.map((s, i) => (
        <span key={s.key} className={`h-1.5 w-3 rounded-full ${i <= idx ? (i === idx ? "bg-brand-500" : "bg-brand-300") : "bg-slate-200"}`} />
      ))}
    </div>
  );
}

export function Stat({ label, value, sub, tone = "ink", href }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "ink" | "blue" | "amber" | "red" | "green"; href?: string }) {
  const color = { ink: "text-ink", blue: "text-brand-600", amber: "text-amber-600", red: "text-rose-600", green: "text-emerald-600" }[tone];
  const body = (
    <div className="h-full rounded-xl border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,42,70,0.06)] transition hover:border-brand-300">
      <div className="text-[11.5px] font-medium text-ink-muted">{label}</div>
      <div className={`mt-1 text-[22px] font-bold tabular-nums tracking-tightish ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11.5px] text-ink-muted">{sub}</div>}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

type BtnVariant = "primary" | "ai" | "secondary" | "ghost" | "success" | "danger";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-brand-600 text-white border-transparent hover:bg-brand-500",
  ai: "ai-gradient text-white border-transparent shadow-glow-sm hover:shadow-glow",
  secondary: "bg-white text-ink-soft border-line hover:border-line-strong hover:bg-surface-sunken",
  ghost: "bg-transparent text-ink-soft border-transparent hover:bg-surface-sunken",
  success: "bg-emerald-600 text-white border-transparent hover:bg-emerald-500",
  danger: "bg-white text-rose-600 border-rose-300 hover:bg-rose-50",
};
export function Btn({
  children, onClick, href, variant = "secondary", size = "md", disabled, className = "", type = "button",
}: {
  children: ReactNode; onClick?: () => void; href?: string; variant?: BtnVariant; size?: "sm" | "md"; disabled?: boolean; className?: string; type?: "button" | "submit";
}) {
  const cls = `inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
    size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-10 px-4 text-[13.5px]"
  } ${BTN[variant]} ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type={type} onClick={onClick} disabled={disabled} className={cls}>{children}</button>;
}

/** 表：スマホでは横スクロール */
export function TableWrap({ children, className = "", minW = 640 }: { children: ReactNode; className?: string; minW?: number }) {
  return (
    <div className={`-mx-4 overflow-x-auto px-4 ${className}`}>
      <table className="mc-table w-full border-collapse text-[12.5px]" style={{ minWidth: minW }}>{children}</table>
    </div>
  );
}

/** 「今 → 新基幹」の対比（商談で一番伝えたいところ） */
export function BeforeAfter({ before, after, title = "ここが変わる" }: { before: ReactNode; after: ReactNode; title?: string }) {
  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-brand-200 bg-white">
      <div className="flex items-center gap-2 border-b border-brand-100 bg-brand-50 px-4 py-2 text-[12px] font-bold text-brand-700">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
        {title}
      </div>
      <div className="grid gap-0 sm:grid-cols-2">
        <div className="border-b border-line-subtle p-4 sm:border-b-0 sm:border-r">
          <div className="mb-1 text-[11px] font-bold text-ink-muted">今</div>
          <div className="text-[13px] leading-relaxed text-ink-soft">{before}</div>
        </div>
        <div className="p-4">
          <div className="mb-1 text-[11px] font-bold text-brand-600">新基幹</div>
          <div className="text-[13px] font-medium leading-relaxed text-ink">{after}</div>
        </div>
      </div>
    </div>
  );
}

export function Barcode({ value, height = 34 }: { value: string; height?: number }) {
  const bars = barcodeBars(value);
  let x = 0;
  const rects = bars.map((w, i) => {
    const r = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={height} fill="#111" /> : null;
    x += w;
    return r;
  });
  return (
    <div className="inline-flex flex-col items-center">
      <svg width={x} height={height} viewBox={`0 0 ${x} ${height}`} aria-label={`バーコード ${value}`}>
        {rects}
      </svg>
      <span className="mt-0.5 font-mono text-[10px] tracking-widest text-slate-700">{value}</span>
    </div>
  );
}

export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-navy-darker/50 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-pop sm:rounded-2xl ${wide ? "sm:max-w-4xl" : "sm:max-w-2xl"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-4 py-3">
          <div className="text-[14px] font-bold text-ink">{title}</div>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-[13px] text-ink-muted hover:bg-surface-sunken">閉じる ✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Kv({ k, v, mono, from }: { k: string; v: ReactNode; mono?: boolean; from?: "master" | "input" | "ai" | "calc" }) {
  const tag = from === "master" ? "マスタ" : from === "ai" ? "AI" : from === "calc" ? "計算" : from === "input" ? "入力" : null;
  const tagCls =
    from === "master" ? "bg-slate-100 text-slate-500" : from === "ai" ? "bg-accent-soft text-accent-600" : from === "calc" ? "bg-violet-50 text-violet-600" : "bg-amber-50 text-amber-700";
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-line-subtle py-1.5 last:border-0">
      <span className="flex items-center gap-1.5 text-[12px] text-ink-muted">
        {k}
        {tag && <span className={`rounded px-1 text-[9.5px] font-bold ${tagCls}`}>{tag}</span>}
      </span>
      <span className={`text-right text-[13px] font-semibold text-ink ${mono ? "font-mono tabular-nums" : ""}`}>{v}</span>
    </div>
  );
}

export function Toast({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-5 z-[70] flex justify-center px-4">
      <div className="animate-fade-in rounded-xl bg-navy px-4 py-3 text-[13px] font-semibold text-white shadow-navy">{children}</div>
    </div>
  );
}
