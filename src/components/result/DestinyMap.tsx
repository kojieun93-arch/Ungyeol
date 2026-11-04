"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import type { MapChapter } from "@/types/result";

/** 운명 지도 — 다섯 갈래의 짧은 챕터. 무료로 핵심 해석과 작은 실천까지 모두 보여준다 */
export function DestinyMap({ chapters }: { chapters: MapChapter[] }) {
  const [open, setOpen] = useState<MapChapter["id"] | null>(chapters[0]?.id ?? null);
  const baseId = useId();

  return (
    <div>
      {/* 갈래 바로가기 */}
      <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 pb-1">
        {chapters.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setOpen(c.id)}
            aria-pressed={open === c.id}
            className={cn(
              "h-9 shrink-0 rounded-full border px-3.5 text-[0.8125rem] transition-[background-color,border-color,color] duration-500 ease-(--ease-out-expo)",
              open === c.id
                ? "border-champagne-300/45 bg-champagne-300/10 text-champagne-100"
                : "border-white/[0.09] text-fg-muted hover:border-white/20 hover:text-fg",
            )}
          >
            {c.title}
          </button>
        ))}
      </div>

      <ol className="mt-5 border-t border-line">
        {chapters.map((c) => {
          const isOpen = open === c.id;
          const panelId = `${baseId}-${c.id}`;
          return (
            <li key={c.id} className="border-b border-line">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : c.id)}
                className="flex w-full items-center gap-4 py-5 text-left"
              >
                <span className="type-italic w-6 shrink-0 text-champagne-300/80">{c.index}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-[1.0625rem] tracking-[-0.02em] text-fg">{c.title}</span>
                  <span className="mt-0.5 block truncate text-[0.8125rem] text-fg-subtle">{c.theme}</span>
                </span>
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden
                  className={cn(
                    "size-4 shrink-0 text-fg-subtle transition-transform duration-500 ease-(--ease-out-expo)",
                    isOpen && "rotate-180 text-champagne-300",
                  )}
                >
                  <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* grid-rows 0fr→1fr 로 높이를 부드럽게 */}
              <div
                id={panelId}
                role="region"
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-[600ms] ease-(--ease-out-expo)",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <div className="pb-6 pl-10">
                    <p className="type-body text-fg-muted">{c.body}</p>
                    <div className="mt-4 rounded-2xl border border-champagne-300/15 bg-champagne-300/[0.04] px-4 py-3">
                      <p className="text-[0.6875rem] font-medium tracking-[0.04em] text-champagne-300">작은 실천</p>
                      <p className="type-small mt-1 text-fg/90">{c.practice}</p>
                    </div>
                    <p className="mt-3 text-[0.75rem] text-fg-subtle">심층 리포트 · {c.reportChapter}</p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
