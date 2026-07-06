"use client";

import { useEffect, useRef } from "react";
import { useOrderStore } from "@/lib/store";

const TICK_MS = 5000;

/** 「自動監視」ONのとき、一定間隔でモックの受注アラートを1件ずつ投入するheadlessコンポーネント */
export function WatchTicker() {
  const watchEnabled = useOrderStore((s) => s.watchEnabled);
  const dripNextAlert = useOrderStore((s) => s.dripNextAlert);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (watchEnabled) {
      timerRef.current = setInterval(() => {
        dripNextAlert();
      }, TICK_MS);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [watchEnabled, dripNextAlert]);

  return null;
}
