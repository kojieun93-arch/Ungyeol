"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LogoMark } from "@/components/reading/Frame";
import { READING_KINDS, type ReadingKind } from "@/components/reading/cards";
import { ReadingViewer } from "@/components/reading/ReadingViewer";
import { useReadingViewer } from "@/components/reading/useReadingViewer";
import {
  BackToTop,
  ChapterPager,
  ReportAccessGate,
  ReportChapter,
  ReportConsultationPrompt,
  ReportHero,
  ReportNavigation,
  ReportTableOfContents,
  ReportTerms,
  ReportTocSheet,

  useCurrentChapter,
  useReadingProgress,
  useReveal,
} from "@/components/report/common";
import { loadChat } from "@/features/chat/memory";
import { useReducedMotion } from "@/features/chat/hooks";
import { gateOf, setProductDemo, useProductAccess, type ChapterGate } from "@/features/products/access";
import { buildProductReport, buildProductSample, productHref } from "@/features/products/build";
import { sourceFromChat } from "@/features/products/source";
import type { ProductId, ProductReport } from "@/features/products/types";
import { productChatHref, saveReturn, takeReturn } from "@/features/report/handoff";
import type { ReportId } from "@/features/report/types";
import { isDemo } from "@/features/saju/types";
import { ProductVisualView } from "./ProductVisuals";
import { ShareBlock } from "./ShareBlock";

/* ──────────────────────────────────────────────────────────
   주제별 리포트 읽기 — /reports/[productId]/[sample|my] · …/chapter/[chapterId]
   7개 상품이 모두 이 화면 하나 + 공통 컴포넌트를 씀 (상품마다 다른 건 콘텐츠뿐)
   - my: 채팅 상담의 최근 결과 기준. 그 뒤 정보를 고쳤으면 '이전 정보 기준' 표시
   - 채팅에서 돌아오면 읽던 스크롤 위치로, 그 사이 정보가 바뀌었으면 알림
   ────────────────────────────────────────────────────────── */

type Loaded = { report: ProductReport | null; ready: boolean };

function useProductReport(id: ProductId, reportId: ReportId): Loaded {
  const [s, set] = useState<Loaded>(() => (reportId === "sample" ? { report: buildProductSample(id), ready: true } : { report: null, ready: false }));
  useEffect(() => {
    if (reportId === "sample") return;
    const chat = loadChat(); // 상담 내용은 이 탭의 메모리에만 → 브라우저에서만 읽음
    const got = chat ? sourceFromChat(chat, id) : null;
    set({ report: got ? buildProductReport(id, got.source, { epoch: got.epoch, stale: got.stale }) : null, ready: true });
  }, [id, reportId]);
  return s;
}

const GATE_LABEL: Record<ChapterGate, (free: boolean) => string> = {
  open: (free) => (free ? "공개" : "데모"),
  locked: () => "잠김",
  planned: () => "준비 중",
};

