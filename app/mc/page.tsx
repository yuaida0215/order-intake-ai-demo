"use client";

import Link from "next/link";
import { INITIAL_DEPOSITS, INTAKE_DOCS, LOT_FLOW, factoryById } from "@/lib/mc/data";
import { ROLES, inScope, useMc } from "@/lib/mc/store";
import { num } from "@/lib/mc/calc";
import { Chip, H3Badge, PageHead, Panel } from "@/components/mc/ui";

const FLOW_HREF: Record<string, string> = {
  ticketed: "/mc/completion",
  processing: "/mc/completion",
  completed: "/mc/shipping",
  delivered: "/mc/matching",
  sold: "/mc/billing",
  billed: "/mc/payments",
  paid: "/mc/payments",
};

export default function McHome() {
  const s = useMc();
  const role = ROLES.find((r) => r.id === s.role)!;
  const lots = inScope(s.lots, s.scope);
  const docs = inScope(INTAKE_DOCS, s.scope).filter((d) => !s.docsDone[d.id]);
  const h3Lots = lots.filter((l) => l.h3 && (l.status === "ticketed" || l.status === "processing"));
  const diffLots = lots.filter((l) => l.status === "delivered" && (l.defectQty ?? 0) > 0);
  const openDeposits = INITIAL_DEPOSITS.filter((d) => !s.deposits[d.id]);
  const scopeLabel = s.scope === "ALL" ? "全拠点" : factoryById(s.scope).name;

  const todo = [
    { show: docs.length > 0, n: docs.length, label: "取込待ちの注文書", sub: "紙・FAX・EDIをAIが読み取り済み。確認して受入実行", href: docs.length === 1 ? `/mc/intake/${docs[0].id}` : "/mc/intake", tone: "blue" },
    { show: h3Lots.length > 0, n: h3Lots.length, label: "3Hで条件確認が必要なロット", sub: "初めて・久しぶり・変更。作業前に処理条件を確認", href: "/mc/orders?h3=1", tone: "amber" },
    { show: true, n: lots.filter((l) => l.status === "ticketed" || l.status === "processing").length, label: "完成入力待ち", sub: "戻った作業票のバーコードを読んで完成数量を入力", href: "/mc/completion", tone: "gray" },
    { show: true, n: lots.filter((l) => l.status === "completed").length, label: "納品書の発行待ち", sub: "完成済み。得意先ごとにまとめて納品書", href: "/mc/shipping", tone: "gray" },
    { show: diffLots.length > 0, n: diffLots.length, label: "照合で差異あり", sub: "注文数量と完成数量が違う（不良など）", href: "/mc/matching", tone: "red" },
    { show: !s.closedGroups.includes("G1") && s.role !== "jimu" && s.role !== "seizo", n: 1, label: "月末締め（11月度）の請求", sub: "請求グループ「月末締め」の締め処理", href: "/mc/billing", tone: "gray" },
    { show: openDeposits.length > 0 && s.role !== "jimu" && s.role !== "seizo", n: openDeposits.length, label: "未消込の入金（11/30着金）", sub: "AIが消込候補と差額の理由を提示済み", href: "/mc/payments", tone: "gray" },
  ].filter((t) => t.show);

  return (
    <div>
      <PageHead
        kicker={`${role.label}｜${scopeLabel}`}
        title="今日の仕事"
        sub="注文書が届いてから入金されるまでを、1つのシステムで最後までつなげています。番号や件数をタップすると、その画面に移ります。"
      />

      {/* 一気通貫フロー */}
      <Panel title="受注から入金まで（ロットの流れ）" sub="1ロット＝1枚の作業票。同じ番号のまま最後までつながる" className="mb-5">
        <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
          <FlowCard href="/mc/intake" step="0" label="注文書の取込" sub="AI読み取り" n={docs.length} unit="通" accent />
          {LOT_FLOW.map((f, i) => (
            <FlowCard key={f.key} href={FLOW_HREF[f.key]} step={String(i + 1)} label={f.label} n={lots.filter((l) => l.status === f.key).length} unit="件" />
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="やること" sub={`${role.desc}向けに絞り込み`}>
          <ul className="divide-y divide-line-subtle">
            {todo.map((t) => (
              <li key={t.label}>
                <Link href={t.href} className="flex items-center gap-3 py-3 hover:bg-surface-sunken/60">
                  <span
                    className={`flex h-10 w-12 flex-none items-center justify-center rounded-lg text-[18px] font-bold tabular-nums ${
                      t.tone === "blue" ? "bg-brand-50 text-brand-600" : t.tone === "amber" ? "bg-amber-50 text-amber-700" : t.tone === "red" ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-ink-soft"
                    }`}
                  >
                    {t.n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-ink">{t.label}</span>
                    <span className="block text-[12px] text-ink-muted">{t.sub}</span>
                  </span>
                  <span className="text-ink-faint">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel title="3H（初めて・久しぶり・変更）" sub="過去の受注履歴を自動で引いて判定">
            {h3Lots.length === 0 ? (
              <p className="text-[12.5px] text-ink-muted">いま確認待ちのロットはありません。注文書を取り込むと、ここに出ます。</p>
            ) : (
              <ul className="space-y-2">
                {h3Lots.slice(0, 5).map((l) => (
                  <li key={l.id}>
                    <Link href={`/mc/lots/${l.id}`} className="flex items-center gap-2 text-[12.5px] hover:underline">
                      <H3Badge h3={l.h3} />
                      <span className="font-mono">{l.partNo}</span>
                      <span className="truncate text-ink-muted">{l.ticketNo}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="商談デモの順番（約5分）" sub="上から順にタップ">
            <ol className="space-y-1.5 text-[12.5px]">
              {[
                ["注文書の取込", "/mc/intake/D-1201-01", "手書きの訂正・3Hを見せる"],
                ["受注入力（4項目だけ）", "/mc/orders/new", "先方の画面と同じ数字"],
                ["完成入力", "/mc/completion", "手書きの完成数量をAIで"],
                ["納品書→照合", "/mc/shipping", "照合は差異だけ人が見る"],
                ["請求（5グループ）→入金消込", "/mc/billing", "検収差額の理由まで"],
                ["1ロットの一生", "/mc/lots/KN-2611-3330", "全部つながっている"],
                ["RFI対応表", "/mc/rfi", "要件ごとに画面で回答"],
              ].map(([label, href, note], i) => (
                <li key={href}>
                  <Link href={href} className="flex items-baseline gap-2 rounded-md px-1 py-1 hover:bg-surface-sunken">
                    <span className="w-4 flex-none text-right font-bold text-brand-500">{i + 1}</span>
                    <span className="font-semibold text-ink">{label}</span>
                    <span className="truncate text-[11.5px] text-ink-muted">{note}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Mini label="1工場1日あたりの入力" value="約400回" sub="受入と完成数量（約200ロット）【一次】" />
        <Mini label="毎回変わる項目" value="4つ" sub="数量・箱数・ロットNo・納期【二次】" />
        <Mini label="3H判定に使う受注履歴" value={`${num(1502981)}件`} sub="今の基幹の登録件数【録画】" />
      </div>
    </div>
  );
}

function FlowCard({ href, step, label, sub, n, unit, accent }: { href: string; step: string; label: string; sub?: string; n: number; unit: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className={`relative flex w-[132px] flex-none snap-start flex-col rounded-lg border px-3 py-2.5 transition hover:-translate-y-px hover:shadow-card ${
        accent ? "border-accent-400/60 bg-accent-soft" : "border-line bg-white"
      }`}
    >
      <span className="text-[10.5px] font-bold text-brand-500">STEP {step}</span>
      <span className="mt-0.5 line-clamp-2 min-h-[34px] text-[12px] font-semibold leading-tight text-ink">{label}</span>
      {sub && <Chip tone="cyan" className="mt-1 w-fit">{sub}</Chip>}
      <span className="mt-1 text-[20px] font-bold tabular-nums text-ink">
        {n}
        <span className="ml-0.5 text-[11px] font-medium text-ink-muted">{unit}</span>
      </span>
    </Link>
  );
}

function Mini({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-white/60 px-4 py-3">
      <div className="text-[11.5px] text-ink-muted">{label}</div>
      <div className="text-[18px] font-bold text-ink">{value}</div>
      <div className="text-[11px] text-ink-muted">{sub}</div>
    </div>
  );
}
