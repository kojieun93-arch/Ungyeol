"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { ReadingResult } from "@/features/saju/types";
import { CARD_COMPONENT, READING_META, type ReadingKind } from "./cards";
import { ReadingDetails, SampleBanner } from "./details";
import { ShareSheet } from "./ShareSheet";

/* ──────────────────────────────────────────────────────────
   결과 카드 전체 화면
   - 위: 닫기 · 카드 이름 · n / 6
   - 가운데(세로 스크롤): 원본 디자인 카드(full) + 상세 해석
   - 아래: ‹ 이전 · 이미지로 저장 · 공유하기 · 다음 ›
   - 열려 있는 동안 뒤 채팅은 inert, 대화 상태·스크롤 위치는 그대로 (닫으면 원래 자리)
   - Esc · 닫기 · 브라우저 뒤로가기 모두 같은 닫기 (useReadingViewer 가 history 와 맞춤)
   ────────────────────────────────────────────────────────── */

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';

export function ReadingViewer({
  r,
  kinds,
  index,
  closing,
  onIndex,
  onClose,
  onTopic,
}: {
  r: ReadingResult;
  kinds: ReadingKind[];
  index: number;
  closing: boolean;
  onIndex: (i: number) => void;
  onClose: () => void;
  onTopic?: (id: ReadingResult["integratedInsight"]["topics"][number]["id"]) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [dir, setDir] = useState<"next" | "prev" | null>(null);
  const [sheet, setSheet] = useState<null | "save" | "share">(null);
  const kind = kinds[index];
  const Card = CARD_COMPONENT[kind];
  const titleId = "reading-viewer-title";

  // 처음 열릴 때 닫기 버튼으로 포커스
  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
  }, []);

  // 카드를 넘기면 맨 위부터
  useLayoutEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [index]);

  const prevBtn = useRef<HTMLButtonElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const go = (d: -1 | 1) => {
    const n = index + d;
    if (n < 0 || n >= kinds.length) return;
    setDir(d > 0 ? "next" : "prev");
    onIndex(n);
    // 끝 카드에 닿아 누른 버튼이 비활성화되면 포커스가 화면 밖으로 빠지지 않도록 반대쪽 버튼으로
    const edge = n === 0 || n === kinds.length - 1;
    if (edge && (document.activeElement === prevBtn.current || document.activeElement === nextBtn.current)) {
      requestAnimationFrame(() => (n === 0 ? nextBtn.current : prevBtn.current)?.focus({ preventScroll: true }));
    }
  };

  // Esc 는 포커스 위치와 상관없이 닫기 (시트가 열려 있으면 시트가 먼저 처리)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sheet && !e.defaultPrevented) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet, onClose]);

  // Esc · Tab 순환(포커스 가두기) · 좌우 화살표
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (sheet) return; // 시트가 자기 키 처리
    if (e.key === "Escape") {
      e.preventDefault(); // 문서 쪽 Esc 처리와 겹치지 않게
      onClose();
    } else if (e.key === "Tab") {
      const els = Array.from(root.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((el) => !el.closest("[aria-hidden=true]") && el.offsetParent !== null);
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    } else if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && !(e.target instanceof HTMLInputElement)) {
      go(e.key === "ArrowRight" ? 1 : -1);
    }
  };

  const navBtn =
    "grid size-11 shrink-0 place-items-center rounded-full text-white shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)] bg-chat-chip transition-[filter,opacity] active:brightness-125 disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-accent";
  const actBtn =
    "flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-[0.875rem] font-medium whitespace-nowrap transition-[filter] active:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chat-accent";

  return (
    <div ref={root} role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={onKeyDown} className="fixed inset-0 z-50 flex justify-center">
      <div aria-hidden className={cn("absolute inset-0 bg-[#21121a]", closing ? "opacity-0 transition-opacity duration-200" : "animate-scrim-in")} />

      <div className={cn("relative flex h-[100dvh] w-full max-w-[480px] flex-col", closing ? "animate-viewer-out" : "animate-viewer-in")}>
        {/* 위 */}
        <div className="shrink-0" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="grid h-14 grid-cols-[44px_1fr_44px] items-center gap-2 px-3">
            <button
              ref={closeBtn}
              type="button"
              onClick={onClose}
              aria-label="닫고 대화로 돌아가기"
              className="grid size-11 place-items-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-chat-accent"
            >
              <svg viewBox="0 0 20 20" className="size-[22px]" fill="none" aria-hidden>
                <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
            <p className="text-center leading-tight text-white">
              <span className="block font-serif text-[1rem] font-semibold">{READING_META[kind].title}</span>
              <span className="text-[12px] text-chat-muted tabular-nums">
                {index + 1} / {kinds.length}
              </span>
            </p>
            <span />
          </div>
        </div>

        {/* 가운데 */}
        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6" tabIndex={-1}>
          <div key={kind} className={dir === "next" ? "animate-swap-next" : dir === "prev" ? "animate-swap-prev" : undefined}>
            <article aria-label={`${READING_META[kind].title} 카드`}>
              <Card r={r} mode="full" titleId={titleId} onTopic={onTopic} />
            </article>

            <section aria-label="상세 해석" className="mt-4 rounded-[1.25rem] bg-[#fbf2e8] px-4 py-5 text-[clamp(14px,3.9vw,15.5px)] shadow-[0_0_0_1.5px_#d3ab7c]">
              <h2 className="mb-3 text-center font-serif text-[1.15em] font-semibold text-[#4a1a2c]">상세 해석</h2>
              <SampleBanner r={r} />
              <ReadingDetails kind={kind} r={r} onTopic={onTopic} />
            </section>
          </div>
        </div>

        {/* 아래 */}
        <div className="shrink-0 border-t border-white/10 bg-[#2c1720]/95 px-3 pt-2.5" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <div className="flex items-center gap-2">
            <button ref={prevBtn} type="button" onClick={() => go(-1)} disabled={index === 0} aria-label="이전 카드" className={navBtn}>
              <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
                <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" onClick={() => setSheet("save")} className={cn(actBtn, "text-white shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)]")}>
              <svg viewBox="0 0 20 20" className="size-[18px] shrink-0" fill="none" aria-hidden>
                <path d="M10 3v9m0 0-3.5-3.5M10 12l3.5-3.5M4 14.5V16h12v-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              이미지로 저장
            </button>
            <button type="button" onClick={() => setSheet("share")} className={cn(actBtn, "bg-chat-send text-white shadow-[inset_0_0_0_1px_#c96f81]")}>
              <svg viewBox="0 0 20 20" className="size-[18px] shrink-0" fill="none" aria-hidden>
                <path d="M10 12.5V3m0 0L6.5 6.5M10 3l3.5 3.5M6 9.5H5v7h10v-7h-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              공유하기
            </button>
            <button ref={nextBtn} type="button" onClick={() => go(1)} disabled={index === kinds.length - 1} aria-label="다음 카드" className={navBtn}>
              <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
                <path d="m7.5 4.5 5.5 5.5-5.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {sheet && (
        <ShareSheetHost
          onClose={() => setSheet(null)}
          render={(close) => <ShareSheet kind={kind} r={r} intent={sheet} onClose={close} />}
        />
      )}
    </div>
  );
}

/** 시트가 열려 있는 동안 Esc 는 시트만 닫고, 닫히면 열었던 버튼으로 포커스 복귀 */
function ShareSheetHost({ onClose, render }: { onClose: () => void; render: (close: () => void) => React.ReactNode }) {
  const opener = useRef<HTMLElement | null>(typeof document !== "undefined" ? (document.activeElement as HTMLElement) : null);
  const close = () => {
    onClose();
    opener.current?.focus({ preventScroll: true });
  };
  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          close();
        } else if (e.key === "Tab") {
          const box = e.currentTarget.querySelector('[role="dialog"]');
          const els = Array.from(box?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((el) => !el.closest("[aria-hidden=true]") && el.offsetParent !== null && el.tabIndex !== -1);
          if (!els.length) return;
          const first = els[0];
          const last = els[els.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
          e.stopPropagation();
        }
      }}
    >
      {render(close)}
    </div>
  );
}
