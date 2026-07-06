import { NextResponse } from "next/server";
import {
  ingestMessages,
  missingEnv,
  type SourceMessage,
} from "@/lib/ingest-server";

// ------------------------------------------------------------
// Chatwork 実取り込みAPI
//   ルームの直近メッセージ取得 → 共通エンジン(lib/ingest-server)で
//   受注抽出・分類。
// ------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ChatworkMessage = {
  message_id: string;
  account: { name: string };
  body: string;
  send_time: number;
};

// Chatwork記法タグを除去してプレーンテキスト化
function cleanBody(body: string): string {
  return body
    .replace(/\[To:\d+\]/g, "")
    .replace(/\[rp aid=\d+[^\]]*\]/g, "")
    .replace(/\[pname:\d+\][^[]*/g, "")
    .replace(/\[piconname:\d+\]/g, "")
    .replace(/\[picon:\d+\]/g, "")
    .replace(/\[qtmeta[^\]]*\]/g, "")
    .replace(/\[\/?(?:info|title|qt|code)\]/g, "\n")
    .replace(/\[hr\]/g, "\n")
    .replace(/\[dtext:[^\]]*\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(req: Request) {
  try {
    const missing = missingEnv(["CHATWORK_API_TOKEN", "CHATWORK_ROOM_ID", "ANTHROPIC_API_KEY"]);
    if (missing) {
      return NextResponse.json(
        { error: `環境変数 ${missing} が未設定です。.env.local に追加してください。` },
        { status: 500 },
      );
    }
    const { knownThreadKeys = [] } = (await req.json().catch(() => ({}))) as { knownThreadKeys?: string[] };
    const token = process.env.CHATWORK_API_TOKEN!;
    const roomId = process.env.CHATWORK_ROOM_ID!;

    const cwRes = await fetch(
      `https://api.chatwork.com/v2/rooms/${roomId}/messages?force=1`,
      { headers: { "x-chatworktoken": token }, cache: "no-store" },
    );
    if (cwRes.status === 204) return NextResponse.json({ orders: [], scanned: 0 });
    if (!cwRes.ok) {
      return NextResponse.json(
        { error: `Chatwork API エラー (HTTP ${cwRes.status})。トークンとルームIDを確認してください。` },
        { status: 502 },
      );
    }
    const raw = (await cwRes.json()) as ChatworkMessage[];
    const messages: SourceMessage[] = raw
      .map((m) => ({
        id: String(m.message_id),
        sender: m.account?.name ?? "不明",
        sendTime: m.send_time,
        text: cleanBody(m.body ?? ""),
      }))
      .filter((m) => m.text.length > 0)
      .slice(-30);

    const result = await ingestMessages(
      messages,
      { channel: "chatwork", sourceName: "Chatworkメッセージ", roomId, roomLabel: `Chatworkルーム ${roomId}` },
      knownThreadKeys,
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
