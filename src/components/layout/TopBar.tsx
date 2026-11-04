import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** 상단 바: 뒤로가기 · 가운데 제목 · 오른쪽 슬롯. 스크롤 시 은은한 블러 */
export function TopBar({
  backHref = "/",
  title,
  right,
  className,
}: {
  backHref?: string;
  title?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-30 -mx-0 grid h-14 grid-cols-[2.75rem_1fr_auto] items-center gap-2 px-3",
        "border-b border-line bg-plum-950",
        className,
      )}
    >
      <Link
        href={backHref}
        aria-label="뒤로"
        className="grid size-11 place-items-center rounded-full text-fg-muted transition-colors duration-300 hover:text-fg active:bg-white/[0.04]"
      >
        <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
          <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <div className="truncate text-center text-[0.875rem] font-medium text-fg/90">{title}</div>
      <div className="flex min-w-11 justify-end pr-1">{right}</div>
    </div>
  );
}
