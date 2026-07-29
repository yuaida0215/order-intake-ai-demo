"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { WatchTicker } from "@/components/WatchTicker";

// /login はサイドバー無しの全画面。それ以外は左サイドバー＋メイン。
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname === "/login";

  if (bare) return <>{children}</>;

  return (
    <>
      <WatchTicker />
      <Sidebar />
      <div className="pl-[236px]">
        <main className="min-h-screen w-full px-6 py-7 xl:px-8">{children}</main>
      </div>
    </>
  );
}
