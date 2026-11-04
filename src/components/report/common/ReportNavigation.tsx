"use client";

import Link from "next/link";
import { useEffect, useState, type Ref } from "react";

/* ──────────────────────────────────────────────────────────
   읽기 도구 — 위 막대(뒤로 · 제목 · 지금 챕터 · 목차 · 진행률) · 이전/다음 · 맨 위로
   + 스크롤 등장(.reveal → .is-in), 진행률, 지금 읽는 챕터 훅
   모션 줄이기: CSS 에서 .reveal 이 즉시 보이고, 스크롤 이동도 즉시
   ────────────────────────────────────────────────────────── */

/** 스크롤로 들어오는 요소에 .is-in (한 번만) */
export function useReveal(dep: unknown) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.is-in)"));
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((e) => e.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries)
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [dep]);
}

/** 읽기 진행률(0~1) · 맨 위로 버튼 표시 여부 */
export function useReadingProgress(dep: unknown) {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
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
  }, [dep]);
  return { progress, showTop };
}

/** 화면 가운데 위쪽에 걸친 챕터 (article id="ch-…") */
export function useCurrentChapter(ids: string[], dep: unknown) {
  const [current, setCurrent] = useState(ids[0] ?? "");
  const key = ids.join(",");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).map((e) => e.target.id.replace("ch-", ""));
        if (vis[0]) setCurrent(vis[0]);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    key.split(",").forEach((id) => {
      const el = document.getElementById(`ch-${id}`);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [key, dep]);
  return current;
}

export function ReportNavigation({
  backHref,
  backLabel,
  title,
  current,
  progress,
  onToc,
  tocRef,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  current: string;
  progress: number;
  onToc: () => void;
  tocRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <div className="sticky top-0 z-30 bg-[#2e1c24]/94 backdrop-blur-[6px]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto grid h-14 max-w-[480px] grid-cols-[44px_1fr_44px] items-center gap-2 px-2">
        <Link href={backHref} aria-label={backLabel} className="grid size-11 place-items-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-chat-accent">
          <svg viewBox="0 0 15 29" fill="none" aria-hidden className="h-[18px] w-[10px]">
            <path d="M13 2 2.5 14.5 13 27" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <p className="truncate text-center text-[13px] leading-tight" aria-live="polite">
          <span className="block truncate font-serif text-[15px] font-semibold">{title}</span>
          <span className="text-chat-muted">{current}</span>
        </p>
        <button ref={tocRef} type="button" onClick={onToc} aria-label="목차 열기" aria-haspopup="dialog" className="grid size-11 place-items-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-chat-accent">
          <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
            <path d="M4 5.5h12M4 10h12M4 14.5h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="h-[3px] bg-white/10" role="progressbar" aria-label="읽기 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <div className="h-full origin-left bg-[#e8c9ac]" style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  );
}

/** 챕터 아래 이전 · 다음 */
export function ChapterPager({ prev, next, onGo }: { prev?: { id: string; title: string } | null; next?: { id: string; title: string } | null; onGo: (id: string) => void }) {
  return (
    <div className="mt-4 flex justify-between gap-2">
      {prev ? (
        <button type="button" onClick={() => onGo(prev.id)} className="min-h-11 rounded-full px-3 text-[13.5px] text-chat-muted">
          ‹ {prev.id} {prev.title}
        </button>
      ) : (
        <span />
      )}
      {next && (
        <button
          type="button"
          onClick={() => onGo(next.id)}
          className="min-h-11 rounded-full bg-chat-chip px-4 text-[13.5px] text-white shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)]"
          aria-label={`다음 챕터: ${next.id} ${next.title}`}
        >
          다음 · {next.title} ›
        </button>
      )}
    </div>
  );
}

export function BackToTop({ show, reduced }: { show: boolean; reduced: boolean }) {
  if (!show) return null;
  return (
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
  );
}
