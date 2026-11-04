import Link from "next/link";
import { FORTUNES, FORTUNE_IDS, type FortuneCategory } from "@/content/fortunes";
import { FortuneArt } from "./FortuneArt";
import { AdvisorGreeting, ChatShortcut, HomeBar, PolicyNotice, SectionHead, StepFlow, Tag } from "./parts";

/* ──────────────────────────────────────────────────────────
   운결 콘텐츠 홈 (/home) — 인트로에서 들어옴
   ┌ ‹ · 공식 로고 · 대화 ┐
   │ 상담자 인사 (원형 프로필 + 크림 말풍선)
   │ 대표: 사주 × MBTI 통합 분석 (넓은 카드)
   │ 운세 콘텐츠 8종 (2열 카드: 그림 · 제목 · 소개 · 시작하기)
   │ 상담 진행 순서 · 샘플/정보 처리 안내
   └ 운결과 바로 대화하기
   ────────────────────────────────────────────────────────── */

const START = (
  <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden>
    <path d="m7.5 4.5 5.5 5.5-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function FeaturedCard({ f }: { f: FortuneCategory }) {
  return (
    <Link
      href={`/fortune/${f.id}`}
      aria-label={`${f.title} — ${f.short}. 시작하기`}
      className="group block overflow-hidden rounded-[1.5rem] bg-[linear-gradient(180deg,#432433,#36222b)] shadow-[0_0_0_1px_rgb(232_201_172/0.3),0_14px_30px_-18px_rgb(0_0_0/0.8)] transition-transform duration-200 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-chat-accent"
    >
      <div className="relative">
        <FortuneArt f={f} className="aspect-[16/9]" />
        <span className="absolute top-3 left-3">
          <Tag tone="cream">대표 상담</Tag>
        </span>
      </div>
      <div className="px-5 pt-4 pb-5">
        <h3 className="font-serif text-[1.3rem] leading-snug font-semibold tracking-[-0.02em] text-white">{f.title}</h3>
        <p className="mt-1.5 text-[14px] leading-[1.55] text-chat-muted [word-break:keep-all]">{f.short}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="살펴보는 것">
          {f.explores.slice(0, 3).map((e) => (
            <li key={e} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-[#f3dcc4] shadow-[inset_0_0_0_1px_rgb(232_201_172/0.25)]">
              {e}
            </li>
          ))}
        </ul>
        <span className="mt-4 flex h-12 items-center justify-center gap-1.5 rounded-full bg-[#f6e7dc] text-[15px] font-semibold text-[#3a1f2e] group-hover:bg-[#fbeee5]">
          통합 분석 시작하기 {START}
        </span>
      </div>
    </Link>
  );
}

export function FortuneCard({ f }: { f: FortuneCategory }) {
  return (
    <Link
      href={`/fortune/${f.id}`}
      aria-label={`${f.title} — ${f.short}. 시작하기`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-[#3a2430] shadow-[0_0_0_1px_rgb(232_201_172/0.22)] transition-transform duration-200 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-chat-accent"
    >
      <FortuneArt f={f} className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col px-3.5 pt-3 pb-3.5">
        <h3 className="font-serif text-[15.5px] leading-snug font-semibold tracking-[-0.02em] text-white [word-break:keep-all]">{f.title}</h3>
        <p className="mt-1 flex-1 text-[12.5px] leading-[1.5] text-chat-muted/90 [word-break:keep-all]">{f.short}</p>
        <span className="mt-3 flex h-11 items-center justify-center gap-1 rounded-full bg-chat-chip text-[13.5px] font-medium text-white shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)] group-active:brightness-125">
          시작하기 {START}
        </span>
      </div>
    </Link>
  );
}

export function HomeScreen() {
  const [featured, ...rest] = FORTUNE_IDS.map((id) => FORTUNES[id]);
  return (
    <div className="relative min-h-dvh bg-[#2e1c24] text-white" style={{ fontFamily: "var(--font-sans)" }}>
      {/* 채팅과 같은 배경 그림을 위쪽에 옅게 (원본 그대로, 늘리지 않음) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[640px] max-w-[480px] opacity-70"
        style={{ backgroundImage: "linear-gradient(180deg, transparent 55%, #2e1c24), url(/images/chat/chat-bg-top.webp)", backgroundSize: "100% 100%, 100% auto", backgroundRepeat: "no-repeat" }}
      />
      <div className="relative mx-auto w-full max-w-[480px]">
        <HomeBar backHref="/" backLabel="인트로로 돌아가기" right={<ChatShortcut />} />

        <main className="px-4 pb-[calc(env(safe-area-inset-bottom)+28px)]">
          <h1 className="sr-only">운결 운세 홈</h1>

          <section aria-label="운결 인사" className="pt-5">
            <AdvisorGreeting lines={["어서 오세요, 운결이에요.", "오늘은 어떤 이야기가 궁금하세요?"]} />
          </section>

          <section aria-labelledby="featured-title" className="mt-7">
            <SectionHead id="featured-title" eyebrow="UNGYEOL SIGNATURE" title="두 가지 결을 함께 읽어요" />
            <FeaturedCard f={featured} />
          </section>

          <section aria-labelledby="list-title" className="mt-9">
            <SectionHead id="list-title" eyebrow="FORTUNE" title="운세 콘텐츠" desc="궁금한 주제를 골라 운결과 이야기를 시작하세요. 지금은 모든 결과를 샘플로 보여드려요." />
            <ul className="grid grid-cols-2 gap-3">
              {rest.map((f) => (
                <li key={f.id}>
                  <FortuneCard f={f} />
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="flow-title" className="mt-10">
            <SectionHead id="flow-title" eyebrow="HOW IT WORKS" title="운결 상담은 이렇게 진행돼요" />
            <StepFlow />
          </section>

          <div className="mt-10">
            <PolicyNotice />
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/chat"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-[#e9c6b8] bg-[#f6e7dc] text-[16px] font-semibold text-[#3a1f2e] active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f6e7dc]"
            >
              운결과 바로 대화하기 {START}
            </Link>
            <Link href="/report" className="flex min-h-11 items-center px-3 text-[13px] text-chat-muted underline decoration-white/25 underline-offset-[6px]">
              심층 리포트 미리보기 (준비 중)
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
