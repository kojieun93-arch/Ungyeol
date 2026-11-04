import type { ReactNode } from "react";
import { C } from "@/components/reading/Frame";
import type { DataSlot, ReportInsight, ReportSection as Sec } from "@/features/report/types";
import { ReportInsightCard } from "./ReportInsightCard";
import { ReportSection, SlotBadge } from "./ReportSection";
import { LockIcon, Sheet } from "./Sheet";

/* ──────────────────────────────────────────────────────────
   챕터 한 장 (종합 리포트 · 7개 주제별 리포트 공용)
   제목 · 핵심 질문 · 요약은 가운데, 긴 본문은 왼쪽 정렬 (16px, 줄간격 1.75)
   순서: 요약 → 데이터 상태 → 앞쪽 섹션 → 시각 자료 → 카드 크게 보기 → 운결에게 묻기 → 뒤쪽 섹션 → 한마디 · 실천
   ────────────────────────────────────────────────────────── */

export type ChapterLike = {
  id: string;
  title: string;
  question: string;
  summary: string;
  access: "free" | "premium";
  dataSlot: DataSlot;
  sections: Sec[];
  insight: ReportInsight;
};

export function ChapterHead({ c, locked }: { c: Pick<ChapterLike, "id" | "title" | "question" | "access">; locked?: boolean }) {
  return (
    <header className="reveal text-center">
      <span
        className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-serif text-[12.5px] font-medium tracking-[0.12em] text-[#fff4e8]"
        style={{ background: "linear-gradient(180deg,#81394f,#5a2336)", boxShadow: `0 0 0 1px ${C.gold}` }}
      >
        CHAPTER {c.id}
        {c.access === "free" ? <span className="rounded-full bg-[#f6e7dc] px-1.5 text-[10.5px] tracking-normal text-[#4a1a2c]">공개 샘플</span> : locked ? <LockIcon /> : null}
      </span>
      <h2 id={`ch-${c.id}-title`} tabIndex={-1} className="mt-3 font-serif outline-none text-[clamp(1.45rem,6vw,1.75rem)] leading-[1.3] font-semibold tracking-[-0.02em] text-[#4a1a2c] [word-break:keep-all]">
        {c.title}
      </h2>
      <p className="mx-auto mt-2 max-w-[22rem] font-serif text-[15.5px] leading-[1.6] text-[#6e2a40] [word-break:keep-all]">“{c.question}”</p>
    </header>
  );
}

export function ReportChapter({
  c,
  visuals,
  cardButton,
  prompt,
}: {
  c: ChapterLike;
  /** 시각 자료 (상품마다 다른 종류 → 바깥에서 그려서 넘김) */
  visuals?: ReactNode;
  /** 결과 카드 크게 보기 · 이미지 저장 */
  cardButton?: { onOpen: (el: HTMLElement) => void } | null;
  /** 운결에게 더 물어보기 */
  prompt?: ReactNode;
}) {
  const half = Math.ceil(c.sections.length / 2);
  return (
    <Sheet className="px-4 pt-8 pb-6">
      <ChapterHead c={c} />
      <div className="reveal mx-auto mt-5 max-w-[24rem] rounded-xl bg-white/60 px-4 py-3 text-center shadow-[0_0_0_1px_#e6cdbd]">
        <p className="text-[12px] font-semibold tracking-[0.08em] text-[#9a7647]">한눈에 보기</p>
        <p className="mt-1 font-serif text-[16px] leading-[1.65] text-[#4a1a2c] [word-break:keep-all]">{c.summary}</p>
      </div>
      <div className="mt-5 space-y-6">
        <SlotBadge slot={c.dataSlot} />
        {c.sections.slice(0, half).map((s) => (
          <ReportSection key={s.id} s={s} />
        ))}
        {visuals}
        {cardButton && (
          <button
            type="button"
            onClick={(e) => cardButton.onOpen(e.currentTarget)}
            className="reveal flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-[14px] font-medium text-[#6e2a40] shadow-[inset_0_0_0_1.5px_#c9a27a] focus-visible:outline-2 focus-visible:outline-[#6e2a40]"
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
              <path d="M12 3.5h4.5V8M8 16.5H3.5V12M16.5 3.5 11.5 8.5M3.5 16.5l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            결과 카드 크게 보기 · 이미지 저장
          </button>
        )}
        {prompt}
        {c.sections.slice(half).map((s) => (
          <ReportSection key={s.id} s={s} />
        ))}
        <ReportInsightCard insight={c.insight} />
      </div>
    </Sheet>
  );
}
