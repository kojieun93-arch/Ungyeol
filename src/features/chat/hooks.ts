"use client";

import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState, type RefObject } from "react";
import { chatReducer, initChat, type ChatAction, type ChatState } from "./reducer";
import { loadChat, saveChat } from "./memory";
import { beforeTyping, TIMING, typingDuration } from "./timing";
import type { ConsultTopic } from "./types";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** prefers-reduced-motion 구독 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/**
 * 메시지 시퀀서
 * queue 머리 하나만 바라보는 단일 타이머. 상태가 바뀌면 이전 타이머는 cleanup에서 정리되고,
 * reducer가 id로 중복을 걸러내므로 StrictMode 이중 실행에도 메시지가 두 번 나오지 않습니다.
 */
export type Restored = { session: number; count: number };

export function useChatSequencer(topic: ConsultTopic | null = null): [ChatState, (a: ChatAction) => void, Restored] {
  // 앱 안에서 돌아온 경우 메모리의 대화를 이어서 (정책: memory.ts). 처음이면 홈에서 고른 주제로 시작
  const [state, dispatch] = useReducer(chatReducer, 1, (s) => loadChat() ?? initChat(s, topic));
  // 재진입 시 이미 보였던 메시지 — 같은 세션의 이 메시지들은 등장 애니메이션 없이 표시
  const [restored] = useState<Restored>(() => ({ session: state.session, count: state.messages.length }));
  const reduced = useReducedMotion();
  const head = state.queue[0];
  const typing = !!head && state.typingId === head.id;
  const isFirstEver = state.messages.length === 0;

  useEffect(() => {
    if (!head) return;
    const factor = reduced ? TIMING.reducedFactor : 1;
    const timer = typing
      ? setTimeout(() => dispatch({ type: "deliver", id: head.id, at: Date.now() }), typingDuration(head, isFirstEver) * factor)
      : setTimeout(() => dispatch({ type: "typing", id: head.id }), beforeTyping(head, isFirstEver) * factor);
    return () => clearTimeout(timer);
    // head 객체가 아니라 id로 의존 — 같은 메시지에 대해 타이머를 다시 만들지 않음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [head?.id, typing, reduced]);

  useEffect(() => {
    saveChat(state);
  }, [state]);

  return [state, dispatch, restored];
}

/**
 * 자동 스크롤
 * - 사용자가 맨 아래 근처(72px)에 있을 때만 새 메시지로 따라 내려감
 * - 위로 올려 읽는 중이면 건드리지 않고, 놓친 메시지 수를 알려줌
 * - 하단 답변 영역 높이가 바뀌어 화면이 줄어들 때도 바닥 유지
 */
export function useAutoScroll(ref: RefObject<HTMLElement | null>, deps: unknown[], reduced: boolean) {
  const atBottom = useRef(true);
  const [unread, setUnread] = useState(0);
  const lastCount = useRef(0);
  const mounted = useRef(false);

  const scrollToBottom = useCallback(
    (smooth = true) => {
      const el = ref.current;
      if (!el) return;
      atBottom.current = true;
      setUnread(0);
      el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduced ? "smooth" : "auto" });
    },
    [ref, reduced],
  );

  // 스크롤 위치 추적
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const near = el.scrollHeight - el.scrollTop - el.clientHeight < 72;
      atBottom.current = near;
      if (near) setUnread(0);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [ref]);

  // 내용 변화 → 바닥이면 따라가기, 아니면 안 읽은 수 증가
  useIsoLayoutEffect(() => {
    const [count] = deps as [number];
    const added = count - lastCount.current;
    lastCount.current = count;
    // 첫 렌더(재진입 포함)는 즉시 바닥으로, 이후에는 부드럽게
    if (!mounted.current) {
      mounted.current = true;
      if (count > 0) scrollToBottom(false);
      return;
    }
    if (atBottom.current) scrollToBottom(true);
    else if (added > 0) setUnread((n) => n + added);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // 컨테이너 크기 변화(키보드, 하단 패널) → 바닥 유지
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (atBottom.current) el.scrollTo({ top: el.scrollHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return { unread, scrollToBottom };
}

/**
 * 모바일 키보드 대응 (iOS Safari · Android Chrome)
 * - visualViewport 의 높이·위치를 CSS 변수(--vv-height, --vv-top)로 노출
 *   → 채팅 화면(position: fixed)이 '보이는 영역'에 딱 맞춰져 입력창·전송 버튼이 키보드 위에 남음
 * - 키보드 열림 판정: 지금까지 본 가장 큰 높이보다 120px 이상 줄어들면 (iOS·Android 공통)
 *   열리면 html[data-keyboard=open] → 하단 safe-area 여백을 줄임
 * - 채팅 화면이 떠 있는 동안 문서 자체 스크롤을 막아, 키보드가 열릴 때 화면 전체가 밀려 올라가지 않게 함
 * - 키보드가 닫힌 뒤 iOS 가 남겨 둔 문서 스크롤 위치를 되돌림
 */
export function useVisualViewportVars() {
  useEffect(() => {
    const vv = window.visualViewport;
    const root = document.documentElement;
    const body = document.body;
    const prev = { html: root.style.overflow, body: body.style.overflow, ob: root.style.overscrollBehavior };
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    if (!vv) {
      return () => {
        root.style.overflow = prev.html;
        body.style.overflow = prev.body;
        root.style.overscrollBehavior = prev.ob;
      };
    }

    let frame = 0;
    let maxH = vv.height;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        maxH = Math.max(maxH, vv.height);
        const open = maxH - vv.height > 120;
        root.style.setProperty("--vv-height", `${vv.height}px`);
        root.style.setProperty("--vv-top", `${vv.offsetTop}px`);
        root.dataset.keyboard = open ? "open" : "closed";
        if (!open && window.scrollY !== 0) window.scrollTo(0, 0);
      });
    };
    // 화면 회전 시 기준 높이 다시 잡기
    const onOrientation = () => {
      maxH = 0;
      update();
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", onOrientation);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", onOrientation);
      root.style.removeProperty("--vv-height");
      root.style.removeProperty("--vv-top");
      delete root.dataset.keyboard;
      root.style.overflow = prev.html;
      body.style.overflow = prev.body;
      root.style.overscrollBehavior = prev.ob;
    };
  }, []);
}
