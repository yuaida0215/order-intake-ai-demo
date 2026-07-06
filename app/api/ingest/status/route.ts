import { NextResponse } from "next/server";

// 取り込みチャネルの環境変数セットアップ状況を返す診断API。
// キーの有無(true/false)と関連キー名のみを返し、値は一切返さない。
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const has = (n: string) => Boolean(process.env[n] && process.env[n]!.trim());
  // タイプミス・全角=事故の検出用: 関連しそうなキー名だけ列挙 (値は返さない)
  const relatedKeyNames = Object.keys(process.env).filter((k) =>
    /slack|gmail|chatwork/i.test(k),
  );
  return NextResponse.json({
    chatwork: {
      CHATWORK_API_TOKEN: has("CHATWORK_API_TOKEN"),
      CHATWORK_ROOM_ID: has("CHATWORK_ROOM_ID"),
    },
    slack: {
      SLACK_BOT_TOKEN: has("SLACK_BOT_TOKEN"),
      SLACK_CHANNEL_ID: has("SLACK_CHANNEL_ID"),
    },
    gmail: {
      GMAIL_ADDRESS: has("GMAIL_ADDRESS"),
      GMAIL_APP_PASSWORD: has("GMAIL_APP_PASSWORD"),
    },
    ANTHROPIC_API_KEY: has("ANTHROPIC_API_KEY"),
    relatedKeyNames,
  });
}
