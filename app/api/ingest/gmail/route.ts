import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import {
  ingestMessages,
  missingEnv,
  type SourceMessage,
} from "@/lib/ingest-server";

// ------------------------------------------------------------
// Gmail 実取り込みAPI (IMAP + アプリパスワード方式)
//   受信トレイの直近メールを取得 → 共通エンジンで受注抽出・分類。
//   必要env: GMAIL_ADDRESS / GMAIL_APP_PASSWORD (Googleアカウントの
//   2段階認証を有効にした上で発行する16桁のアプリパスワード)
// ------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FETCH_COUNT = 15; // 直近何通を見るか

export async function POST() {
  try {
    const missing = missingEnv(["GMAIL_ADDRESS", "GMAIL_APP_PASSWORD", "ANTHROPIC_API_KEY"]);
    if (missing) {
      return NextResponse.json(
        { error: `環境変数 ${missing} が未設定です。.env.local に追加してください。` },
        { status: 500 },
      );
    }

    const client = new ImapFlow({
      host: "imap.gmail.com",
      port: 993,
      secure: true,
      auth: {
        user: process.env.GMAIL_ADDRESS!,
        pass: process.env.GMAIL_APP_PASSWORD!.replace(/\s/g, ""), // アプリPWの空白は除去
      },
      logger: false,
    });

    const messages: SourceMessage[] = [];
    try {
      await client.connect();
    } catch (e) {
      return NextResponse.json(
        {
          error:
            "Gmailにログインできませんでした。GMAIL_ADDRESS と GMAIL_APP_PASSWORD（アプリパスワード）を確認してください。",
        },
        { status: 502 },
      );
    }

    const lock = await client.getMailboxLock("INBOX");
    try {
      const mailbox = client.mailbox;
      const exists = mailbox && typeof mailbox === "object" ? mailbox.exists : 0;
      if (exists > 0) {
        const start = Math.max(1, exists - FETCH_COUNT + 1);
        for await (const msg of client.fetch(`${start}:*`, {
          uid: true,
          envelope: true,
          source: true,
        })) {
          if (!msg.source || !msg.envelope) continue;
          const parsed = await simpleParser(msg.source);
          const text = (parsed.text ?? "").trim();
          if (!text) continue;
          const fromAddr = msg.envelope.from?.[0];
          const senderName = fromAddr?.name || fromAddr?.address || "不明";
          const sendTime = Math.floor(
            (msg.envelope.date ? new Date(msg.envelope.date).getTime() : Date.now()) / 1000,
          );
          messages.push({
            id: `gmail-${msg.uid}`,
            sender: senderName,
            sendTime,
            // 長すぎるメールは先頭2000文字まで (署名・引用の暴走対策)
            text: text.slice(0, 2000),
            subject: msg.envelope.subject ?? null,
            replyTo: fromAddr?.address ?? null,
          });
        }
      }
    } finally {
      lock.release();
      await client.logout().catch(() => {});
    }

    const result = await ingestMessages(messages, {
      channel: "email_body",
      sourceName: "メール本文",
      contactAddress: (m) => m.replyTo ?? "",
      previewKind: "email",
      previewHeader: (m) => `件名：${m.subject ?? "(件名なし)"} / 差出人：${m.sender} <${m.replyTo ?? ""}>`,
      previewBody: (m) => m.text,
      replySubject: (m) => (m.subject ? `Re: ${m.subject}` : "ご注文内容の確認のお願い"),
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
