import type { Metadata } from "next";
import { McShell } from "@/components/mc/McShell";

export const metadata: Metadata = {
  title: "新基幹システム デモ｜ＭＣシステムズ様向け",
  description: "受託加工向け 新基幹システムの画面イメージ（受注→作業票→完成→照合→請求→入金）",
};

export default function McLayout({ children }: { children: React.ReactNode }) {
  return <McShell>{children}</McShell>;
}
