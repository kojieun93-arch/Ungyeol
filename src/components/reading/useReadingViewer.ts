"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { TopicId } from "@/features/saju/topics";
import type { ReadingKind } from "./cards";

/* ──────────────────────────────────────────────────────────
   전체 화면 카드의 열기 · 닫기 · 브라우저 뒤로가기
   - 열 때 history 에 항목 하나를 쌓음(주소는 그대로) → 뒤로가기 = 닫기
   - 닫기 버튼 · Esc 는 그 항목을 history.back() 으로 되돌려, 어느 쪽으로 닫아도 history 가 같아짐
   - 이전 · 다음 카드는 history 를 쌓지 않음 (뒤로가기 한 번이면 언제나 대화로 복귀)
   - 닫히면 열었던 카드 버튼으로 포커스 복귀 (스크롤 이동 없이)
   ────────────────────────────────────────────────────────── */

const KEY = "__ungyeolCard";

const isOurs = (s: unknown) => !!s && typeof s === "object" && (s as Record<string, unknown>)[KEY] === true;

export function useReadingViewer(reduced: boolean) {
  const [kind, setKind] = useState<ReadingKind | null>(null);
  const [closing, setClosing] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refocus = useRef(false);

  const finishClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setClosing(true);
    closeTimer.current = setTimeout(
      () => {
        setKind(null);
        setClosing(false);
        refocus.current = true; // 포커스는 채팅의 inert 가 풀린 뒤(아래 effect)에서
      },
      reduced ? 0 : 200,
    );
  }, [reduced]);

  // 닫힌 뒤 렌더가 끝나 채팅의 inert 가 풀리면, 열었던 카드 버튼으로 포커스 복귀 (스크롤 이동 없이)
  useEffect(() => {
    if (kind !== null || !refocus.current) return;
    refocus.current = false;
    const el = trigger.current;
    if (el?.isConnected) el.focus({ preventScroll: true });
  }, [kind]);

  const open = useCallback((k: ReadingKind, from?: HTMLElement | null) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    trigger.current = from ?? (document.activeElement as HTMLElement | null);
    setClosing(false);
    setKind(k);
    try {
      if (!isOurs(window.history.state)) window.history.pushState({ ...(window.history.state ?? {}), [KEY]: true }, "");
    } catch {
      /* history 를 쓸 수 없는 환경: 닫기 버튼만 동작 */
    }
  }, []);

  const close = useCallback(() => {
    if (isOurs(window.history.state)) window.history.back(); // popstate 에서 finishClose
    else finishClose();
  }, [finishClose]);

  useEffect(() => {
    const onPop = () => {
      if (!isOurs(window.history.state)) finishClose();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [finishClose]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  return { kind, setKind, closing, open, close };
}

/** 채팅 카드 → 채팅방 (카드 열기 · 운세 주제 고르기) */
export type ReadingActions = {
  open: (kind: ReadingKind, from?: HTMLElement | null) => void;
  chooseTopic: (id: TopicId) => void;
};

export const ReadingActionsContext = createContext<ReadingActions | null>(null);
export const useReadingActions = () => useContext(ReadingActionsContext);
