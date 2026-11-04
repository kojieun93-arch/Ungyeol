import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { READ } from "../spec";

/*
  채팅 안 결과 카드 공통 틀
  - 상담자 말풍선과 같은 크림 아이보리 면 · 같은 모서리 반경
  - 제목: 딥 플럼 / 구분선: 버건디 / 샘플 표시: 버건디 알약
  - 글자 크기 최소 11px (작은 표 안에서도 읽히도록)
*/

export const PLUM = "#4a2a3c";

export function SampleBadge({ children = "샘플" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex h-[22px] shrink-0 items-center rounded-full bg-chat-user px-2 text-[11px] leading-none font-semibold text-white">
      {children}
    </span>
  );
}

export function ChatCard({
  title,
  badge,
  label,
  children,
  footnote,
  className,
}: {
  title: ReactNode;
  badge?: ReactNode;
  /** 스크린리더용 카드 이름 */
  label: string;
  children: ReactNode;
  footnote?: ReactNode;
  className?: string;
}) {
  return (
    <article
      aria-label={label}
      className={cn("w-full overflow-hidden bg-chat-advisor text-chat-advisor-ink", className)}
      style={{ fontSize: READ.body, borderRadius: READ.radius }}
    >
      <header className="flex items-center justify-between gap-3 border-b border-chat-user/25 px-4 py-3">
        <h3 className="font-serif text-[15px] leading-snug font-semibold tracking-[-0.02em]" style={{ color: PLUM }}>
          {title}
        </h3>
        {badge}
      </header>
      <div className="px-4 py-3.5 text-[13px] leading-[1.6]">{children}</div>
      {footnote && (
        <footer className="border-t border-chat-user/20 bg-chat-advisor-ink/[0.035] px-4 py-2.5 text-[11.5px] leading-[1.55] text-chat-advisor-soft">
          {footnote}
        </footer>
      )}
    </article>
  );
}

/** 카드 안 소제목 */
export function CardLabel({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <p className="text-[11.5px] font-semibold tracking-[0.02em]" style={{ color: color ?? "#8a3a4c" }}>
      {children}
    </p>
  );
}
