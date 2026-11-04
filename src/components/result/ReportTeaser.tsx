import Link from "next/link";
import { ArrowIcon, Badge } from "@/components/ui";
import { MiniCover } from "@/components/report/ReportCover";

/** 심층 리포트로 이어지는 카드 — 판매가 아니라 '미리보기'임을 분명히 */
export function ReportTeaser() {
  return (
    <Link
      href="/report"
      className="group mx-6 flex items-center gap-5 rounded-[1.5rem] border border-line bg-plum-850/60 p-5 transition-[border-color,background-color] duration-500 ease-(--ease-out-expo) hover:border-champagne-300/30 active:bg-plum-800/60"
    >
      <MiniCover className="w-[4.5rem] shrink-0 rotate-[-3deg] transition-transform duration-700 ease-(--ease-out-expo) group-hover:rotate-0" />
      <div className="min-w-0 flex-1">
        <Badge tone="neutral">준비 중</Badge>
        <p className="type-subtitle mt-2 text-fg">심층 리포트 미리보기</p>
        <p className="type-small mt-1 text-fg-muted">목차와 샘플 페이지로 리포트의 결을 먼저 살펴보세요.</p>
        <span className="mt-2 inline-flex items-center gap-1.5 text-[0.8125rem] text-champagne-200">
          미리보기 열기
          <ArrowIcon className="size-3.5 transition-transform duration-500 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
