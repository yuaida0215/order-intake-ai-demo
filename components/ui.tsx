import Link from "next/link";
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-surface-border bg-surface shadow-card ${padded ? "p-6" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  sub,
  right,
}: {
  children: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">{children}</h2>
        {sub ? <p className="mt-1 text-[13px] text-ink-muted">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

// ------------------------------------------------------------
// Button — gradient は "ai" バリアントに限定 (最重要AIアクションのみ)
// ------------------------------------------------------------
type ButtonVariant = "ai" | "primary" | "success" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  // 最重要AIアクション限定: パープル→ピンクのグラデ + 控えめグロー
  ai: "ai-gradient text-white border-transparent shadow-glow-sm hover:brightness-110",
  // 通常の主要アクション: 単色パープル (グラデなし)
  primary: "bg-brand-600 text-white border-transparent hover:bg-brand-500",
  // 承認・完了
  success: "bg-emerald-600 text-white border-transparent hover:bg-emerald-500",
  // 補助
  secondary: "bg-surface-input text-ink-soft border-line hover:bg-surface-elevated hover:text-ink",
  // テキストボタン
  ghost: "bg-transparent text-ink-soft border-transparent hover:bg-white/[0.05] hover:text-ink",
  // 破壊的・差し戻し
  danger: "bg-transparent text-rose-300 border-rose-500/40 hover:bg-rose-500/10",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 px-3.5 text-[13px]",
  md: "h-11 gap-2 px-5 text-sm",
  lg: "h-12 gap-2 px-6 text-[15px]",
};

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
};

const BTN_BASE =
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg border font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40";

export function Button({
  children,
  variant = "secondary",
  size = "md",
  className = "",
  disabled,
  onClick,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${BTN_BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  href,
  variant = "secondary",
  size = "md",
  className = "",
}: {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return (
    <Link href={href} className={`${BTN_BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`}>
      {children}
    </Link>
  );
}

// ------------------------------------------------------------
// PageHeader — 全画面共通のページヘッダー
// ------------------------------------------------------------
export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "戻る",
  meta,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  backHref?: string;
  backLabel?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-1.5 inline-flex items-center gap-1 text-[13px] text-ink-muted transition-colors hover:text-ink"
          >
            <span aria-hidden>←</span> {backLabel}
          </Link>
        ) : null}
        <h1 className="text-[27px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-ink-muted">{description}</p>
        ) : null}
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center justify-end gap-2.5">{actions}</div> : null}
    </div>
  );
}

/** ラベル + 値の行 (詳細表示用) */
export function Field({
  label,
  children,
  missing,
}: {
  label: string;
  children: ReactNode;
  missing?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <span className={`text-sm ${missing ? "text-rose-400" : "text-ink"}`}>{children}</span>
    </div>
  );
}

/** 空値プレースホルダ */
export function Empty() {
  return <span className="text-ink-faint">—</span>;
}

/** 空状態 (EmptyState) */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line px-6 py-14 text-center">
      {icon ? <div className="text-ink-faint">{icon}</div> : null}
      <div className="text-[15px] font-medium text-ink-soft">{title}</div>
      {description ? <p className="max-w-sm text-sm text-ink-muted">{description}</p> : null}
      {action}
    </div>
  );
}
