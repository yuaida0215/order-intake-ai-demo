import { NextResponse } from "next/server";
import {
  ingestMessages,
  missingEnv,
  type SourceMessage,
} from "@/lib/ingest-server";

// ------------------------------------------------------------
// Slack 実取り込みAPI
//   Botトークンでチャンネル履歴を取得 → 共通エンジンで受注抽出・分類。
//   必要スコープ: channels:history (+ private は groups:history), users:read
// ------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type SlackFile = {
  mimetype?: string;
  url_private?: string;
  thumb_1024?: string;
  thumb_720?: string;
};

type SlackMessage = {
  type: string;
  subtype?: string;
  user?: string;
  bot_id?: string;
  text?: string;
  ts: string;
  files?: SlackFile[];
};

// Slackの添付画像をダウンロードしてbase64化 (要 files:read スコープ)。
// 縮小版(thumb_1024)があればそちらを使いペイロードを抑える。
async function downloadSlackImage(
  file: SlackFile,
  token: string,
): Promise<{ mediaType: string; base64: string } | null> {
  const url = file.thumb_1024 || file.thumb_720 || file.url_private;
  if (!url) return null;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") ?? "";
  // files:read が無いとHTMLのログインページが返ってくる → 画像以外は捨てる
  if (!contentType.startsWith("image/")) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 4 * 1024 * 1024) return null; // 4MB超は除外
  return { mediaType: contentType.split(";")[0], base64: buf.toString("base64") };
}

// Slack記法をプレーンテキスト化 (<@U123>, <#C123|general>, <url|label> など)
function cleanSlackText(text: string, userNames: Map<string, string>): string {
  return text
    .replace(/<@([A-Z0-9]+)>/g, (_, id) => `@${userNames.get(id) ?? "member"}`)
    .replace(/<#[A-Z0-9]+\|([^>]*)>/g, "#$1")
    .replace(/<(https?:[^|>]+)\|([^>]+)>/g, "$2")
    .replace(/<(https?:[^>]+)>/g, "$1")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .trim();
}

async function slackApi(method: string, token: string, params: string): Promise<any> {
  const res = await fetch(`https://slack.com/api/${method}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return res.json();
}

export async function POST(req: Request) {
  try {
    const missing = missingEnv(["SLACK_BOT_TOKEN", "SLACK_CHANNEL_ID", "ANTHROPIC_API_KEY"]);
    if (missing) {
      return NextResponse.json(
        { error: `環境変数 ${missing} が未設定です。.env.local に追加してください。` },
        { status: 500 },
      );
    }
    const { knownThreadKeys = [] } = (await req.json().catch(() => ({}))) as { knownThreadKeys?: string[] };
    const token = process.env.SLACK_BOT_TOKEN!;
    const channel = process.env.SLACK_CHANNEL_ID!;

    const hist = await slackApi("conversations.history", token, `channel=${channel}&limit=50`);
    if (!hist.ok) {
      const hint =
        hist.error === "not_in_channel"
          ? "Botをチャンネルに招待してください（チャンネルで /invite @ボット名）。"
          : hist.error === "invalid_auth"
            ? "SLACK_BOT_TOKEN が正しいか確認してください。"
            : hist.error === "channel_not_found"
              ? "SLACK_CHANNEL_ID が正しいか確認してください。"
              : "";
      return NextResponse.json(
        { error: `Slack API エラー (${hist.error})。${hint}` },
        { status: 502 },
      );
    }

    // テキストあり、または画像添付ありのメッセージを対象にする
    // (画像投稿は subtype が付く場合があるため file_share は許容)
    const hasImage = (m: SlackMessage) =>
      (m.files ?? []).some((f) => f.mimetype?.startsWith("image/"));
    const rawMessages = (hist.messages as SlackMessage[]).filter(
      (m) =>
        m.type === "message" &&
        (!m.subtype || m.subtype === "file_share") &&
        !m.bot_id &&
        m.user &&
        ((m.text ?? "").trim() || hasImage(m)),
    );

    // 送信者IDを表示名に解決 (ユニークIDごとに users.info)
    const userIds = [...new Set(rawMessages.map((m) => m.user!))];
    const userNames = new Map<string, string>();
    for (const uid of userIds.slice(0, 20)) {
      const u = await slackApi("users.info", token, `user=${uid}`);
      if (u.ok) {
        userNames.set(
          uid,
          u.user?.profile?.display_name || u.user?.real_name || u.user?.name || uid,
        );
      }
    }

    // conversations.history は新しい順 → 古い順に直して直近30件
    const ordered = rawMessages.reverse().slice(-30);
    const messages: SourceMessage[] = [];
    for (const m of ordered) {
      // 画像添付をダウンロード (1メッセージ最大2枚)
      const imageFiles = (m.files ?? [])
        .filter((f) => f.mimetype?.startsWith("image/"))
        .slice(0, 2);
      const images: { mediaType: string; base64: string }[] = [];
      for (const f of imageFiles) {
        const img = await downloadSlackImage(f, token);
        if (img) images.push(img);
      }
      const text = cleanSlackText(m.text ?? "", userNames);
      if (!text && images.length === 0) continue;
      messages.push({
        id: `slack-${m.ts.replace(".", "")}`,
        sender: userNames.get(m.user!) ?? m.user!,
        sendTime: Math.floor(parseFloat(m.ts)),
        text,
        images: images.length > 0 ? images : undefined,
      });
    }

    const result = await ingestMessages(
      messages,
      { channel: "slack", sourceName: "Slackメッセージ", roomId: channel, roomLabel: `Slack #${channel}` },
      knownThreadKeys,
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
