import { CHANNEL_ICON, CHANNEL_LABEL, formatDateTime } from "@/lib/format";
import type { Order } from "@/lib/types";
import { ConversationPreview } from "./ConversationPreview";

/** 元データプレビュー (§6.2 / §8) — チャネルごとに見た目を出し分ける */
export function SourcePreview({ order }: { order: Order }) {
  const p = order.sourcePreview;

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-surface-border bg-surface-sunken px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-soft">
          <span aria-hidden>{CHANNEL_ICON[order.channel]}</span>
          {CHANNEL_LABEL[order.channel]}・{order.sourceName}
        </div>
        <span className="text-[11px] text-ink-muted">{formatDateTime(order.receivedAt)} 受信</span>
      </div>

      <div className="p-4">
        {p?.kind === "fax_image" ? (
          <FaxPreview header={p.header} lines={p.faxLines ?? []} imageDataUrl={p.imageDataUrl} />
        ) : p?.kind === "email" ? (
          <EmailPreview header={p.header} body={p.body ?? ""} />
        ) : p?.kind === "chat" ? (
          <ChatPreview header={p.header} body={p.body ?? ""} channel={order.channel} imageDataUrl={p.imageDataUrl} />
        ) : p?.kind === "edi" ? (
          <EdiPreview header={p.header} body={p.body ?? ""} />
        ) : p?.kind === "conversation" ? (
          <div>
            {p.header ? <div className="mb-2 text-[11px] font-medium text-ink-muted">{p.header}</div> : null}
            <ConversationPreview messages={p.messages ?? []} />
          </div>
        ) : p?.kind === "scanned_image" ? (
          <ScannedImagePreview header={p.header} imageDataUrl={p.imageDataUrl} />
        ) : (
          <p className="text-sm text-ink-muted">元データプレビューはありません。</p>
        )}
      </div>
    </div>
  );
}

