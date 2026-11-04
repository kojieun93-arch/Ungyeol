"use client";

import Link from "next/link";

/**
 * '운결에게 더 물어보기' — 채팅으로 이동 (주소에는 id 만)
 * 누르는 순간 onLeave 로 읽던 위치를 기억해 두고, 채팅에서 돌아오면 그 위치로 복귀
 */
export function ReportConsultationPrompt({ href, onLeave, note }: { href: string; onLeave: () => void; note?: string }) {
  return (
    <div className="reveal">
      <Link
        href={href}
        onClick={onLeave}
        className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#4a1a2c] px-5 text-[15px] font-medium text-[#fff4e8] shadow-[0_0_0_1px_#d3ab7c] active:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6e2a40]"
      >
        <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" aria-hidden>
          <path d="M10 3.5c3.9 0 7 2.5 7 5.7s-3.1 5.7-7 5.7c-.8 0-1.5-.1-2.2-.3L4.5 16l.8-2.8C3.9 12.2 3 10.8 3 9.2 3 6 6.1 3.5 10 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        운결에게 더 물어보기
      </Link>
      {note && <p className="mt-1.5 text-center text-[13px] leading-[1.5] text-[#7b6266] [word-break:keep-all]">{note}</p>}
    </div>
  );
}
