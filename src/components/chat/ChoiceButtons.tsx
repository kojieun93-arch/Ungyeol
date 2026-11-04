"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ChoiceOption } from "@/features/chat/types";

/*
  선택형 답변 — 원본에는 없는 요소라 원본 칩의 재료(분홍 테두리 · 플럼 면 · 흰 글씨 · 완전한 둥근 모서리)로 구성.
  답변은 사용자 쪽(오른쪽)에 붙여 '내가 할 말'로 읽히게 하고, 터치 영역은 44px 이상.
*/
const base =
  "inline-flex min-h-11 max-w-full items-center justify-center rounded-full bg-chat-chip px-4 py-2 text-center text-[0.875rem] font-medium leading-snug text-white " +
  "shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)] transition-[filter,scale] duration-200 active:scale-[0.985] active:brightness-125 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-accent";

export function ChoiceButtons({ options, onChoose }: { options: ChoiceOption[]; onChoose: (o: ChoiceOption) => void }) {
  const items = options.map((o) =>
    o.href ? (
      <Link key={o.label} href={o.href} className={cn(base, "shrink-0 snap-start whitespace-nowrap")}>
        {o.label}
      </Link>
    ) : (
      <button key={o.label} type="button" onClick={() => onChoose(o)} className={cn(base, "shrink-0 snap-start whitespace-nowrap")}>
        {o.label}
      </button>
    ),
  );

  // 선택지가 많으면(운세 주제 8개) 한 줄 가로 스크롤 — 대화 내용을 가리지 않도록
  if (options.length > 3) {
    return (
      <div
        role="group"
        aria-label="답변 선택"
        className="no-scrollbar animate-panel-in snap-x overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,#000_calc(100%-24px),transparent)]"
      >
        {/* 넘치면 왼쪽부터 시작해 오른쪽으로 넘겨 보고, 넘치지 않으면 오른쪽 정렬 */}
        <div className="ml-auto flex w-max gap-2 pr-6">{items}</div>
      </div>
    );
  }

  return (
    <div role="group" aria-label="답변 선택" className="flex animate-panel-in flex-col items-end gap-2">
      {items}
    </div>
  );
}
