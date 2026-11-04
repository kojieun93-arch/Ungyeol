import Link from "next/link";
import type { CSSProperties } from "react";
import { LOGO_IMAGE, LOGO_IMAGE_SM, LOGO_RATIO } from "@/content/brand";
import { IntroVisual } from "./IntroVisual";

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

/** 공식 로고 이미지 (운결 · 인장 · 초승달 · ‘사주 × MBTI 운명 상담’ 모두 원본 그대로) */
function IntroLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 원본 로고, 크기 고정
    <img
      src={LOGO_IMAGE}
      srcSet={`${LOGO_IMAGE_SM} 520w, ${LOGO_IMAGE} 900w`}
      sizes="300px"
      alt="운결 — 사주 × MBTI 운명 상담"
      width={900}
      height={Math.round(900 * LOGO_RATIO)}
      // 부제 가운데가 화면 가운데에 오도록 (로고 이미지는 인장 때문에 오른쪽이 넓음)
      className="mx-auto block h-auto w-[min(78vw,300px)] max-w-none translate-x-[-4%] select-none short:w-[min(64vw,240px)] tiny:w-[min(56vw,200px)]"
    />
  );
}

/** 사용자 말풍선 — 채팅 원본(03-chat.png)의 사용자 말풍선과 같은 재료, 꼬리 오른쪽 아래 */
function UserBubble({ text }: { text: string }) {
  return (
    <p
      className="relative max-w-[16rem] rounded-[1.375rem] bg-chat-user px-[1.0625rem] py-[0.6875rem] text-[0.9375rem] leading-[1.5] font-medium tracking-[-0.01em] text-white"
      style={{ border: "1px solid var(--color-chat-user-rim)" }}
    >
      <span className="sr-only">사용자: </span>
      {text}
      <svg aria-hidden viewBox="0 0 20 22" className="absolute -right-[7px] -bottom-px h-[11px] w-[10px]">
        <path d="M0 0C2 8 8 16 19 20.5C11 21.5 4 20 0 17Z" fill="var(--color-chat-user)" />
        <path d="M2 2.5C4 10 9.5 16.5 18 20.3" fill="none" stroke="var(--color-chat-user-rim)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </p>
  );
}

/*
  인트로 (원본 시안 없음 → 공식 로고·캐릭터·채팅 말풍선 재료로 구성)
  ┌ 로고 이미지 ─────────┐
  │ 캐릭터 (얼굴·장신구·상반신) │
  │          [말풍선]◥  │
  │   메인 카피 (명조)    │
  │   서브 카피          │
  └ [☾ 내 안의 흐름 알아보기 ›] ┘
*/
export function IntroScreen() {
  return (
    <main className="relative mx-auto flex h-svh min-h-[540px] w-full max-w-[480px] flex-col overflow-hidden bg-intro-bg text-intro-cream">
      {/* 캐릭터는 로고 부제 아래에서 시작 (부제가 머리 장식 위에 겹치지 않도록) */}
      <IntroVisual className="top-[calc(env(safe-area-inset-top)+9.5rem)] h-[calc(100%-env(safe-area-inset-top)-20.75rem)] short:top-[calc(env(safe-area-inset-top)+7.5rem)] short:h-[calc(100%-env(safe-area-inset-top)-18.25rem)] tiny:top-[calc(env(safe-area-inset-top)+6.25rem)] tiny:h-[calc(100%-env(safe-area-inset-top)-17rem)]" />

      <header className="relative z-10 animate-fade pt-[env(safe-area-inset-top)]" style={delay(100)}>
        <IntroLogo />
      </header>

      <div className="relative z-10 mt-auto flex flex-col items-center px-6 text-center">
        <div className="flex w-full animate-msg-in justify-end pr-2" style={delay(1100)}>
          <UserBubble text="요즘 제 마음이 자꾸 흔들려요…" />
        </div>

        <p
          className="mt-6 animate-rise font-serif text-[1.625rem] leading-[1.42] font-medium tracking-[-0.03em] text-intro-cream short:mt-4 short:text-[1.375rem]"
          style={delay(450)}
        >
          당신이 알고 있는 당신,
          <br />
          그게 전부일까요?
        </p>
        <p className="mt-3 animate-rise text-[0.9375rem] leading-[1.65] text-intro-muted short:mt-2 short:text-[0.875rem]" style={delay(650)}>
          타고난 나와 지금의 나.
          <br />그 사이에 아직 발견하지 못한 이야기가 있어요.
        </p>
      </div>

      <div
        className="relative z-10 animate-rise px-6 pt-5 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] short:pt-4 short:pb-[calc(env(safe-area-inset-bottom)+0.25rem)]"
        style={delay(850)}
      >
        <Link
          href="/chat"
          className="group flex h-14 w-full items-center justify-center gap-2.5 rounded-full border border-[#e9c6b8] bg-[#f6e7dc] px-6 text-[1rem] font-semibold tracking-[-0.01em] text-[#3a1f2e] transition-[background-color,scale] duration-200 hover:bg-[#fbeee5] active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f6e7dc]"
        >
          <svg viewBox="0 0 20 20" fill="none" className="size-[18px]" aria-hidden>
            <path d="M12.5 3.2a7 7 0 1 0 4.3 10.3A5.6 5.6 0 1 1 12.5 3.2Z" fill="currentColor" />
          </svg>
          내 안의 흐름 알아보기
          <svg viewBox="0 0 20 20" fill="none" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden>
            <path d="m7.5 4.5 5.5 5.5-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        {/* 운세 콘텐츠 홈 (보조 진입) */}
        <Link
          href="/home"
          className="mx-auto mt-1 flex h-11 w-max items-center gap-1 px-3 text-[0.875rem] text-intro-muted underline decoration-white/25 underline-offset-[6px] focus-visible:outline-2 focus-visible:outline-[#f6e7dc]"
        >
          운세 콘텐츠 둘러보기
        </Link>
      </div>
    </main>
  );
}
