"use client";

import { useSyncExternalStore } from "react";
import { FREE_CHAPTERS, type ChapterId, type ReportAccessState } from "./types";

/* ──────────────────────────────────────────────────────────
   리포트 접근 권한 — 데모 전용
   - 기본(public): 공개 샘플 챕터(01 · 04)만 본문 열람, 나머지는 목차 · 핵심 질문 · 요약 · 담기는 내용까지
   - demo-full: 화면 확인용 체험. 결제 · 구매 · 유료 권한이 아니며 이 탭의 메모리에만 (새로고침하면 해제)
   - 실제 결제 · 권한 부여 코드는 없음 (purchase 는 항상 "not-connected")
   ────────────────────────────────────────────────────────── */

let state: ReportAccessState = { mode: "public", purchase: "not-connected", freeChapters: FREE_CHAPTERS };
const listeners = new Set<() => void>();

export function getAccess(): ReportAccessState {
  return state;
}

export function setDemoFull(on: boolean) {
  state = { ...state, mode: on ? "demo-full" : "public" };
  listeners.forEach((l) => l());
}

export function canRead(a: ReportAccessState, id: ChapterId) {
  return a.freeChapters.includes(id) || a.mode === "demo-full";
}

const SERVER: ReportAccessState = { mode: "public", purchase: "not-connected", freeChapters: FREE_CHAPTERS };

export function useReportAccess(): ReportAccessState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getAccess,
    () => SERVER,
  );
}
