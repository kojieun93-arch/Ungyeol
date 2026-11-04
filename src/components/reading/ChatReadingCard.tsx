"use client";

import { useMemo, useRef } from "react";
import { resultFor } from "@/features/chat/consultation";
import type { Profile } from "@/features/chat/types";
import { useLive } from "@/features/saju/live";
import type { ReadingResult } from "@/features/saju/types";
import { CARD_COMPONENT, READING_META, type ReadingKind } from "./cards";
import { useReadingActions } from "./useReadingViewer";

/** 프로필 → 결과 카드 데이터 (features/chat/consultation.ts) */
export function readingForProfile(profile: Profile): ReadingResult {
  return resultFor(profile);
}

/** 채팅 안 요약 카드 — 카드를 누르거나 오른쪽 위 확대 버튼으로 전체 화면 */
export function ChatReadingCard({ kind, profile, stale = false }: { kind: ReadingKind; profile: Profile; stale?: boolean }) {
  const live = useLive(profile);
  const r = useMemo(() => resultFor(profile, undefined, live.entry), [profile, live.entry]);
  // 실제 계산을 쓸 수 있는 상태에서 계산 중이면 샘플을 먼저 보여 주지 않음
  const waiting = live.mode === "unknown" || (live.mode === "live" && (!live.entry || live.entry.phase === "loading"));
  const actions = useReadingActions();
  const btn = useRef<HTMLButtonElement>(null);
  const Card = CARD_COMPONENT[kind];
  const title = READING_META[kind].title;

  const expand = (
    <button
      ref={btn}
      type="button"
      aria-label={`${title} 크게 보기`}
      onClick={(e) => {
        e.stopPropagation();
        actions?.open(kind, btn.current);
      }}
      className="grid size-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-chat-accent"
    >
      <span className="grid size-[30px] place-items-center rounded-full bg-[#2c1720]/70 text-[#f3dcc4] shadow-[inset_0_0_0_1px_rgb(232_201_172/0.6)]">
        <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
          <path d="M12 3.5h4.5V8M8 16.5H3.5V12M16.5 3.5 11.5 8.5M3.5 16.5l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );

  if (waiting && !stale)
    return (
      <article aria-label={`${title} (계산 중)`} aria-busy="true" className="w-full rounded-[1.26em] bg-chat-advisor px-4 py-5 text-center text-[14px] text-chat-advisor-soft" data-live="loading">
        만세력을 계산하고 있어요…
      </article>
    );

  const fallbackNote = live.entry?.phase === "fallback" ? live.entry.reason : null;

  // 정보를 고치기 전의 결과: 흐리게 + 안내, 크게 보기 · 주제 버튼 없음
  if (stale)
    return (
      <article aria-label={`${title} (이전 정보 기준)`} className="relative w-full">
        <div aria-hidden className="pointer-events-none opacity-45 grayscale-[35%]">
          <Card r={r} mode="chat" />
        </div>
        <p className="absolute inset-x-3 top-3 rounded-full bg-[#2c1720]/90 px-3 py-2 text-center text-[12.5px] leading-snug text-white shadow-[inset_0_0_0_1px_rgb(232_201_172/0.5)]">
          정보를 고치기 전의 결과예요
        </p>
      </article>
    );

  return (
    // 카드 아무 곳이나 눌러도 열림 (키보드는 확대 버튼으로)
    <article aria-label={title} className="w-full cursor-zoom-in" onClick={() => actions?.open(kind, btn.current)} data-live={r.resultStatus === "calculated" ? "calculated" : "sample"}>
      {fallbackNote && kind === "manse" && (
        <p className="mb-2 rounded-[0.9em] bg-[#2c1720]/80 px-3 py-2 text-[12.5px] leading-snug text-[#f3dcc4]" role="note">
          {fallbackNote}
        </p>
      )}
      <Card r={r} mode="chat" action={expand} onTopic={actions ? (id) => actions.chooseTopic(id) : undefined} />
    </article>
  );
}
