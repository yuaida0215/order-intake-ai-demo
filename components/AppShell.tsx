"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

// /login はサイドバー無しの全画面。それ以外は左サイドバー＋メイン。
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname === "/login";

  if (bare) return <>{children}</>;

  return (
    <>
      <Sidebar />
      <div className="pl-60">
        <main className="mx-auto min-h-screen w-full max-w-[1280px] px-8 py-7">{children}</main>
      </div>
    </>
  );
}
