"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";

type Msg = { role: "ai" | "user"; text: string };

const FAQ = [
  "山田製作所の受注、いま何が不足？",
  "本日のAI自動処理率は？",
  "未承認の案件は？",
  "尾崎太郎さんのFAX注文、確度は？",
];

/** デモ用の固定回答（既存サンプルデータに基づく） */
function answerFor(q: string): string {
  const s = q.toLowerCase();
  if (q.includes("山田") || q.includes("不足"))
    return "山田製作所さまはChatworkの会話から「正式に発注します」を検知した受注確定候補です（信頼度94%）。A-102（プレミアム健康ドリンク）を200ケース・7/15納品。ただし納品先住所が会話内に無いため、取り込み時に補完が必要です。";
  if (q.includes("自動処理率") || q.includes("率") || q.includes("処理率"))
    return "本日のAI自動処理率は 63%（読取8件中5件を自動登録）です。手作業換算で約2時間48分を削減しています。";
  if (q.includes("未承認") || q.includes("承認"))
    return "上長確認待ちは全社で6件（営業部2・購買部2・経理部2）です。最長経過は購買部の案件で2営業日、自動リマインドの対象になっています。";
  if (q.includes("尾崎") || q.includes("fax") || q.includes("手書き"))
    return "尾崎 太郎さまのスマホ撮影FAX（手書き）は全体信頼度88%。商品「オーパスワン」と数量「10,000本」は高確度ですが、決済方法が2種類記載・振込予定日が不明瞭のため『要確認』です。相手先への確認をおすすめします。";
  return "受注一覧・アラート・承認・月次ダッシュボードの内容についてお答えできます。例：「本日のAI自動処理率は？」「未承認の案件は？」";
}

export function AiChat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "こんにちは。受注状況について何でも聞いてください。下の質問例からも選べます。" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  function send(text: string) {
    const q = text.trim();
    if (!q || typing) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    const answer = answerFor(q);
    window.setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { role: "ai", text: answer }]);
    }, 800);
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-[13px] border border-surface-border bg-surface shadow-card">
      {/* ヘッダー (ネイビー) */}
      <div className="surface-cover flex items-center gap-3 border-b border-white/10 px-5 py-3.5">
        <span className="ai-gradient flex h-9 w-9 flex-none items-center justify-center rounded-lg text-white shadow-glow-cyan">
          <Icon name="sparkles" className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div>
          <div className="text-sm font-semibold text-white">AIアシスタント</div>
          <div className="flex items-center gap-1.5 text-[11px] text-accent-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-400" />
            </span>
            オンライン
          </div>
        </div>
      </div>

      {/* メッセージ */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-surface-sunken/40 px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                m.role === "user"
                  ? "rounded-tr-sm bg-brand-600 text-white"
                  : "rounded-tl-sm border border-line bg-surface text-ink"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-line bg-surface px-3.5 py-3">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-typing-dot"
                  style={{ animationDelay: `${d * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* FAQチップ */}
      <div className="flex flex-wrap gap-1.5 border-t border-line px-4 pt-3">
        {FAQ.map((f) => (
          <button
            key={f}
            onClick={() => send(f)}
            className="rounded-full border border-line bg-surface px-2.5 py-1 text-[12px] text-ink-soft transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            {f}
          </button>
        ))}
      </div>

      {/* 入力 */}
      <div className="flex items-center gap-2 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(input);
          }}
          placeholder="受注について質問する…"
          className="h-11 flex-1 rounded-[9px] border border-line bg-surface px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent-400 focus:ring-2 focus:ring-accent-400/25"
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || typing}
          className="ai-gradient flex h-11 w-11 flex-none items-center justify-center rounded-[9px] text-white shadow-glow-sm transition-all hover:-translate-y-px disabled:opacity-40"
          aria-label="送信"
        >
          <Icon name="chevronRight" className="h-5 w-5" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
