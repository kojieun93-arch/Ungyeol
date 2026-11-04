import type { ReactNode } from "react";
import { C } from "@/components/reading/Frame";
import { Knot } from "@/components/reading/icons";

/** 리포트 지면 — 결과 카드와 같은 재료 (크림 지면 · 금빛 이중 테두리 · 윗변 매듭) */
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

export function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-label="잠김" role="img">
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  );
}
