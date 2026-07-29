"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import { Icon, type IconName } from "@/components/icons";

const NAV: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: "/orders", label: "受注一覧", icon: "inbox", match: (p) => p === "/orders" || p.startsWith("/orders/") },
  { href: "/alerts", label: "受注アラート", icon: "bell", match: (p) => p.startsWith("/alerts") },
  { href: "/approvals", label: "上長確認待ち", icon: "userCheck", match: (p) => p.startsWith("/approvals") },
  { href: "/tasks", label: "対応状況一覧", icon: "checkCircle", match: (p) => p.startsWith("/tasks") },
  { href: "/dashboard", label: "月次ダッシュボード", icon: "barChart", match: (p) => p.startsWith("/dashboard") },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const resetDemo = useOrderStore((s) => s.resetDemo);
  const pendingAlerts = useOrderStore((s) => s.alerts.filter((a) => a.status === "pending").length);
  const waitingApprovals = useOrderStore((s) => s.orders.filter((o) => o.approval?.status === "waiting").length);
  const badgeFor = (href: string): number => {
    if (href === "/alerts") return pendingAlerts;
    if (href === "/approvals") return waitingApprovals;
    return 0;
  };

  return (
    <aside className="fixed inset-y-0 left-0 flex w-[232px] flex-col border-r border-line bg-night-soft">
      {/* ロゴ + サービス名 */}
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <span className="ai-gradient flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-white shadow-glow-sm" aria-hidden>
          <Icon name="sparkles" className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[15px] font-semibold tracking-tight text-ink">受注取り込みAI</div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] font-medium text-emerald-300/90">AI Agent 稼働中</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 pt-1">
        {NAV.map((item) => {
          const active = item.match(pathname);
          const badge = badgeFor(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                active
                  ? "bg-white/[0.06] font-medium text-ink"
                  : "font-medium text-ink-muted hover:bg-white/[0.04] hover:text-ink-soft"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500" aria-hidden />
              )}
              <Icon
                name={item.icon}
                className={`h-[18px] w-[18px] flex-none ${active ? "text-brand-300" : "text-ink-muted group-hover:text-ink-soft"}`}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {badge > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500/90 px-1.5 text-[11px] font-bold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-line p-3">
        <div className="mb-1 flex items-center gap-1.5 px-1 text-[11px] font-medium text-ink-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400/70" aria-hidden />
          営業デモモード（モック環境）
        </div>
        <button
          onClick={() => {
            resetDemo();
            router.push("/orders");
          }}
          className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium text-ink-muted transition-colors hover:bg-white/[0.04] hover:text-ink-soft"
        >
          <Icon name="refresh" className="h-[15px] w-[15px]" /> デモをリセット
        </button>
        <form method="post" action="/api/auth/logout">
          <button
            type="submit"
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium text-ink-muted transition-colors hover:bg-white/[0.04] hover:text-ink-soft"
          >
            <Icon name="logout" className="h-[15px] w-[15px]" /> ログアウト
          </button>
        </form>
      </div>
    </aside>
  );
}
