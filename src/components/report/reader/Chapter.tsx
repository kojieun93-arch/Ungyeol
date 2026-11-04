"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Knot } from "@/components/reading/icons";
import { C } from "@/components/reading/Frame";
import { chatHrefFor, saveReturn } from "@/features/report/handoff";
import type { DataSlot, ReportChapter, ReportId, ReportSection } from "@/features/report/types";
import type { ResultPayload } from "@/features/saju/types";
import type { TopicId } from "@/features/saju/topics";
import { Visual } from "./Visuals";

/* ──────────────────────────────────────────────────────────
   챕터 한 장 — 결과 카드와 같은 재료 (크림 지면 · 금빛 이중 테두리 · 윗변 매듭 · 버건디 제목)
   제목 · 핵심 질문 · 요약은 가운데, 긴 본문은 왼쪽 정렬 (16px, 줄간격 1.75)
   ────────────────────────────────────────────────────────── */

const ADVISOR = "/images/ungyeol-advisor.webp";

export function Sheet({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-[1.4rem] bg-[#fbf2e8] text-[#3a2229] ${className}`}
      style={{ boxShadow: `0 0 0 1.5px ${C.gold}, inset 0 0 0 5px #fbf2e8, inset 0 0 0 6px rgb(211 171 124 / 0.5)` }}
    >
      <Knot className="absolute left-1/2 size-6 -translate-x-1/2" style={{ top: "-12px" }} />
      {children}
    </div>
  );
}

function ChapterHead({ c, locked }: { c: ReportChapter; locked?: boolean }) {
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

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-label="잠김" role="img">
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

function SlotBadge({ slot }: { slot: DataSlot }) {
  const tone = slot.status === "demo" ? "bg-[#974d5e]/10 text-[#6e2a40] shadow-[inset_0_0_0_1px_rgb(151_77_94/0.3)]" : "bg-[#efe3d0] text-[#6b4f2a] shadow-[inset_0_0_0_1px_rgb(155_118_71/0.4)]";
  return (
    <div role="note" className={`reveal rounded-xl px-3.5 py-3 text-[13.5px] leading-[1.6] [word-break:keep-all] ${tone}`} data-slot={slot.status}>
      <p className="flex items-center gap-1.5 font-semibold">
        <span aria-hidden className={`size-2 rounded-full ${slot.status === "demo" ? "bg-[#974d5e]" : "bg-[#9a7647]"}`} />
        {slot.status === "demo" ? "샘플" : slot.status === "unconnected" ? "미연결" : "정보 필요"} · {slot.label}
      </p>
      {slot.detail && <p className="mt-1">{slot.detail}</p>}
      {slot.needs && slot.needs.length > 0 && <p className="mt-1 text-[12.5px] opacity-85">필요한 것 · {slot.needs.join(" · ")}</p>}
    </div>
  );
}

function Section({ s }: { s: ReportSection }) {
  return (
    <section className="reveal" aria-labelledby={`sec-${s.id}`}>
      <h3 id={`sec-${s.id}`} className="flex items-center gap-2 font-serif text-[17px] font-semibold text-[#4a1a2c]">
        <span aria-hidden className="size-[7px] rotate-45 bg-[#b88a57]" />
        {s.title}
      </h3>
      <div className="mt-2 space-y-2.5 text-[16px] leading-[1.75] [word-break:keep-all]">
        {s.body.map((b) => (
          <p key={b}>{b}</p>
        ))}
        {s.list && (
          <ul className="space-y-1.5">
            {s.list.map((t) => (
              <li key={t} className="flex gap-2">
                <span aria-hidden className="mt-[0.72em] size-1.5 shrink-0 rounded-full bg-[#974d5e]" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}
        {s.more && (
          <details className="report-more group rounded-xl bg-white/55 shadow-[0_0_0_1px_#e6cdbd]">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 px-3.5 text-[14px] font-medium text-[#6e2a40]">
              더 알아보기
              <svg viewBox="0 0 20 20" className="size-4 transition-transform group-open:rotate-180" fill="none" aria-hidden>
                <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="space-y-2 px-3.5 pb-3.5 text-[15px] leading-[1.7]">
              {s.more.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </details>
        )}
      </div>
    </section>
  );
}

function AdvisorNote({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <div className="reveal flex gap-2.5" role="note" aria-label="운결의 한마디">
      {/* eslint-disable-next-line @next/next/no-img-element -- 확정된 상담자 프로필 (작게) */}
      <img src={ADVISOR} alt="" aria-hidden width={36} height={36} className="size-9 shrink-0 rounded-full object-cover shadow-[0_0_0_1.5px_#c9838f]" />
      <div className="min-w-0">
        <p className="mb-1 text-[12px] font-semibold text-[#6e2a40]">운결의 한마디</p>
        <div className="space-y-1.5">
          {lines.map((l) => (
            <p key={l} className="w-fit max-w-full rounded-[1.1em] rounded-tl-[0.35em] bg-white px-3.5 py-2 text-[15px] leading-[1.55] shadow-[0_0_0_1px_#e6cdbd] [word-break:keep-all]">
              {l}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AskButton({ reportId, c }: { reportId: ReportId; c: ReportChapter }) {
  return (
    <Link
      href={chatHrefFor(reportId, c.id)}
      onClick={() =>
        saveReturn({ reportId, chapterId: c.id, topic: c.topic, returnTo: { path: `/report/${reportId}/chapter/${c.id}`, scrollY: window.scrollY } })
      }
      className="reveal flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#4a1a2c] px-5 text-[15px] font-medium text-[#fff4e8] shadow-[0_0_0_1px_#d3ab7c] active:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6e2a40]"
    >
      <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" aria-hidden>
        <path d="M10 3.5c3.9 0 7 2.5 7 5.7s-3.1 5.7-7 5.7c-.8 0-1.5-.1-2.2-.3L4.5 16l.8-2.8C3.9 12.2 3 10.8 3 9.2 3 6 6.1 3.5 10 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      운결에게 더 물어보기
    </Link>
  );
}

/** 읽을 수 있는 챕터 */
export function ChapterView({
  reportId,
  c,
  r,
  onOpenCard,
  onTopic,
}: {
  reportId: ReportId;
  c: ReportChapter;
  r: ResultPayload;
  onOpenCard?: (kind: NonNullable<ReportChapter["card"]>, el: HTMLElement) => void;
  onTopic?: (id: TopicId) => void;
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
          <Section key={s.id} s={s} />
        ))}
        {c.visuals.map((v, i) => (
          <Visual key={i} v={v} r={r} onTopic={onTopic} />
        ))}
        {c.card && onOpenCard && (
          <button
            type="button"
            onClick={(e) => onOpenCard(c.card!, e.currentTarget)}
            className="reveal flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-[14px] font-medium text-[#6e2a40] shadow-[inset_0_0_0_1.5px_#c9a27a] focus-visible:outline-2 focus-visible:outline-[#6e2a40]"
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
              <path d="M12 3.5h4.5V8M8 16.5H3.5V12M16.5 3.5 11.5 8.5M3.5 16.5l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            결과 카드 크게 보기 · 이미지 저장
          </button>
        )}
        <AskButton reportId={reportId} c={c} />
        {c.sections.slice(half).map((s) => (
          <Section key={s.id} s={s} />
        ))}
        <AdvisorNote lines={c.insight.advisor} />
        {(c.insight.practice || c.insight.questions.length > 0) && (
          <div className="reveal rounded-xl bg-[#f3e2d8]/70 px-4 py-3.5">
            {c.insight.practice && (
              <>
                <p className="text-[12.5px] font-semibold text-[#6e2a40]">작은 실천</p>
                <p className="mt-1 text-[15.5px] leading-[1.65] [word-break:keep-all]">{c.insight.practice}</p>
              </>
            )}
            {c.insight.questions.length > 0 && (
              <>
                <p className={`text-[12.5px] font-semibold text-[#6e2a40] ${c.insight.practice ? "mt-3" : ""}`}>나에게 묻는 질문</p>
                <ul className="mt-1 space-y-1 text-[15.5px] leading-[1.65] [word-break:keep-all]">
                  {c.insight.questions.map((q) => (
                    <li key={q}>· {q}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}

/** 잠긴 챕터 — 목차 · 핵심 질문 · 한 줄 요약 · 담기는 내용까지 */
export function LockedChapter({ c, onDemo }: { c: ReportChapter; onDemo: () => void }) {
  return (
    <Sheet className="px-4 pt-8 pb-6">
      <ChapterHead c={c} locked />
      <div className="reveal mt-5 rounded-xl bg-white/60 px-4 py-3.5 shadow-[0_0_0_1px_#e6cdbd]">
        <p className="text-[12.5px] font-semibold text-[#6e2a40]">이 챕터에 담기는 내용</p>
        <ul className="mt-1.5 space-y-1 text-[15px] leading-[1.6]">
          {c.includes.map((t) => (
            <li key={t} className="flex gap-2">
              <span aria-hidden className="mt-[0.65em] size-1.5 shrink-0 rotate-45 bg-[#b88a57]" />
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-[#e6cdbd] pt-2.5 text-[13px] leading-[1.55] text-[#7b6266] [word-break:keep-all]">
          지금 읽을 수 있는 범위 · 챕터 제목 · 핵심 질문 · 담기는 내용. 본문은 프리미엄 리포트에 들어가요.
        </p>
      </div>
      <div className="reveal mt-4 flex flex-col gap-2">
        <button type="button" disabled aria-disabled="true" className="min-h-12 rounded-full bg-[#4a1a2c]/40 text-[15px] font-medium text-white/85">
          프리미엄 리포트 · 결제 준비 중
        </button>
        <button type="button" onClick={onDemo} className="min-h-11 rounded-full text-[13.5px] text-[#6e2a40] underline decoration-[#c9a27a] underline-offset-4">
          데모로 전체 챕터 미리 보기 (결제 아님)
        </button>
      </div>
    </Sheet>
  );
}
