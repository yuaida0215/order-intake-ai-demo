import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "受注取り込みAI Agent デモ",
  description: "FAX・PDF・メール・Slack/Teams・EDIの受注をAIが読み取り、分類し、基幹システムへ自動入力する営業デモ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