export function ProductReader({ productId, reportId, chapterId = null }: { productId: ProductId; reportId: ReportId; chapterId?: string | null }) {
  const { report, ready } = useProductReport(productId, reportId);
  const access = useProductAccess(productId);
  const reduced = useReducedMotion();
  const viewer = useReadingViewer(reduced);
  const [toc, setToc] = useState(false);
  const [changed, setChanged] = useState(false);
  const tocBtn = useRef<HTMLButtonElement>(null);
  const ids = useMemo(() => report?.chapters.map((c) => c.id) ?? [], [report]);
  const initial = chapterId && ids.includes(chapterId) ? chapterId : null;

  useReveal(`${ready}-${access.mode}-${productId}`);
  const { progress, showTop } = useReadingProgress(ready);
  const current = useCurrentChapter(ids, access.mode);

  // 처음 위치: 채팅에서 돌아왔으면 읽던 스크롤, 챕터 주소면 그 챕터
  const placed = useRef(false);
  useEffect(() => {
    if (!ready || !report || placed.current) return;
    placed.current = true;
    const back = takeReturn(reportId, initial, productId);
    if (back && report.source && back.epoch != null && back.epoch !== report.source.epoch) setChanged(true);
    requestAnimationFrame(() => {
      if (back) window.scrollTo({ top: back.returnTo.scrollY, behavior: "auto" });
      else if (initial) document.getElementById(`ch-${initial}`)?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }, [ready, report, reportId, initial, productId]);

  const goChapter = useCallback(
    (id: string) => {
      setToc(false);
      const el = document.getElementById(`ch-${id}`);
      if (!el) return;
      el.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
      try {
        window.history.replaceState(window.history.state, "", productHref(productId, reportId, id));
      } catch {
        /* 주소 갱신을 못 해도 이동은 됨 */
      }
      setTimeout(() => (document.getElementById(`ch-${id}-title`) as HTMLElement | null)?.focus({ preventScroll: true }), reduced ? 0 : 450);
    },
    [reduced, productId, reportId],
  );

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

  const kinds = useMemo(() => [...READING_KINDS] as ReadingKind[], []);

  if (!ready) return <div className="min-h-dvh bg-[#2e1c24]" aria-busy="true" />;

  if (!report) return <EmptyState productId={productId} />;

  const P = report.product;
  const r = report.payload;
  const free = P.previewAvailability.freeChapters;
  const gates = Object.fromEntries(report.chapters.map((c) => [c.id, gateOf(access, c)])) as Record<string, ChapterGate>;
  const items = report.chapters.map((c) => ({ id: c.id, title: c.title, state: GATE_LABEL[gates[c.id]](free.includes(c.id)) }));
  const cur = report.chapters.find((c) => c.id === current) ?? report.chapters[0];
  const demoAvailable = P.previewAvailability.fullDemo;

  return (
    <div className="relative min-h-dvh bg-[#2e1c24] text-white" style={{ fontFamily: "var(--font-sans)" }} data-product={productId} data-report={reportId}>
      <div inert={viewer.kind !== null || toc}>
        <ReportNavigation backHref={productHref(productId)} backLabel={`${P.title} 소개로`} title={P.title} current={`${cur.id} · ${cur.title}`} progress={progress} onToc={() => setToc(true)} tocRef={tocBtn} />

        <main className="mx-auto max-w-[480px] px-4 pb-[calc(env(safe-area-inset-bottom)+96px)]">
          <ReportHero
            subtitle="사주 × MBTI 주제별 리포트"
            title={P.title}
            badges={[
              { text: isDemo(r) ? "샘플 리포트 · 데모 사주" : "실제 만세력 계산", strong: true },
              { text: reportId === "sample" ? "공개 샘플 · 예시 상황" : "내 상담 기준" },
              { text: access.mode === "demo-full" ? "데모 체험 · 전체 보기" : `공개 챕터 ${free.join(" · ")}` },
              ...(P.previewAvailability.written === "structure" ? [{ text: "본문 준비 중 · 구조 공개" }] : []),
            ]}
            note={[
              isDemo(r) ? `${r.demo?.label ?? "데모 사주"}로 만든 리포트예요. 입력하신 생년월일로 계산한 결과가 아니고, 계산이 필요한 부분은 ‘미연결’ · ‘미확정’으로 비워 두었어요.` : "",
              reportId === "sample" ? " 예시 상황(가상의 두 사람)이며 실제 사람의 이야기가 아니에요." : " 상담에서 알려주신 내용을 반영했어요. 이름 · 생년월일 · 상대 생년월일은 표시하지 않아요.",
            ].join("")}
            basis={report.basis}
          />

          {report.source?.stale && (
            <div role="status" className="mt-5 rounded-2xl bg-[#f6e7dc] px-4 py-3.5 text-[14.5px] leading-[1.6] text-[#3a1f2e] [word-break:keep-all]" data-stale="true">
              <p className="font-semibold text-[#6e2a40]">이전 정보 기준의 리포트예요</p>
              <p className="mt-1">상담에서 정보를 고쳤어요. 이 리포트는 고치기 전 정보로 만들어졌어요. 상담에서 확인(‘맞아요’)을 마치면 새 정보로 다시 만들어져요.</p>
              <Link href="/chat" className="mt-2 inline-flex min-h-11 items-center font-semibold text-[#6e2a40] underline decoration-[#c9a27a] underline-offset-4">
                상담으로 돌아가 확인하기
              </Link>
            </div>
          )}
          {changed && !report.source?.stale && (
            <p role="status" className="mt-5 rounded-2xl bg-[#f6e7dc] px-4 py-3 text-[14.5px] leading-[1.6] text-[#3a1f2e] [word-break:keep-all]" data-changed="true">
              상담에서 정보가 바뀌어, 리포트를 새 정보로 다시 만들었어요. 읽던 내용과 달라졌을 수 있어요.
            </p>
          )}

          {/* 이 리포트가 알 수 없는 것 */}
          <aside aria-label="이 리포트의 한계" className="reveal mt-6 rounded-2xl px-4 py-3.5 text-[13.5px] leading-[1.6] text-chat-muted shadow-[inset_0_0_0_1px_rgb(232_201_172/0.35)] [word-break:keep-all]">
            <p className="font-semibold text-[#e8c9ac]">이 리포트가 알 수 없는 것</p>
            <p className="mt-1">{P.limits.join(" · ")}</p>
            <ul className="mt-2 space-y-0.5">
              {P.safety.slice(3).map((t) => (
                <li key={t}>· {t}</li>
              ))}
            </ul>
          </aside>

          <ReportTableOfContents items={items} onPick={goChapter} label={`${P.title} 목차`} />

          <div className="mt-10 space-y-12">
            {report.chapters.map((c, i) => {
              const g = gates[c.id];
              return (
                <article key={c.id} id={`ch-${c.id}`} aria-labelledby={`ch-${c.id}-title`} className="scroll-mt-[76px]" data-gate={g}>
                  {g === "open" ? (
                    <ReportChapter
                      c={c}
                      visuals={c.visuals.map((v, k) => (
                        <ProductVisualView key={k} v={v} r={r} />
                      ))}
                      cardButton={c.card ? { onOpen: (el) => viewer.open(c.card!, el) } : null}
                      prompt={
                        c.asks.length > 0 ? (
                          <ReportConsultationPrompt
                            href={productChatHref(productId, reportId, c.id)}
                            onLeave={() =>
                              saveReturn({
                                reportId,
                                chapterId: c.id,
                                productId,
                                topic: null,
                                returnTo: { path: productHref(productId, reportId, c.id), scrollY: window.scrollY },
                                epoch: report.source?.epoch ?? null,
                              })
                            }
                            note="미리 준비한 설명으로 답해요 · 실시간 AI 답변이 아니에요"
                          />
                        ) : null
                      }
                    />
                  ) : (
                    <ReportAccessGate c={c} state={g} onDemo={demoAvailable ? () => setProductDemo(productId, true) : null} />
                  )}
                  <ChapterPager prev={report.chapters[i - 1] ?? null} next={report.chapters[i + 1] ?? null} onGo={goChapter} />
                </article>
              );
            })}
          </div>

          <div className="mt-12 space-y-8">
            <ShareBlock productId={productId} reportId={reportId} title={P.title} />
            <ReportTerms
              rows={[
                ["가격", P.price.note],
                ["제공 내용", `${P.chapters.length}개 챕터 · 공개 샘플 ${free.join(" · ")}${P.previewAvailability.written === "structure" ? " (나머지 본문 준비 중)" : ""}`],
                ["결제", "연결되지 않았어요 · 지금은 구매할 수 없어요"],
                ["상태", access.mode === "demo-full" ? "판매 전 테스트 · 데모 체험 중 (구매 상태 아님)" : "판매 전 테스트 상태 (실제 구매 상태 아님)"],
                ["환불 · 이용 조건", "판매를 시작하기 전에 확정해 이곳에 안내할 예정이에요"],
                ["PDF 저장", "준비 중 (결과 카드는 한 장씩 이미지로 저장할 수 있어요)"],
              ]}
              demo={demoAvailable ? { on: access.mode === "demo-full", toggle: (on) => setProductDemo(productId, on) } : null}
            />
          </div>

          <div className="mt-8 flex flex-col items-center gap-2">
            <Link href="/reports" className="flex min-h-12 w-full items-center justify-center rounded-full text-[15px] text-white shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)]">
              다른 주제 리포트 보기
            </Link>
            <Link href="/chat" className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#f6e7dc] text-[15px] font-semibold text-[#3a1f2e]">
              운결과 대화로 돌아가기
            </Link>
          </div>
        </main>

        <BackToTop show={showTop} reduced={reduced} />
      </div>

      {toc && <ReportTocSheet items={items} current={current} onPick={goChapter} onClose={closeToc} />}

      {viewer.kind && (
        <ReadingViewer r={r} kinds={kinds} index={kinds.indexOf(viewer.kind)} closing={viewer.closing} onIndex={(i) => viewer.setKind(kinds[i])} onClose={viewer.close} onTopic={() => viewer.close()} />
      )}
    </div>
  );
}

function EmptyState({ productId }: { productId: ProductId }) {
  return (
    <div className="min-h-dvh bg-[#2e1c24] px-5 pt-[calc(env(safe-area-inset-top)+64px)] text-center text-white" style={{ fontFamily: "var(--font-sans)" }} data-empty="true">
      <div className="mx-auto flex max-w-[480px] flex-col items-center">
        <LogoMark width="9rem" />
        <h1 className="mt-6 font-serif text-[1.4rem] font-semibold">아직 상담 결과가 없어요</h1>
        <p className="mt-2 text-[15px] leading-[1.65] text-chat-muted [word-break:keep-all]">
          내 리포트는 운결과의 상담 결과로 만들어요. 상담을 끝까지 마치면 이 자리에 열려요. 상담 정보는 이 탭의 메모리에만 있어서, 새로고침하면 다시 상담해야 해요.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2">
          <Link href={`/chat?topic=${productId}`} className="flex min-h-12 items-center justify-center rounded-full bg-[#f6e7dc] font-semibold text-[#3a1f2e]">
            운결과 상담하기
          </Link>
          <Link href={productHref(productId, "sample")} className="flex min-h-12 items-center justify-center rounded-full text-[15px] text-white shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)]">
            샘플 리포트 보기
          </Link>
        </div>
      </div>
    </div>
  );
}

