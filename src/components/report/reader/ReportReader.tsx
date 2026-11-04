"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LogoMark } from "@/components/reading/Frame";
import { READING_KINDS, type ReadingKind } from "@/components/reading/cards";
import { ReadingViewer } from "@/components/reading/ReadingViewer";
import { useReadingViewer } from "@/components/reading/useReadingViewer";
import { loadChat } from "@/features/chat/memory";
import { useReducedMotion } from "@/features/chat/hooks";
import { canRead, setDemoFull, useReportAccess } from "@/features/report/access";
import { buildMyReport, buildSampleReport } from "@/features/report/build";
import { pdfExporter } from "@/features/report/export";
import { reportHrefFor, takeReturn } from "@/features/report/handoff";
import { isChapterId, type ChapterId, type Report, type ReportId } from "@/features/report/types";
import { TOPICS, type TopicId } from "@/features/saju/topics";
import { isDemo } from "@/features/saju/types";
import { ReportTocSheet, useReveal } from "@/components/report/common";
import { ChapterView, LockedChapter, Sheet } from "./Chapter";

/* ──────────────────────────────────────────────────────────
   12챕터 종합 리포트 — /report/[reportId] · /report/[reportId]/chapter/[chapterId]
   한 문서 안에 12챕터를 이어 두고, 챕터 주소로 들어오면 그 위치로 이동
   - 위: ‹ · 공식 로고 · 목차 + 읽기 진행률, 지금 읽는 챕터 이름
   - 챕터: 공개 샘플(01 · 04)은 본문, 나머지는 담기는 내용까지 (데모 체험으로 전체 보기 가능 — 결제 아님)
   - 스크롤: 챕터 제목 · 카드가 한 번씩 부드럽게 등장, 위로 가기, 모션 줄이기면 즉시
   ────────────────────────────────────────────────────────── */

function useReport(reportId: ReportId): { report: Report | null; ready: boolean } {
  const [state, setState] = useState<{ report: Report | null; ready: boolean }>({ report: reportId === "sample" ? buildSampleReport() : null, ready: reportId === "sample" });
  useEffect(() => {
    if (reportId === "sample") return;
    // 상담 내용은 이 탭의 메모리에만 있음 → 브라우저에서만 읽음
    const chat = loadChat();
    setState({ report: chat ? buildMyReport(chat.profile, chat.consult.topic) : null, ready: true });
  }, [reportId]);
  return state;
}

const TOPIC_CHAPTER = (id: TopicId) => TOPICS[id].reportChapterId as ChapterId;

