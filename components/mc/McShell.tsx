"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { DEMO_NOW_LABEL, FACTORIES, INTAKE_DOCS, type FactoryId } from "@/lib/mc/data";
import { ROLES, canSee, inScope, useMc, type RoleId } from "@/lib/mc/store";

type NavItem = { href: string; label: string; badge?: () => number };
type NavGroup = { title: string; items: NavItem[] };

function useNav(): NavGroup[] {
  const lots = useMc((s) => s.lots);
  const scope = useMc((s) => s.scope);
  const docsDone = useMc((s) => s.docsDone);
  const newItems = useMc((s) => s.newItems);
  const fa = useMc((s) => s.fa);
  const scoped = inScope(lots, scope);
  const count = (st: string[]) => scoped.filter((l) => st.includes(l.status)).length;
  return [
    { title: "", items: [{ href: "/mc", label: "ホーム（今日の仕事）" }] },
    {
      title: "受託加工（受注→出荷）",
      items: [
        { href: "/mc/intake", label: "注文書の取込（AI読み取り）", badge: () => inScope(INTAKE_DOCS, scope).filter((d) => !docsDone[d.id]).length },
        { href: "/mc/orders", label: "受注・作業票" },
        { href: "/mc/completion", label: "完成入力", badge: () => count(["ticketed", "processing"]) },
        { href: "/mc/shipping", label: "納品書・出荷", badge: () => count(["completed"]) },
        { href: "/mc/matching", label: "照合", badge: () => count(["delivered"]) },
      ],
    },
    {
      title: "販売・入金",
      items: [
        { href: "/mc/billing", label: "売上・請求（5グループ）" },
        { href: "/mc/payments", label: "入金消込・検収差額" },
        { href: "/mc/goods", label: "薬液・設備の販売" },
      ],
    },
    {
      title: "購買・原価",
      items: [
        { href: "/mc/outsourcing", label: "外注加工" },
        { href: "/mc/materials", label: "材料仕入（処理液）" },
        { href: "/mc/cost", label: "原価管理" },
      ],
    },
    {
      title: "管理",
      items: [
        { href: "/mc/accounting", label: "会計連携（仕訳）" },
        { href: "/mc/intercompany", label: "2法人（関係会社）" },
        { href: "/mc/masters", label: "品番マスタ・FA連携", badge: () => newItems.filter((n) => n.step < 4).length + fa.filter((f) => f.status === "未配信").length },
        { href: "/mc/bi", label: "経営ダッシュボード" },
        { href: "/mc/api", label: "API・EDI連携" },
        { href: "/mc/settings", label: "拠点・権限・構成" },
      ],
    },
  ];
}