function FaxPreview({
  header,
  lines,
  imageDataUrl,
}: {
  header?: string;
  lines: { text: string; readable: boolean }[];
  imageDataUrl?: string;
}) {
  // 実画像がある場合: 受信したFAX画像そのものと、AIが画像から抽出したテキストを並べて表示
  if (imageDataUrl) {
    return (
      <div className="space-y-4">
        {header ? <div className="text-[11px] text-ink-muted">{header}</div> : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* 受信したFAX画像そのもの */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold text-ink-muted">受信画像（原本）</p>
            <div className="flex justify-center rounded-lg border border-gray-300 bg-gray-100 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageDataUrl}
                alt="受信したFAX注文書の画像（AIが読み取り対象にした原本）"
                className="max-h-[520px] w-auto max-w-full rounded-sm bg-white shadow-md"
              />
            </div>
          </div>
          {/* AIが画像から抽出したテキスト */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold text-ink-muted">✨ AIが画像から読み取った内容</p>
            <div className="rounded-lg border border-gray-300 bg-[repeating-linear-gradient(0deg,#fafafa,#fafafa_22px,#f0f0f0_23px)] p-4 font-mono text-[13px] leading-6 text-gray-800 shadow-inner">
              {lines.map((l, i) =>
                l.readable ? (
                  <div key={i} className="whitespace-pre-wrap">{l.text}</div>
                ) : (
                  <div
                    key={i}
                    className="whitespace-pre-wrap rounded bg-yellow-100/80 px-1 text-gray-500"
                    title="AIが確定できなかった箇所"
                  >
                    {l.text}
                    <span className="ml-2 rounded bg-red-100 px-1 text-[10px] font-sans font-medium text-red-600">要確認</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-ink-muted">
          ※ 受信したFAX画像をAIがそのまま読み取ってテキスト化しました。黄色ハイライト部分は内容が確定できず確認が必要な箇所です。
        </p>
      </div>
    );
  }

  return (
    <div>
      {header ? <div className="mb-2 text-[11px] text-ink-muted">{header}</div> : null}
      <div className="rounded-lg border border-gray-300 bg-[repeating-linear-gradient(0deg,#fafafa,#fafafa_22px,#f0f0f0_23px)] p-4 font-mono text-[13px] leading-6 text-gray-800 shadow-inner">
        {lines.map((l, i) =>
          l.readable ? (
            <div key={i} className="whitespace-pre-wrap">{l.text}</div>
          ) : (
            <div
              key={i}
              className="whitespace-pre-wrap rounded bg-yellow-100/80 px-1 text-gray-500 [text-shadow:0_0_3px_rgba(0,0,0,0.35)]"
              title="AIが読み取れなかった箇所"
            >
              {l.text}
              <span className="ml-2 rounded bg-red-100 px-1 text-[10px] font-sans font-medium text-red-600">読取不可</span>
            </div>
          ),
        )}
      </div>
      <p className="mt-2 text-[11px] text-ink-muted">
        ※ 黄色ハイライト部分はAIが読み取れなかった箇所です
      </p>
    </div>
  );
}

function EmailPreview({ header, body }: { header?: string; body: string }) {
  return (
    <div>
      {header ? (
        <div className="mb-3 space-y-0.5 rounded-lg bg-surface-sunken px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
          {header.split(" / ").map((h, i) => (
            <div key={i}>{h}</div>
          ))}
        </div>
      ) : null}
      <pre className="whitespace-pre-wrap rounded-lg border border-surface-border bg-white p-4 font-mono text-[12.5px] leading-6 text-gray-800">
        {body}
      </pre>
    </div>
  );
}

function ChatPreview({
  header,
  body,
  channel,
  imageDataUrl,
}: {
  header?: string;
  body: string;
  channel: Order["channel"];
  imageDataUrl?: string;
}) {
  const accent = channel === "teams" ? "bg-indigo-500" : channel === "chatwork" ? "bg-teal-500" : "bg-violet-500";
  const avatarLetter = channel === "teams" ? "T" : channel === "chatwork" ? "C" : "S";
  return (
    <div>
      {header ? <div className="mb-2 text-[11px] font-medium text-ink-muted">{header}</div> : null}
      <div className="flex gap-3">
        <div className={`mt-0.5 h-8 w-8 flex-none rounded-full ${accent} text-center text-sm leading-8 text-white`}>
          {avatarLetter}
        </div>
        <div className="min-w-0 space-y-2">
          <div className="rounded-2xl rounded-tl-sm bg-surface-sunken px-4 py-3 text-sm leading-relaxed text-ink whitespace-pre-wrap">
            {body}
          </div>
          {imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageDataUrl}
              alt="添付画像 (AIが読み取り対象にしたスクリーンショット等)"
              className="max-h-96 w-auto max-w-full rounded-xl border border-surface-border"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ScannedImagePreview({ header, imageDataUrl }: { header?: string; imageDataUrl?: string }) {
  return (
    <div>
      {header ? (
        <div className="mb-3 space-y-0.5 rounded-lg bg-surface-sunken px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
          {header.split(" / ").map((h, i) => (
            <div key={i}>{h}</div>
          ))}
        </div>
      ) : null}
      <div className="flex justify-center rounded-lg border border-gray-300 bg-gray-100 p-4">
        {imageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageDataUrl}
            alt="AIが読み取り対象にした添付書類の画像"
            className="max-h-[640px] w-auto max-w-full rounded-sm bg-white shadow-md"
          />
        ) : (
          <p className="py-10 text-sm text-ink-muted">画像を読み込めませんでした。</p>
        )}
      </div>
      <p className="mt-2 text-[11px] text-ink-muted">※ 添付されたPDF/画像をAIがそのまま読み取ります</p>
    </div>
  );
}

function EdiPreview({ header, body }: { header?: string; body: string }) {
  return (
    <div>
      {header ? <div className="mb-2 text-[11px] text-ink-muted">{header}</div> : null}
      <pre className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900 p-4 font-mono text-[12px] leading-6 text-emerald-300">
        {body}
      </pre>
    </div>
  );
}
