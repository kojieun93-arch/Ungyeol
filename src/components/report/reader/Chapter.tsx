"use client";

import { ReportAccessGate, ReportChapter, ReportConsultationPrompt } from "@/components/report/common";
import { chatHrefFor, saveReturn } from "@/features/report/handoff";
import type { ReportChapter as Chapter, ReportId } from "@/features/report/types";
import type { ResultPayload } from "@/features/saju/types";
import type { TopicId } from "@/features/saju/topics";
import { Visual } from "./Visuals";

/* ──────────────────────────────────────────────────────────
   12챕터 종합 리포트의 챕터 — PHASE 5 부터 공통 컴포넌트(components/report/common)로 그림
   (주제별 리포트 7종과 같은 지면 · 섹션 · 운결의 한마디 · 열람 제한)
   ────────────────────────────────────────────────────────── */

export { Sheet } from "@/components/report/common";

export function AskButton({ reportId, c }: { reportId: ReportId; c: Chapter }) {
  return (
    <ReportConsultationPrompt
      href={chatHrefFor(reportId, c.id)}
      onLeave={() => saveReturn({ reportId, chapterId: c.id, topic: c.topic, returnTo: { path: `/report/${reportId}/chapter/${c.id}`, scrollY: window.scrollY } })}
    />
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
  c: Chapter;
  r: ResultPayload;
  onOpenCard?: (kind: NonNullable<Chapter["card"]>, el: HTMLElement) => void;
  onTopic?: (id: TopicId) => void;
}) {
  return (
    <ReportChapter
      c={c}
      visuals={c.visuals.map((v, i) => (
        <Visual key={i} v={v} r={r} onTopic={onTopic} />
      ))}
      cardButton={c.card && onOpenCard ? { onOpen: (el) => onOpenCard(c.card!, el) } : null}
      prompt={<AskButton reportId={reportId} c={c} />}
    />
  );
}

/** 잠긴 챕터 — 목차 · 핵심 질문 · 담기는 내용까지 */
export function LockedChapter({ c, onDemo }: { c: Chapter; onDemo: () => void }) {
  return <ReportAccessGate c={c} state="locked" onDemo={onDemo} />;
}
