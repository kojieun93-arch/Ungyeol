"use client";

import { useSyncExternalStore } from "react";
import { PRODUCTS } from "@/content/products";
import type { ProductAccessState, ProductChapterMeta, ProductId } from "./types";

/* ──────────────────────────────────────────────────────────
   상품별 열람 상태 — 데모 전용 (PHASE 4 종합 리포트의 access.ts 와 같은 원칙)
   - public   : 공개 샘플 챕터만 본문
   - demo-full: 화면 확인용 전체 보기. 본문이 모두 있는 상품(재회운)만. 결제 · 구매 · 유료 권한이 아님 (새로고침하면 해제)
   - purchase 는 항상 "not-connected", stage 는 "test" (실제 구매 상태와 구분)
   ────────────────────────────────────────────────────────── */

const modes: Partial<Record<ProductId, "demo-full">> = {};
const listeners = new Set<() => void>();
const cache = new Map<string, ProductAccessState>();

export function getProductAccess(id: ProductId): ProductAccessState {
  const mode = modes[id] ?? "public";
  const key = `${id}:${mode}`;
  let v = cache.get(key);
  if (!v) {
    v = { ...PRODUCTS[id].accessState, mode };
    cache.set(key, v);
  }
  return v;
}

export function setProductDemo(id: ProductId, on: boolean) {
  if (on && !PRODUCTS[id].previewAvailability.fullDemo) return; // 본문이 없는 상품은 데모 전체 보기 없음
  if (on) modes[id] = "demo-full";
  else delete modes[id];
  listeners.forEach((l) => l());
}

export type ChapterGate = "open" | "locked" | "planned";

export function gateOf(a: ProductAccessState, c: Pick<ProductChapterMeta, "id" | "status">): ChapterGate {
  if (a.freeChapters.includes(c.id)) return c.status === "written" ? "open" : "planned";
  if (c.status === "planned") return "planned";
  return a.mode === "demo-full" ? "open" : "locked";
}

export function useProductAccess(id: ProductId): ProductAccessState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => getProductAccess(id),
    () => PRODUCTS[id].accessState,
  );
}
