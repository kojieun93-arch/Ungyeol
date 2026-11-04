import { cn } from "@/lib/cn";
import { LOGO_IMAGE, LOGO_IMAGE_SM, LOGO_RATIO } from "@/content/brand";
import { REPORT_TITLE } from "@/content/report-outline";

/** 표지 문양: 공식 로고 이미지 (새로 그리지 않음) */
function CoverEmblem({ className, sizes = "160px" }: { className?: string; sizes?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 공식 로고 원본
    <img
      src={LOGO_IMAGE_SM}
      srcSet={`${LOGO_IMAGE_SM} 520w, ${LOGO_IMAGE} 900w`}
      sizes={sizes}
      alt=""
      aria-hidden
      width={520}
      height={Math.round(520 * LOGO_RATIO)}
      className={cn("h-auto translate-x-[-4%]", className)}
    />
  );
}

/** 리포트 표지 — 딥 플럼 단색 장정 + 공식 로고 */
export function ReportCover({ name, className }: { name: string; className?: string }) {
  return (
    <div className={cn("relative mx-auto aspect-[3/4] w-[min(72vw,280px)]", className)}>
      {/* 책 그림자 + 페이지 단면 */}
      <div aria-hidden className="absolute inset-0 translate-x-2 translate-y-2 rounded-r-lg rounded-l-sm bg-paper-deep/80" />
      <div aria-hidden className="absolute inset-0 translate-x-1 translate-y-1 rounded-r-lg rounded-l-sm bg-paper" />
      <div className="relative flex size-full flex-col items-center overflow-hidden rounded-r-lg rounded-l-sm border border-champagne-300/20 bg-plum-800 px-6 pt-8 pb-6 text-center shadow-[0_18px_36px_-20px_rgb(0_0_0/0.7)]">
        {/* 책등 음영 */}
        <span aria-hidden className="absolute inset-y-0 left-0 w-3 bg-black/25" />
        <span aria-hidden className="absolute inset-y-0 left-3 w-px bg-white/[0.06]" />

        <p className="type-italic relative text-[0.75rem] text-champagne-300/80">{REPORT_TITLE.kicker}</p>
        <CoverEmblem className="relative mt-4 w-[78%]" />
        <p className="relative mt-5 font-serif text-[1.375rem] leading-tight font-medium tracking-[-0.02em] text-champagne">
          {REPORT_TITLE.title}
        </p>
        <p className="relative mt-2 text-[0.6875rem] leading-[1.5] text-fg-muted">{REPORT_TITLE.subtitle}</p>
        <div className="relative mt-auto w-full">
          <span aria-hidden className="mx-auto block h-px w-12 bg-champagne-300/30" />
          <p className="mt-3 font-serif text-[0.8125rem] text-champagne-200">for {name}</p>
        </div>
      </div>
    </div>
  );
}

/** 작은 표지 (결과 화면의 미리보기 카드용) */
export function MiniCover({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex aspect-[3/4] flex-col items-center justify-center rounded-r-md rounded-l-sm border border-champagne-300/20 bg-plum-800 shadow-[4px_6px_0_var(--color-paper-deep)]",
        className,
      )}
    >
      <span className="absolute inset-y-0 left-0 w-1.5 bg-black/25" />
      <CoverEmblem className="w-[86%]" sizes="72px" />
    </div>
  );
}
