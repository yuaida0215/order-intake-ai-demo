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
      <div className="pl-[232px]">
        <main className="mx-auto min-h-screen w-full max-w-[1440px] px-8 py-8 xl:px-10">{children}</main>
      </div>
    </>
  );
}
