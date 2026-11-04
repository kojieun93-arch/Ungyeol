import { LOGO_IMAGE, LOGO_IMAGE_SM, LOGO_RATIO } from "@/content/brand";

const ADVISOR = "/images/ungyeol-advisor.webp";

/** 결과 첫 장: 공식 로고 · 상담자 프로필 · 개인 제목 (그라데이션·빛 효과 없음) */
export function ResultCover({ name, isSample }: { name: string; isSample: boolean }) {
  return (
    <header className="px-6 pt-5 pb-8 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- 공식 로고 원본 */}
      <img
        src={LOGO_IMAGE_SM}
        srcSet={`${LOGO_IMAGE_SM} 520w, ${LOGO_IMAGE} 900w`}
        sizes="220px"
        alt="운결 — 사주 × MBTI 운명 상담"
        width={520}
        height={Math.round(520 * LOGO_RATIO)}
        className="mx-auto h-auto w-[min(60vw,220px)] translate-x-[-4%]"
      />
      <div className="mt-5 flex items-center justify-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- 상담자 프로필 원본 */}
        <img
          src={ADVISOR}
          alt="운결 상담자"
          width={48}
          height={48}
          className="size-12 rounded-full object-cover shadow-[0_0_0_1px_#c9838f]"
        />
        <p className="text-left text-[0.8125rem] leading-snug text-fg-muted">
          운결이 정리한
          <br />
          <span className="text-fg">{isSample ? "샘플 결과" : "나의 결과"}</span>
        </p>
      </div>
      <p className="type-italic mt-6 animate-rise text-champagne-300/90">A Personal Reading</p>
      <h1 className="type-display mt-2 animate-rise" style={{ animationDelay: "150ms" }}>
        {name}
        {isSample ? "" : "님"}의
        <br />두 가지 결
      </h1>
    </header>
  );
}
