"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store";
import {
  Card,
  SectionTitle,
  Button,
  LinkButton,
  Field,
  Empty,
} from "@/components/ui";
import {
  StatusBadge,
  AssigneeBadge,
  CategoryBadge,
  AgentAvatar,
} from "@/components/badges";
import { SourcePreview } from "@/components/SourcePreview";
import {
  orderCategory,
  CATEGORY_LABEL,
  STATUS_LABEL,
  ASSIGNEE_LABEL,
  yen,
  formatDate,
  totalQuantity,
} from "@/lib/format";
import type { DemoOrder } from "@/lib/types";

// ------------------------------------------------------------
// 小さな共通サブコンポーネント（このファイル内限定）
// ------------------------------------------------------------

/** 誰の対応待ちかを示す帯（自社=amber / 相手先=red） */
function OwnerBanner({ owner }: { owner: "internal" | "customer" }) {
  if (owner === "customer") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
        <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
        <span className="text-sm font-semibold text-red-700">
          相手先へ依頼
        </span>
        <span className="text-xs text-red-500">
          相手先からの返信が必要です
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
      <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
      <span className="text-sm font-semibold text-amber-700">自社で対応</span>
      <span className="text-xs text-amber-500">
        担当者による確認・入力が必要です
      </span>
    </div>
  );
}

/** 情報メッセージブロック */
function NoticeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-sunken px-4 py-3 text-sm leading-relaxed text-ink-soft">
      {children}
    </div>
  );
}

/** 軽量トーストのようなインライン通知 */
function InlineNote({
  tone,
  children,
}: {
  tone: "neutral" | "success";
  children: React.ReactNode;
}) {
  const cls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-surface-border bg-surface-sunken text-ink-soft";
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>
      {children}
    </div>
  );
}

// ------------------------------------------------------------
// ページ本体
// ------------------------------------------------------------

