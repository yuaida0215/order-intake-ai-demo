"use client";

import { useEffect, useRef } from "react";
import type { ThreadMessage } from "@/lib/types";
import { Icon } from "@/components/icons";

/** 会話ラリー表示 (吹き出し形式)。相手方=左・グレー、自社=右・紫薄 (§3-1 / §3-3)
 *  highlightMessageIds: AIが「受注意思」を検出したメッセージ → 目立つ色で強調。
 *  過去履歴が長い場合はスクロールでさかのぼれる（初期表示は最新にスクロール）。 */
export function ConversationPreview({
  messages,
  compact,
  highlightMessageIds,
}: {
  messages: ThreadMessage[];
  compact?: boolean;
  highlightMessageIds?: string[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const highlight = new Set(highlightMessageIds ?? []);
  const hasHistory = messages.length > 5;

  // 初期表示は最新メッセージ（＝検出箇所付近）にスクロール
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className={compact ? "" : "rounded-lg border border-surface-border bg-surface-sunken p-3"}>
      {hasHistory && (
        <div className="mb-1.5 flex items-center justify-center gap-1 text-[10px] text-ink-faint">
          <Icon name="chevronRight" className="h-3 w-3 -rotate-90" /> 上にスクロールで過去の履歴
        </div>
      )}
      <div
        ref={scrollRef}
        className="max-h-[320px] space-y-2.5 overflow-y-auto pr-1"
      >
        {messages.map((m) => {
          const isSelf = m.role === "self";
          const detected = highlight.has(m.messageId);
          return (
            <div key={m.messageId} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[85%] flex-col gap-0.5 ${isSelf ? "items-end" : "items-start"}`}>
                <span className={`flex items-center gap-1.5 text-[10px] ${isSelf ? "flex-row-reverse" : ""}`}>
                  <span className="text-ink-faint">{m.senderName} ・ {m.sentAt.slice(5, 16).replace("T", " ")}</span>
                  {detected && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/20 px-1.5 py-px font-semibold text-amber-300">
                      <Icon name="sparkles" className="h-2.5 w-2.5" strokeWidth={2} /> AI検出：受注意思
                    </span>
                  )}
                </span>
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed transition-colors ${
                    detected
                      ? "bg-amber-400/15 text-ink shadow-[0_0_0_1.5px_rgba(251,191,36,0.7)]"
                      : isSelf
                        ? "rounded-tr-sm bg-brand-500/25 text-ink ring-1 ring-brand-500/30"
                        : "rounded-tl-sm bg-surface text-ink ring-1 ring-surface-border"
                  } ${detected ? "" : isSelf ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                >
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
