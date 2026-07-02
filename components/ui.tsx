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
    <div className={`rounded-2xl border border-surface-border bg-white shadow-card ${padded ? "p-5" : ""} ${className}`}>
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
    <div className="mb-3 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-ink">{children}</h2>
        {sub ? <p className="mt-0.5 text-xs text-ink-muted">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md";

const VARIANT: Record<ButtonVariant, string> = {
  // AIアクション: 紫グラデーション + グロー
  primary: "ai-gradient text-white border-transparent shadow-glow-sm hover:shadow-glow hover:brightness-110",
  secondary: "bg-white text-ink-soft hover:bg-brand-50/60 border-surface-border",
  ghost: "bg-transparent text-ink-soft hover:bg-brand-50/60 border-transparent",
  danger: "bg-red-600 text-white hover:bg-red-700 border-transparent shadow-sm",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent shadow-sm",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
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
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition-all ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    >
      {children}
    </Link>
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
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-ink-muted">{label}</span>
      <span className={`text-sm ${missing ? "text-red-500" : "text-ink"}`}>{children}</span>
    </div>
  );
}

/** 空値プレースホルダ */
export function Empty() {
  return <span className="text-ink-faint">—</span>;
}