export function ReportReader({ reportId, chapterId = null }: { reportId: ReportId; chapterId?: string | null }) {
  const { report, ready } = useReport(reportId);
  const access = useReportAccess();
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState<ChapterId>("01");
  const [toc, setToc] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const viewer = useReadingViewer(reduced);
  const tocBtn = useRef<HTMLButtonElement>(null);
  const initial = chapterId && isChapterId(chapterId) ? chapterId : null;

  useReveal(`${ready}-${access.mode}`);

  // 처음 위치: 채팅에서 돌아왔으면 읽던 스크롤, 챕터 주소면 그 챕터
  const placed = useRef(false);
  useEffect(() => {
    if (!ready || !report || placed.current) return;
    placed.current = true;
    const back = takeReturn(reportId, initial);
    requestAnimationFrame(() => {
      if (back) window.scrollTo({ top: back.returnTo.scrollY, behavior: "auto" });
      else if (initial) document.getElementById(`ch-${initial}`)?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }, [ready, report, reportId, initial]);

  // 읽기 진행률 · 위로 가기
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
        setShowTop(window.scrollY > 900);
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [ready]);

  // 지금 읽는 챕터
  useEffect(() => {
    if (!report || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).map((e) => e.target.id.replace("ch-", ""));
        if (vis[0] && isChapterId(vis[0])) setCurrent(vis[0]);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    report.chapters.forEach((c) => {
      const el = document.getElementById(`ch-${c.id}`);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [report, access.mode]);

  const goChapter = useCallback(
    (id: ChapterId) => {
      setToc(false);
      const el = document.getElementById(`ch-${id}`);
      if (!el) return;
      el.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
      try {
        window.history.replaceState(window.history.state, "", reportHrefFor(reportId, id));
      } catch {
        /* 주소 갱신을 못 해도 이동은 됨 */
      }
      // 키보드 사용자를 위해 챕터 제목으로 포커스
      setTimeout(() => (document.getElementById(`ch-${id}-title`) as HTMLElement | null)?.focus({ preventScroll: true }), reduced ? 0 : 450);
    },
    [reduced, reportId],
  );

  const kinds = useMemo(() => [...READING_KINDS] as ReadingKind[], []);

  // 목차 시트 닫기 → inert 가 풀린 뒤 목차 버튼으로 포커스 (챕터를 골랐으면 그 챕터 제목으로)
  const tocRefocus = useRef(false);
  const closeToc = useCallback(() => {
    tocRefocus.current = true;
    setToc(false);
  }, []);
  useEffect(() => {
    if (toc || !tocRefocus.current) return;
    tocRefocus.current = false;
    tocBtn.current?.focus({ preventScroll: true });
  }, [toc]);

  if (!ready) return <div className="min-h-dvh bg-[#2e1c24]" aria-busy="true" />;

  if (!report)
    return (
      <div className="min-h-dvh bg-[#2e1c24] px-5 pt-[calc(env(safe-area-inset-top)+64px)] text-center text-white" style={{ fontFamily: "var(--font-sans)" }}>
        <div className="mx-auto flex max-w-[480px] flex-col items-center">
          <LogoMark width="9rem" />
          <h1 className="mt-6 font-serif text-[1.4rem] font-semibold">아직 상담 결과가 없어요</h1>
          <p className="mt-2 text-[15px] leading-[1.65] text-chat-muted [word-break:keep-all]">
            종합 리포트는 운결과의 상담에서 받은 정보로 만들어요. 상담 정보는 이 탭의 메모리에만 있어서, 새로고침하면 다시 상담해야 해요.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Link href="/chat" className="flex h-13 min-h-12 items-center justify-center rounded-full bg-[#f6e7dc] font-semibold text-[#3a1f2e]">
              운결과 상담하기
            </Link>
            <Link href="/report/sample" className="flex min-h-12 items-center justify-center rounded-full text-[15px] text-white shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)]">
              샘플 리포트 보기
            </Link>
          </div>
        </div>
      </div>
    );

  const r = report.payload;
  const cur = report.chapters.find((c) => c.id === current)!;

  return (
    <div className="relative min-h-dvh bg-[#2e1c24] text-white" style={{ fontFamily: "var(--font-sans)" }}>
      <div inert={viewer.kind !== null || toc}>
        {/* ── 위 ── */}
        <div className="sticky top-0 z-30 bg-[#2e1c24]/94 backdrop-blur-[6px]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="mx-auto grid h-14 max-w-[480px] grid-cols-[44px_1fr_44px] items-center gap-2 px-2">
            <Link href="/report" aria-label="리포트 소개로" className="grid size-11 place-items-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-chat-accent">
              <svg viewBox="0 0 15 29" fill="none" aria-hidden className="h-[18px] w-[10px]">
                <path d="M13 2 2.5 14.5 13 27" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <p className="truncate text-center text-[13px] leading-tight" aria-live="polite">
              <span className="block font-serif text-[15px] font-semibold">종합 리포트</span>
              <span className="text-chat-muted">
                {cur.id} · {cur.title}
              </span>
            </p>
            <button ref={tocBtn} type="button" onClick={() => setToc(true)} aria-label="목차 열기" aria-haspopup="dialog" className="grid size-11 place-items-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-chat-accent">
              <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
                <path d="M4 5.5h12M4 10h12M4 14.5h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div
            className="h-[3px] bg-white/10"
            role="progressbar"
            aria-label="읽기 진행률"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <div className="h-full origin-left bg-[#e8c9ac]" style={{ transform: `scaleX(${progress})` }} />
          </div>
        </div>

        <main className="mx-auto max-w-[480px] px-4 pb-[calc(env(safe-area-inset-bottom)+96px)]">
          {/* ── 표지 · 상태 ── */}
          <header className="animate-rise pt-7 text-center">
            <div className="flex justify-center">
              <LogoMark width="9.5rem" />
            </div>
            <p className="mt-2 font-serif text-[13px] tracking-[0.18em] text-[#e8c9ac]">{report.meta.subtitle}</p>
            <h1 className="mt-2 font-serif text-[1.75rem] font-semibold tracking-[-0.02em]">{report.meta.title}</h1>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[12px]">
              <span className="rounded-full bg-[#974d5e] px-2.5 py-1 font-semibold">{isDemo(r) ? "샘플 리포트 · 데모 사주" : "실제 만세력 계산"}</span>
              <span className="rounded-full px-2.5 py-1 shadow-[inset_0_0_0_1px_rgb(232_201_172/0.5)]">{reportId === "sample" ? "공개 샘플 (예시 MBTI " + (report.meta.basis.mbti ?? "") + ")" : "내 상담 기준"}</span>
              <span className="rounded-full px-2.5 py-1 shadow-[inset_0_0_0_1px_rgb(232_201_172/0.5)]">{access.mode === "demo-full" ? "데모 체험 · 전체 보기" : "공개 챕터 01 · 04"}</span>
            </div>
            <p className="mx-auto mt-4 max-w-[24rem] text-[14px] leading-[1.65] text-chat-muted [word-break:keep-all]">
              {isDemo(r) ? `${r.demo?.label ?? "데모 사주"}로 만든 리포트예요. 입력하신 생년월일로 계산한 결과가 아니고, 계산이 필요한 부분은 ‘미연결’로 비워 두었어요.` : ""}
              {reportId === "my" ? " MBTI · 출생 시간 · 상대 정보는 상담에서 알려주신 대로 반영했어요. 이름과 생년월일은 리포트에 표시하지 않아요." : ""}
            </p>
            <ul className="mx-auto mt-3 flex max-w-[24rem] flex-wrap justify-center gap-x-3 gap-y-1 text-[12.5px] text-chat-muted/90">
              <li>MBTI {report.meta.basis.mbti ?? "모름"}</li>
              <li>출생 시간 {report.meta.basis.timeUnknown ? "모름" : "있음"}</li>
              <li>상대 정보 {report.meta.basis.partner === "none" ? "없음" : "있음"}</li>
            </ul>
          </header>

          {/* ── 목차 (공개) ── */}
          <nav aria-label="리포트 목차" className="reveal mt-8">
            <Sheet className="px-4 pt-7 pb-4">
              <h2 className="text-center font-serif text-[18px] font-semibold text-[#4a1a2c]">목차</h2>
              <ol className="mt-3 divide-y divide-[#e6cdbd]">
                {report.chapters.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => goChapter(c.id)} className="flex min-h-12 w-full items-center gap-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-[#6e2a40]">
                      <span className="w-7 shrink-0 font-serif text-[14px] text-[#9a7647] tabular-nums">{c.id}</span>
                      <span className="min-w-0 flex-1 text-[15.5px] text-[#3a2229] [word-break:keep-all]">{c.title}</span>
                      <span className="shrink-0 text-[11.5px] text-[#7b6266]">{canRead(access, c.id) ? (c.access === "free" ? "공개" : "데모") : "잠김"}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </Sheet>
          </nav>

          {/* ── 챕터 ── */}
          <div className="mt-10 space-y-12">
            {report.chapters.map((c, i) => (
              <article key={c.id} id={`ch-${c.id}`} aria-labelledby={`ch-${c.id}-title`} className="scroll-mt-[76px]">
                {canRead(access, c.id) ? (
                  <ChapterView reportId={reportId} c={c} r={r} onOpenCard={(k, el) => viewer.open(k, el)} onTopic={(id) => goChapter(TOPIC_CHAPTER(id))} />
                ) : (
                  <LockedChapter c={c} onDemo={() => setDemoFull(true)} />
                )}
                {/* 다음 챕터 */}
                <div className="mt-4 flex justify-between gap-2">
                  {i > 0 ? (
                    <button type="button" onClick={() => goChapter(report.chapters[i - 1].id)} className="min-h-11 rounded-full px-3 text-[13.5px] text-chat-muted">
                      ‹ {report.chapters[i - 1].id} {report.chapters[i - 1].title}
                    </button>
                  ) : (
                    <span />
                  )}
                  {i < report.chapters.length - 1 && (
                    <button
                      type="button"
                      onClick={() => goChapter(report.chapters[i + 1].id)}
                      className="min-h-11 rounded-full bg-chat-chip px-4 text-[13.5px] text-white shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)]"
                      aria-label={`다음 챕터: ${report.chapters[i + 1].id} ${report.chapters[i + 1].title}`}
                    >
                      다음 · {report.chapters[i + 1].title} ›
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* ── 이용 안내 · 프리미엄 ── */}
          <section aria-labelledby="terms-title" className="reveal mt-12">
            <Sheet className="px-4 pt-7 pb-5">
              <h2 id="terms-title" className="text-center font-serif text-[18px] font-semibold text-[#4a1a2c]">
                프리미엄 리포트 안내
              </h2>
              <dl className="mt-3 space-y-2 text-[14.5px] leading-[1.6] [word-break:keep-all]">
                {[
                  ["가격", "아직 정하지 않았어요"],
                  ["결제", "연결되지 않았어요 · 지금은 구매할 수 없어요"],
                  ["열람 범위", "공개 챕터 01 · 04 는 무료, 나머지 10개 챕터는 프리미엄"],
                  ["환불 · 이용 조건", "판매를 시작하기 전에 확정해 이곳에 안내할 예정이에요"],
                  ["PDF 저장", pdfExporter.available ? "가능" : "준비 중 (결과 카드는 한 장씩 이미지로 저장할 수 있어요)"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3 border-b border-[#e6cdbd]/70 pb-2 last:border-b-0">
                    <dt className="w-[6.5em] shrink-0 font-semibold text-[#6e2a40]">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex flex-col gap-2">
                <button type="button" disabled aria-disabled="true" className="min-h-12 rounded-full bg-[#4a1a2c]/40 text-[15px] font-medium text-white/85">
                  구매하기 · 결제 준비 중
                </button>
                <button type="button" disabled aria-disabled="true" className="min-h-11 rounded-full text-[14px] text-[#7b6266] shadow-[inset_0_0_0_1px_#e6cdbd]">
                  전체 리포트 PDF 저장 · 준비 중
                </button>
                {access.mode === "demo-full" ? (
                  <button type="button" onClick={() => setDemoFull(false)} className="min-h-11 text-[13.5px] text-[#6e2a40] underline decoration-[#c9a27a] underline-offset-4">
                    데모 체험 끄기 (공개 챕터만 보기)
                  </button>
                ) : (
                  <button type="button" onClick={() => setDemoFull(true)} className="min-h-11 text-[13.5px] text-[#6e2a40] underline decoration-[#c9a27a] underline-offset-4">
                    데모로 전체 챕터 미리 보기 (결제 아님)
                  </button>
                )}
              </div>
              <p className="mt-2 text-center text-[12px] leading-[1.5] text-[#7b6266] [word-break:keep-all]">데모 체험은 화면 확인용이에요. 구매나 유료 권한이 아니며 새로고침하면 꺼져요.</p>
            </Sheet>
          </section>

          <div className="mt-8 flex flex-col items-center gap-2">
            <Link href="/chat" className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#f6e7dc] text-[15px] font-semibold text-[#3a1f2e]">
              운결과 대화로 돌아가기
            </Link>
          </div>
        </main>

        {/* 위로 가기 */}
        {showTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })}
            aria-label="맨 위로"
            className="fixed right-4 z-30 grid size-12 animate-panel-in place-items-center rounded-full bg-chat-chip text-white shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke),0_6px_18px_rgb(0_0_0/0.35)]"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 18px)" }}
          >
            <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
              <path d="m5 12 5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {toc && (
        <ReportTocSheet
          items={report.chapters.map((c) => ({ id: c.id, title: c.title, state: canRead(access, c.id) ? (c.access === "free" ? "공개" : "데모") : "잠김" }))}
          current={current}
          onPick={(id) => isChapterId(id) && goChapter(id)}
          onClose={closeToc}
        />
      )}

      {viewer.kind && (
        <ReadingViewer
          r={r}
          kinds={kinds}
          index={kinds.indexOf(viewer.kind)}
          closing={viewer.closing}
          onIndex={(i) => viewer.setKind(kinds[i])}
          onClose={viewer.close}
          onTopic={(id) => {
            viewer.close();
            setTimeout(() => goChapter(TOPIC_CHAPTER(id as TopicId)), reduced ? 0 : 260);
          }}
        />
      )}
    </div>
  );
}