export default function Page({ params }: { params: { id: string } }) {
  const router = useRouter();
  const order = useOrderStore((s) => s.orders.find((o) => o.id === params.id));

  const resolveException = useOrderStore((s) => s.resolveException);
  const updateItem = useOrderStore((s) => s.updateItem);
  const updateDraftBody = useOrderStore((s) => s.updateDraftBody);
  const regenerateDraft = useOrderStore((s) => s.regenerateDraft);
  const saveDraft = useOrderStore((s) => s.saveDraft);
  const sendReply = useOrderStore((s) => s.sendReply);

  // --- ローカル入力ステート ---
  const [showInputA, setShowInputA] = useState(false);
  const [showInputB, setShowInputB] = useState(false);
  const [showInputD, setShowInputD] = useState(false);
  const [heldNote, setHeldNote] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  // A: 手入力フォーム
  const [aProductName, setAProductName] = useState("");
  const [aQuantity, setAQuantity] = useState("");
  // B: 希望納品日
  const [bDeliveryDate, setBDeliveryDate] = useState("");
  const [bResolved, setBResolved] = useState(false);
  // D: 商品コード / 数量
  const [dProductCode, setDProductCode] = useState("");
  const [dQuantity, setDQuantity] = useState("");
  const [dResolved, setDResolved] = useState(false);

  // ---- NotFound ----
  if (!order) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col items-start gap-4 py-6">
            <div>
              <h2 className="text-lg font-bold text-ink">
                受注が見つかりません
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                指定された受注ID「{params.id}」は存在しないか、削除された可能性があります。
              </p>
            </div>
            <LinkButton href="/orders" variant="primary">
              受注一覧へ
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  const category = orderCategory(order);
  const firstItem = order.items[0] ?? null;
  const owner: "internal" | "customer" =
    category === "C" || order.assignedTo === "customer"
      ? "customer"
      : "internal";

  // 送信済み判定（C）
  const alreadySent =
    order.draftReply?.status === "sent_mock" ||
    order.status === "waiting_customer_reply";

  // --- 例外なし ---
  if (order.exceptionType === null) {
    return (
      <div className="space-y-6">
        <ExceptionHeader order={order} />
        <Card>
          <div className="flex flex-col items-start gap-4 py-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                ✓
              </span>
              <h2 className="text-lg font-bold text-ink">
                この案件に例外はありません。
              </h2>
            </div>
            <p className="text-sm text-ink-muted">
              自動処理を継続できます。読み取り内容の確認、または基幹システムへの入力へ進んでください。
            </p>
            <div className="flex gap-3">
              <LinkButton
                href={`/orders/${order.id}/read`}
                variant="secondary"
              >
                読み取り内容を確認
              </LinkButton>
              <LinkButton
                href={`/orders/${order.id}/core-system-input`}
                variant="primary"
              >
                基幹システムへ入力 →
              </LinkButton>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ------------------------------------------------------------
  // 各カテゴリの右パネルを構築
  // ------------------------------------------------------------

  // A: OCR失敗 — 手入力
  const confirmA = () => {
    if (firstItem) {
      updateItem(order.id, firstItem.lineNo, {
        productName: aProductName.trim() || firstItem.productName,
        quantity: aQuantity.trim() ? Number(aQuantity) : firstItem.quantity,
      });
    }
    resolveException(order.id);
    router.push(`/orders/${order.id}/core-system-input`);
  };

  // B: 一部虫食い — 希望納品日
  const confirmB = () => {
    resolveException(order.id, { requestedDeliveryDate: bDeliveryDate });
    setBResolved(true);
  };

  // D: バリデーションエラー — 商品コード/数量修正
  const confirmD = () => {
    if (firstItem) {
      updateItem(order.id, firstItem.lineNo, {
        productCode: dProductCode.trim() || firstItem.productCode,
        quantity: dQuantity.trim() ? Number(dQuantity) : firstItem.quantity,
      });
    }
    resolveException(order.id);
    setDResolved(true);
  };

  const rightPanel = (() => {
    switch (category) {
      // ----------------------------------------------------
      case "A":
        return (
          <div className="space-y-4">
            <NoticeBlock>
              FAX画像が不鮮明で、商品名・数量・希望納品日などを読み取れませんでした。原本を確認して手入力してください。
            </NoticeBlock>

            {!showInputA ? (
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" onClick={() => setShowInputA(true)}>
                  手入力する
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setHeldNote(true)}
                >
                  保留にする
                </Button>
              </div>
            ) : (
              <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/40 p-4">
                <p className="text-sm font-semibold text-ink">
                  原本を見ながら不足項目を入力
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="商品名">
                    <input
                      type="text"
                      value={aProductName}
                      onChange={(e) => setAProductName(e.target.value)}
                      placeholder="例）ステンレスボトル 500ml"
                      className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                    />
                  </Field>
                  <Field label="数量">
                    <input
                      type="number"
                      value={aQuantity}
                      onChange={(e) => setAQuantity(e.target.value)}
                      placeholder="例）120"
                      className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-ink tabular-nums outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                    />
                  </Field>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="primary"
                    onClick={confirmA}
                    disabled={!aProductName.trim() && !aQuantity.trim()}
                  >
                    確定して基幹システムへ →
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowInputA(false)}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            )}

            {heldNote && (
              <InlineNote tone="neutral">
                保留にしました。案件は担当者の対応待ちのまま保持されます。
              </InlineNote>
            )}
          </div>
        );

      // ----------------------------------------------------
      case "B":
        return (
          <div className="space-y-4">
            <NoticeBlock>
              主要項目は読み取れましたが、一部の項目が不足しています。不足項目を入力すると自動処理を再開できます。
            </NoticeBlock>

            <div className="rounded-lg border border-surface-border bg-surface-sunken p-4">
              <p className="mb-3 text-xs font-semibold text-ink-muted">
                読み取り済み（主要項目）
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="取引先">
                  {order.customerName ? (
                    <span className="text-sm text-ink">
                      {order.customerName}
                    </span>
                  ) : (
                    <Empty />
                  )}
                </Field>
                <Field label="発注日">
                  <span className="text-sm text-ink tabular-nums">
                    {formatDate(order.orderDate)}
                  </span>
                </Field>
                <Field label="商品">
                  {firstItem?.productName ? (
                    <span className="text-sm text-ink">
                      {firstItem.productName}
                    </span>
                  ) : (
                    <Empty />
                  )}
                </Field>
                <Field label="合計数量">
                  <span className="text-sm text-ink tabular-nums">
                    {totalQuantity(order) ?? "—"}
                  </span>
                </Field>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
              <Field label="希望納品日" missing={!bResolved}>
                {bResolved ? (
                  <span className="text-sm font-semibold text-emerald-700 tabular-nums">
                    {formatDate(order.requestedDeliveryDate)}（入力済み）
                  </span>
                ) : (
                  <span className="text-sm text-red-500">
                    未入力（要入力）
                  </span>
                )}
              </Field>

              {!bResolved && !showInputB && (
                <div className="mt-3">
                  <Button
                    variant="primary"
                    onClick={() => setShowInputB(true)}
                  >
                    不足項目を入力
                  </Button>
                </div>
              )}

              {!bResolved && showInputB && (
                <div className="mt-3 space-y-3">
                  <input
                    type="date"
                    value={bDeliveryDate}
                    onChange={(e) => setBDeliveryDate(e.target.value)}
                    className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-ink tabular-nums outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 sm:w-56"
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={confirmB}
                      disabled={!bDeliveryDate}
                    >
                      確定
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowInputB(false)}
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Button
                variant="primary"
                disabled={!bResolved}
                onClick={() =>
                  router.push(`/orders/${order.id}/core-system-input`)
                }
              >
                基幹システムへ入力 →
              </Button>
              {!bResolved && (
                <p className="mt-2 text-xs text-ink-muted">
                  ※ 不足項目を確定すると押せるようになります
                </p>
              )}
            </div>
          </div>
        );

      // ----------------------------------------------------
      case "C": {
        const draft = order.draftReply;
        const toAddr = draft?.to ?? order.customerContactAddress;
        const subject = draft?.subject;

        return (
          <div className="space-y-4">
            <NoticeBlock>
              受注書に希望納品日と納品先住所が記載されていません。相手先に情報補填を依頼する必要があります。AIが確認依頼文面を作成しました。
            </NoticeBlock>

            <div className="rounded-lg border border-brand-200 bg-white p-4">
              <div className="-mx-4 -mt-4 mb-4 flex items-center gap-2 rounded-t-lg bg-brand-50/50 px-4 py-2.5">
                <AgentAvatar size="h-6 w-6" className="text-xs" />
                <span className="text-xs font-semibold text-brand-700">
                  AIが自動生成した確認依頼文面
                </span>
              </div>
              <SectionTitle sub="送信前に編集できます">
                返信ドラフト
              </SectionTitle>

              {draft === null ? (
                <InlineNote tone="neutral">
                  返信ドラフトが未生成です。案件を再度読み取ってから文面を生成してください。
                </InlineNote>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <Field label="宛先">
                      {toAddr ? (
                        <span className="text-sm text-ink">{toAddr}</span>
                      ) : (
                        <Empty />
                      )}
                    </Field>
                    <Field label="件名">
                      {subject ? (
                        <span className="text-sm text-ink">{subject}</span>
                      ) : (
                        <span className="text-sm text-ink-muted">
                          （チャネル返信のため件名なし）
                        </span>
                      )}
                    </Field>
                  </div>

                  {alreadySent ? (
                    <>
                      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <span className="mt-0.5 text-emerald-600">✓</span>
                        <p className="text-sm font-medium text-emerald-700">
                          相手先へ確認依頼を送信しました（モック）。相手先返信待ちです。
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold text-ink-muted">
                          送信本文
                        </p>
                        <div className="whitespace-pre-wrap rounded-md border border-surface-border bg-surface-sunken px-3 py-3 text-sm leading-relaxed text-ink-soft">
                          {draft.body}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-ink-muted">
                          本文
                        </label>
                        <textarea
                          value={draft.body}
                          onChange={(e) =>
                            updateDraftBody(order.id, e.target.value)
                          }
                          rows={10}
                          className="w-full resize-y rounded-md border border-surface-border bg-white px-3 py-3 text-sm leading-relaxed text-ink outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                        />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => regenerateDraft(order.id)}
                        >
                          ✨ 文面を再生成
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => sendReply(order.id)}
                        >
                          送信する
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            saveDraft(order.id);
                            setSavedNote(true);
                          }}
                        >
                          下書き保存
                        </Button>
                      </div>

                      {savedNote && (
                        <InlineNote tone="neutral">
                          下書きを保存しました。
                        </InlineNote>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      // ----------------------------------------------------
      case "D":
        return (
          <div className="space-y-4">
            <NoticeBlock>
              基幹システムのマスタと照合した結果、値の不整合が見つかりました。内容を修正すると自動処理を再開できます。
            </NoticeBlock>

            <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
              <p className="mb-2 text-xs font-semibold text-ink-muted">
                検出されたエラー
              </p>
              {order.validationErrors.length > 0 ? (
                <ul className="space-y-2">
                  {order.validationErrors.map((v, i) => (
                    <li
                      key={`${v.fieldKey}-${i}`}
                      className="flex items-start gap-2 text-sm text-red-600"
                    >
                      <span className="mt-0.5">●</span>
                      <span>
                        <span className="font-semibold">{v.fieldLabel}</span>
                        ：{v.message}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">
                  商品コードが商品マスタに存在しません。
                </p>
              )}

              {!dResolved &&
                (!showInputD ? (
                  <div className="mt-4">
                    <Button
                      variant="primary"
                      onClick={() => setShowInputD(true)}
                    >
                      内容を修正
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="商品コード">
                        <input
                          type="text"
                          value={dProductCode}
                          onChange={(e) => setDProductCode(e.target.value)}
                          placeholder={
                            firstItem?.productCode ?? "例）P-1024"
                          }
                          className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                        />
                      </Field>
                      <Field label="数量">
                        <input
                          type="number"
                          value={dQuantity}
                          onChange={(e) => setDQuantity(e.target.value)}
                          placeholder={
                            firstItem?.quantity != null
                              ? String(firstItem.quantity)
                              : "例）50"
                          }
                          className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-ink tabular-nums outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                        />
                      </Field>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="primary"
                        onClick={confirmD}
                        disabled={!dProductCode.trim() && !dQuantity.trim()}
                      >
                        確定
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setShowInputD(false)}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                ))}

              {dResolved && (
                <div className="mt-4">
                  <InlineNote tone="success">
                    修正内容をマスタと再照合しました。エラーは解消されています。
                  </InlineNote>
                </div>
              )}
            </div>

            <div>
              <Button
                variant="primary"
                disabled={!dResolved}
                onClick={() =>
                  router.push(`/orders/${order.id}/core-system-input`)
                }
              >
                基幹システムへ入力 →
              </Button>
              {!dResolved && (
                <p className="mt-2 text-xs text-ink-muted">
                  ※ 内容を確定すると押せるようになります
                </p>
              )}
            </div>
          </div>
        );

      // ----------------------------------------------------
      default:
        return (
          <NoticeBlock>
            この案件の例外種別を判定できませんでした。担当者による確認をお願いします。
          </NoticeBlock>
        );
    }
  })();

  // ------------------------------------------------------------
  // レンダリング
  // ------------------------------------------------------------
  return (
    <div className="space-y-6">
      <ExceptionHeader order={order} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT：例外内容 + 元データ */}
        <div className="space-y-6">
          <Card>
            <SectionTitle
              sub="AI Agentが自動処理を止めた理由"
              right={<CategoryBadge exceptionType={order.exceptionType} />}
            >
              例外内容
            </SectionTitle>

            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs text-ink-muted">分類</p>
                  <p className="text-sm font-semibold text-ink">
                    {CATEGORY_LABEL[category]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">ステータス</p>
                  <p className="text-sm font-semibold text-ink">
                    {STATUS_LABEL[order.status]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">担当</p>
                  <p className="text-sm font-semibold text-ink">
                    {ASSIGNEE_LABEL[order.assignedTo]}
                  </p>
                </div>
              </div>

              {/* 不足項目 */}
              {order.missingFields.length > 0 && (
                <div className="rounded-lg border border-surface-border bg-surface-sunken p-4">
                  <p className="mb-2 text-xs font-semibold text-ink-muted">
                    不足項目
                  </p>
                  <ul className="space-y-2">
                    {order.missingFields.map((m, i) => (
                      <li
                        key={`${m.fieldKey}-${i}`}
                        className="text-sm text-ink-soft"
                      >
                        <span className="font-semibold text-ink">
                          {m.fieldLabel}
                        </span>
                        <span className="text-ink-muted">：{m.reason}</span>
                        <span className="ml-2 rounded bg-white px-1.5 py-0.5 text-[11px] text-ink-muted ring-1 ring-surface-border">
                          {m.requiredBy === "customer"
                            ? "相手先"
                            : "自社"}
                          が入力
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* エラー内容 */}
              {order.validationErrors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50/60 p-4">
                  <p className="mb-2 text-xs font-semibold text-red-600">
                    エラー内容
                  </p>
                  <ul className="space-y-2">
                    {order.validationErrors.map((v, i) => (
                      <li
                        key={`${v.fieldKey}-${i}`}
                        className="text-sm text-red-700"
                      >
                        <span className="font-semibold">{v.fieldLabel}</span>
                        ：{v.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AIの判定理由 */}
              <div>
                <p className="mb-1 text-xs font-semibold text-ink-muted">
                  ✨ AIの判定理由
                </p>
                {order.aiSummary ? (
                  <p className="text-sm leading-relaxed text-ink-soft">
                    {order.aiSummary}
                  </p>
                ) : (
                  <Empty />
                )}
              </div>

              {/* 推奨アクション */}
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
                <p className="mb-1 text-xs font-semibold text-brand-700">
                  推奨アクション
                </p>
                {order.recommendedAction ? (
                  <p className="text-sm leading-relaxed text-brand-700">
                    {order.recommendedAction}
                  </p>
                ) : (
                  <span className="text-sm text-ink-muted">—</span>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle sub="AIが読み取った元の受注データ">
              元データ
            </SectionTitle>
            <div className="mt-4">
              <SourcePreview order={order} />
            </div>
          </Card>
        </div>

        {/* RIGHT：対応アクション */}
        <div className="space-y-6">
          <Card>
            <SectionTitle
              sub="例外区分に応じた対応を行います"
              right={<StatusBadge status={order.status} />}
            >
              対応アクション
            </SectionTitle>

            <div className="mt-4 space-y-4">
              <OwnerBanner owner={owner} />
              {rightPanel}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// ヘッダー（戻るリンク + タイトル + バッジ群）
// ------------------------------------------------------------
function ExceptionHeader({ order }: { order: DemoOrder }) {
  return (
    <div className="space-y-3">
      <Link
        href="/orders"
        className="text-sm text-ink-muted hover:text-ink"
      >
        ← 受注一覧に戻る
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">例外案件の確認・対応</h1>
          <p className="mt-1 text-sm text-ink-muted">
            自動処理できなかった案件の理由を確認し、必要な対応を行います。
            <span className="ml-2 font-mono text-ink-soft">{order.id}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <AssigneeBadge assignee={order.assignedTo} />
        </div>
      </div>
    </div>
  );
}
