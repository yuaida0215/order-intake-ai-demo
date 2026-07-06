import type { ThreadMessage } from "@/lib/types";

/** 会話ラリー表示 (吹き出し形式)。相手方=左・グレー、自社=右・紫薄 (§3-1 / §3-3) */
export function ConversationPreview({ messages, compact }: { messages: ThreadMessage[]; compact?: boolean }) {
  return (
    <div className={`space-y-2 ${compact ? "" : "rounded-lg border border-surface-border bg-surface-sunken p-4"}`}>
      {messages.map((m) => {
        const isSelf = m.role === "self";
        return (
          <div key={m.messageId} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] ${isSelf ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
              <span className={`text-[10px] text-ink-faint ${isSelf ? "text-right" : "text-left"}`}>
                {m.senderName} ・ {m.sentAt.slice(11, 16)}
              </span>
              <div
                className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  isSelf
                    ? "rounded-tr-sm bg-brand-100 text-brand-900"
                    : "rounded-tl-sm bg-white text-ink shadow-sm ring-1 ring-surface-border"
                }`}
              >
                {m.text}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
