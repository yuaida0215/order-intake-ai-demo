import { safeNext } from "@/lib/auth";

export const metadata = { title: "ログイン｜受注取り込みAI Agent デモ" };

// 共有パスワードのログイン画面（サーバーコンポーネント・素のフォーム）。
export default function LoginPage({ searchParams }: { searchParams: { e?: string; next?: string } }) {
  const next = safeNext(searchParams.next);
  const action = "/api/auth/login" + (next !== "/" ? "?next=" + encodeURIComponent(next) : "");
  const err =
    searchParams.e === "config"
      ? "サーバー設定が未完了です。管理者に連絡してください。"
      : searchParams.e
        ? "パスワードが違います。"
        : null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-night px-4">
      {/* 背景のグラデーションオーブ */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-indigo-600/25 blur-3xl" aria-hidden />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="ai-gradient flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white shadow-glow animate-glow-pulse">
            🤖
          </div>
          <div>
            <div className="text-lg font-bold text-white">受注取り込みAI Agent</div>
            <div className="text-xs text-brand-300/70">Order Intake Agent — 営業デモ</div>
          </div>
        </div>

        <form className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl" method="post" action={action}>
          <h1 className="text-base font-semibold text-white">ログイン</h1>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            このデモは関係者限定です。共有パスワードを入力してください。
          </p>

          {err ? (
            <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-xs text-red-200">{err}</div>
          ) : null}

          <div className="mt-4">
            <label htmlFor="password" className="text-[11px] font-medium text-white/50">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoFocus
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <button
            type="submit"
            className="ai-gradient mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-glow transition-all hover:brightness-110"
          >
            ログイン
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-white/30">
          OCR・メール送信・基幹連携はすべてモックのデモ環境です
        </p>
      </div>
    </div>
  );
}
