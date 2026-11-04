"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatTime } from "@/features/chat/format";
import type { Message } from "@/features/chat/types";
import { ADVISOR_NAME, ChatAvatar } from "./ChatAvatar";
import { AdvisorCardView } from "./cards/AdvisorCardView";
import { READ, SPEC, u } from "./spec";

/*
  말풍선 — 디자인 원본 03-chat.png 실측
  상담자: 크림 #faede0, 반경 37, 좌우 31 / 상하 19.25, 글자 29.4 · 줄 41.5, 묶음 첫 말풍선 왼쪽 위 작은 꼬리
  사용자: #974d5e + 2px #c96f81 테두리, 반경 40, 오른쪽 아래 꼬리
  말풍선 사이 13, 묶음 사이 35, 시간은 묶음의 첫·마지막 말풍선 옆 (원본과 동일)
*/

type GroupProps = {
  first: boolean;
  last: boolean;
  animate?: boolean;
};

const B = SPEC.bubble;

/** 본문: 14~15px, 글꼴·굵기는 기존 그대로. 여백은 글자 크기 대비 원본 비율(em) */
const textStyle: CSSProperties = {
  fontSize: READ.body,
  lineHeight: READ.line,
  padding: `${READ.padY} ${READ.padX}`,
  fontWeight: 470,
  letterSpacing: "-0.01em",
  // 한국어 어절 단위 줄바꿈 + 마지막 줄에 한 단어만 남지 않게 (지원 브라우저)
  wordBreak: "keep-all",
  overflowWrap: "anywhere",
  textWrap: "pretty",
} as CSSProperties;

/**
 * 말풍선 폭을 '가장 긴 줄'에 맞춤.
 * CSS만으로는 줄바꿈된 inline-block 이 최대 폭을 그대로 차지하므로(원본과 달라짐),
 * 레이아웃 후 실제 줄 상자 폭을 재서 width 를 지정한다. 화면 폭이 바뀌면 다시 잰다.
 */
function useShrinkWrap<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.width = "";
      const range = document.createRange();
      range.selectNodeContents(el.querySelector("[data-text]") ?? el);
      let max = 0;
      for (const r of range.getClientRects()) max = Math.max(max, r.width);
      const cs = getComputedStyle(el);
      const extra = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
      if (max > 0) el.style.width = `${Math.ceil(max + extra + 0.5)}px`;
    };
    fit();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(el.parentElement ?? el);
    return () => ro?.disconnect();
  }, []);
  return ref;
}

function Time({ at }: { at: number }) {
  return (
    <time
      dateTime={new Date(at).toISOString()}
      className="shrink-0 leading-none text-chat-muted tabular-nums"
      style={{ fontSize: READ.time, marginBottom: "9px" }}
    >
      {formatTime(at)}
    </time>
  );
}

/** 상담자 말풍선 왼쪽 위 꼬리 (원본 183,358 → 말풍선 윗변으로 이어지는 작은 뿔) */
function AdvisorTail() {
  return (
    <svg aria-hidden viewBox="0 0 22 12" className="absolute text-chat-advisor" style={{ left: "-0.24em", top: "-0.03em", width: "0.95em", height: "0.51em" }}>
      <path d="M0 0.5C5 1 10 3 14 7L22 12H8C6 8 3.5 3.5 0 0.5Z" fill="currentColor" />
    </svg>
  );
}

/** 사용자 말풍선 오른쪽 아래 꼬리 */
function UserTail() {
  return (
    <svg aria-hidden viewBox="0 0 20 22" className="absolute" style={{ right: "-0.58em", bottom: "-0.05em", width: "0.85em", height: "0.92em" }}>
      <path d="M0 0C2 8 8 16 19 20.5C11 21.5 4 20 0 17Z" fill="var(--color-chat-user)" />
      <path d="M2 2.5C4 10 9.5 16.5 18 20.3" fill="none" stroke="var(--color-chat-user-rim)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 상담자 줄: [프로필] 이름 / 말풍선 + 시간 */
export function AdvisorRow({ first, last, at, children }: Omit<GroupProps, "animate"> & { at?: number; children: ReactNode }) {
  return (
    <div className="flex" style={{ gap: u(SPEC.avatar.gap), marginTop: first ? u(SPEC.groupGap) : u(B.gap) }}>
      <div className="shrink-0" style={{ width: u(SPEC.avatar.d) }}>
        {first && <ChatAvatar />}
      </div>
      <div className="min-w-0 flex-1">
        {first && (
          <p className="leading-[1.25] font-medium text-chat-text" style={{ fontSize: READ.name, marginTop: u(SPEC.name.mt), marginBottom: "6px" }}>
            {ADVISOR_NAME}
          </p>
        )}
        <div className="flex items-end" style={{ gap: u(SPEC.time.gap) }}>
          {children}
          {(first || last) && at !== undefined && <Time at={at} />}
        </div>
      </div>
    </div>
  );
}

export function ChatMessage({ message, first, last, animate = true, stale = false }: GroupProps & { message: Message; stale?: boolean }) {
  const enter = animate && "animate-msg-in";
  const wrapRef = useShrinkWrap<HTMLParagraphElement>();

  if (message.from === "user") {
    const ub = SPEC.userBubble;
    return (
      <div className="flex items-end justify-end" style={{ gap: u(16), marginTop: first ? u(SPEC.groupGap) : u(B.gap), paddingRight: u(14) }}>
        {(first || last) && <Time at={message.at} />}
        <p
          ref={wrapRef}
          className={cn("relative min-w-0 whitespace-pre-line bg-chat-user text-chat-user-ink", enter)}
          style={{
            ...textStyle,
            padding: `${READ.padY} ${READ.userPadX}`,
            borderRadius: READ.userRadius,
            border: `max(${u(ub.border)}, 1px) solid var(--color-chat-user-rim)`,
            maxWidth: READ.maxW,
          }}
        >
          <span className="sr-only">나: </span>
          <span data-text>{message.text}</span>
          {last && <UserTail />}
        </p>
      </div>
    );
  }

  return (
    // 카드에는 옆 시간 표시를 두지 않아 카드가 폭을 모두 씀
    <AdvisorRow first={first} last={last} at={message.kind === "text" ? message.at : undefined}>
      {message.kind === "text" ? (
        <p
          ref={wrapRef}
          className={cn("relative min-w-0 whitespace-pre-line bg-chat-advisor text-chat-advisor-ink", enter)}
          style={{
            ...textStyle,
            borderRadius: READ.radius,
            maxWidth: READ.maxW,
            boxShadow: `inset 0 ${u(1.5)} 0 var(--color-chat-advisor-rim), 0 0 0 ${u(1.2)} rgb(30 12 20 / 0.35)`,
          }}
        >
          {first && <AdvisorTail />}
          <span data-text>{message.text}</span>
        </p>
      ) : (
        <div className={cn("min-w-0 flex-1", enter)}>
          <AdvisorCardView card={message.card} arg={message.arg} profile={message.profile} context={message.context} stale={stale} />
        </div>
      )}
    </AdvisorRow>
  );
}
