"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import { AgentAvatar } from "@/components/badges";

const NAV = [
  { href: "/orders", label: "受注一覧", icon: "📥", match: (p: string) => p === "/orders" || p.startsWith("/orders/") },
  { href: "/dashboard", label: "月次ダッシュボード", icon: "📊", match: (p: string) => p.startsWith("/dashboard") },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const resetDemo = useOrderStore((s) => s.resetDemo);

  return (
    <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-white/5 bg-night">
      {/* ロゴ + エージェント */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <AgentAvatar size="h-10 w-10" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">受注取り込みAI</div>
            <div className="text-[11px] text-brand-300/70">Order Intake Agent</div>
          </div>
        </div>
        {/* エージェント稼働ステータス */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[11px] font-medium text-emerald-300/90">AI Agent 稼働中</span>
          <span className="ml-auto text-[10px] text-white/30">24h</span>
        </div>
      </div>

      <nav className="mt-1 flex-1 px-3">
        {NAV.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-500/15 text-brand-100 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.25)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-3">
        <div className="mb-2 rounded-xl bg-amber-400/10 px-3 py-2 text-[11px] leading-snug text-amber-200/80">
          営業デモモード — OCR・メール送信・基幹連携はすべてモックです
        </div>
        <button
          onClick={() => {
            resetDemo();
            router.push("/orders");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white/90"
        >
          ↺ デモをリセット
        </button>
        <form method="post" action="/api/auth/logout" className="mt-2">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-white/35 transition-colors hover:bg-white/5 hover:text-white/70"
          >
            ログアウト
          </button>
        </form>
      </div>
    </aside>
  );
}
