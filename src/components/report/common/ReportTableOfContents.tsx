"use client";

import { useEffect, useRef } from "react";
import { Sheet } from "./Sheet";

/* 목차 — 지면 안 목록 + 아래에서 올라오는 시트 (지금 챕터 표시 · 열람 상태 · Esc 닫기) */

export type TocItem = { id: string; title: string; state: string };

export function ReportTableOfContents({ items, onPick, label = "리포트 목차" }: { items: TocItem[]; onPick: (id: string) => void; label?: string }) {
  return (
    <nav aria-label={label} className="reveal mt-8">
      <Sheet className="px-4 pt-7 pb-4">
        <h2 className="text-center font-serif text-[18px] font-semibold text-[#4a1a2c]">목차</h2>
        <ol className="mt-3 divide-y divide-[#e6cdbd]">
          {items.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onPick(c.id)} className="flex min-h-12 w-full items-center gap-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-[#6e2a40]">
                <span className="w-7 shrink-0 font-serif text-[14px] text-[#9a7647] tabular-nums">{c.id}</span>
                <span className="min-w-0 flex-1 text-[15.5px] text-[#3a2229] [word-break:keep-all]">{c.title}</span>
                <span className="shrink-0 text-[11.5px] text-[#7b6266]">{c.state}</span>
              </button>
            </li>
          ))}
        </ol>
      </Sheet>
    </nav>
  );
}

export function ReportTocSheet({ items, current, onPick, onClose }: { items: TocItem[]; current: string; onPick: (id: string) => void; onClose: () => void }) {
  const first = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // 열릴 때 한 번만: 첫 버튼 포커스 · 배경 스크롤 잠금 · Esc (다시 렌더돼도 포커스를 뺏지 않음)
  useEffect(() => {
    first.current?.focus({ preventScroll: true });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="toc-title" className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" tabIndex={-1} aria-label="목차 닫기" onClick={onClose} className="absolute inset-0 animate-scrim-in bg-black/55" />
      <div className="relative max-h-[86dvh] w-full max-w-[480px] animate-sheet-in overflow-y-auto overscroll-contain rounded-t-[1.6rem] bg-[#fbf2e8] px-4 pt-4 text-[#3a2229]" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center justify-between">
          <h2 id="toc-title" className="font-serif text-[18px] font-semibold text-[#4a1a2c]">
            목차
          </h2>
          <button ref={first} type="button" onClick={onClose} aria-label="닫기" className="grid size-11 place-items-center rounded-full text-[#6e2a40]">
            <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
              <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <ol className="mt-1 divide-y divide-[#e6cdbd]">
          {items.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onPick(c.id)}
                aria-current={c.id === current ? "location" : undefined}
                className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-2 py-2 text-left ${c.id === current ? "bg-[#f2dfe0]" : ""}`}
              >
                <span className="w-7 shrink-0 font-serif text-[14px] text-[#9a7647] tabular-nums">{c.id}</span>
                <span className="min-w-0 flex-1 text-[15.5px] [word-break:keep-all]">{c.title}</span>
                {c.id === current && <span className="shrink-0 text-[11.5px] font-semibold text-[#974d5e]">읽는 중</span>}
                <span className="shrink-0 text-[11.5px] text-[#7b6266]">{c.state}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