function isActive(pathname: string, href: string) {
  return href === "/mc" ? pathname === "/mc" : pathname === href || pathname.startsWith(href + "/");
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const role = useMc((s) => s.role);
  const groups = useNav();
  return (
    <nav className="flex h-full flex-col">
      <div className="px-4 pb-3 pt-4">
        <Link href="/mc" onClick={onNavigate} className="block">
          <div className="text-[10px] font-semibold tracking-[0.18em] text-accent-300">ＭＣシステムズ様向け</div>
          <div className="mt-0.5 text-[17px] font-bold tracking-tightish text-white">
            新基幹システム<span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-white/70">デモ</span>
          </div>
          <div className="mt-0.5 text-[11px] text-white/45">受託加工 × AI読み取り</div>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {groups.map((g) => {
          const items = g.items.filter((i) => canSee(role, i.href));
          if (!items.length) return null;
          return (
            <div key={g.title || "top"} className="mb-2">
              {g.title && <div className="px-3 pb-1 pt-3 text-[10.5px] font-semibold tracking-wider text-white/35">{g.title}</div>}
              {items.map((i) => {
                const active = isActive(pathname, i.href);
                const b = i.badge?.() ?? 0;
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    onClick={onNavigate}
                    className={`relative mb-0.5 flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] transition ${
                      active ? "bg-accent-400/[0.16] font-semibold text-white" : "text-white/65 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    {active && <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r bg-accent-400" />}
                    <span className="flex-1 truncate">{i.label}</span>
                    {b > 0 && <span className="rounded-full bg-accent-500 px-1.5 text-[10.5px] font-bold leading-[18px] text-white">{b}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
        <Link
          href="/mc/rfi"
          onClick={onNavigate}
          className={`mx-1 mt-3 block rounded-lg border px-3 py-2.5 text-[12.5px] transition ${
            isActive(pathname, "/mc/rfi") ? "border-accent-400/60 bg-accent-400/15 text-white" : "border-white/15 text-white/75 hover:bg-white/[0.07]"
          }`}
        >
          <div className="font-bold">RFI 対応表</div>
          <div className="text-[11px] text-white/50">要件ごとに該当画面へ</div>
        </Link>
      </div>
    </nav>
  );
}

function Controls({ compact }: { compact?: boolean }) {
  const role = useMc((s) => s.role);
  const scope = useMc((s) => s.scope);
  const setRole = useMc((s) => s.setRole);
  const setScope = useMc((s) => s.setScope);
  const reset = useMc((s) => s.reset);
  const r = ROLES.find((x) => x.id === role)!;
  const sel = "h-8 rounded-lg border border-line bg-white px-2 text-[12.5px] text-ink focus:border-brand-400 focus:outline-none";
  return (
    <div className={`flex ${compact ? "flex-col items-stretch gap-2" : "flex-wrap items-center gap-2"}`}>
      <label className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
        利用者
        <select className={sel} value={role} onChange={(e) => setRole(e.target.value as RoleId)}>
          {ROLES.map((x) => (
            <option key={x.id} value={x.id}>{x.label}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
        拠点
        <select className={sel} value={scope} disabled={r.factory !== "ALL"} onChange={(e) => setScope(e.target.value as FactoryId | "ALL")}>
          <option value="ALL">全拠点</option>
          {FACTORIES.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </label>
      <button
        onClick={() => {
          if (confirm("デモの状態を最初に戻しますか？")) reset();
        }}
        className="h-8 rounded-lg border border-line bg-white px-2.5 text-[12px] text-ink-muted hover:bg-surface-sunken"
      >
        デモを最初から
      </button>
    </div>
  );
}

export function McShell({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setHydrated(true), []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="mc-root min-h-screen bg-[#F3F6FA]">
      {/* PC: 固定サイドバー */}
      <aside className="sidebar-bg fixed inset-y-0 left-0 z-40 hidden w-[248px] lg:block">
        {hydrated && <Sidebar />}
      </aside>

      {/* スマホ: ドロワー */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-navy-darker/50" />
          <aside className="sidebar-bg absolute inset-y-0 left-0 w-[82%] max-w-[300px] shadow-navy" onClick={(e) => e.stopPropagation()}>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
          <div className="flex h-12 items-center gap-3 px-3 sm:px-5">
            <button onClick={() => setOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line lg:hidden" aria-label="メニュー">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="min-w-0 flex-1 lg:hidden">
              <div className="truncate text-[13px] font-bold text-ink">新基幹システム（デモ）</div>
              <div className="text-[10.5px] text-ink-muted">{DEMO_NOW_LABEL}</div>
            </div>
            <div className="hidden flex-1 items-center gap-2 text-[12px] text-ink-muted lg:flex">
              <span className="rounded-md bg-surface-sunken px-2 py-1 font-semibold text-ink-soft">業務日 {DEMO_NOW_LABEL}</span>
              <span>社内サーバー（オンプレミス）・9拠点VPN接続 を想定した画面イメージ</span>
            </div>
            <div className="hidden lg:block">{hydrated && <Controls />}</div>
            <MobileControls hydrated={hydrated} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1280px] px-3 py-5 sm:px-5 lg:px-7">
          {hydrated ? children : <div className="py-24 text-center text-[13px] text-ink-muted">読み込み中…</div>}
          <footer className="mt-10 border-t border-line pb-6 pt-4 text-[11px] leading-relaxed text-ink-faint">
            デモ用の画面イメージです。工場名・画面項目・計算式は二次商談（11/19）で拝見した資料に合わせ、得意先・品番・金額は架空の値です。
          </footer>
        </main>
      </div>
    </div>
  );
}

function MobileControls({ hydrated }: { hydrated: boolean }) {
  const [open, setOpen] = useState(false);
  if (!hydrated) return null;
  return (
    <div className="relative lg:hidden">
      <button onClick={() => setOpen((v) => !v)} className="h-9 rounded-lg border border-line px-2.5 text-[12px] font-semibold text-ink-soft">
        利用者・拠点
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-[260px] rounded-xl border border-line bg-white p-3 shadow-pop">
          <Controls compact />
          <button onClick={() => setOpen(false)} className="mt-2 w-full text-[12px] text-ink-muted">閉じる</button>
        </div>
      )}
    </div>
  );
}
