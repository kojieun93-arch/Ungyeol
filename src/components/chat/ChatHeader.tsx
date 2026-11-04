"use client";

import Link from "next/link";
import { LOGO_IMAGE, LOGO_IMAGE_SM, LOGO_RATIO } from "@/content/brand";
import { HeaderMenu } from "./HeaderMenu";
import { SPEC, u } from "./spec";

/** 헤더 — 원본 높이 188, 아래 1px 선. 뒤로(‹) · 로고 · 더보기(⋯) */
export function ChatHeader({ onRestart }: { onRestart: () => void }) {
  const { back, dots, logo } = SPEC;
  return (
    <header className="relative z-30 shrink-0" style={{ height: u(SPEC.header.h) }}>
      <h1 className="sr-only">운결 — 사주 × MBTI 운명 상담</h1>

      {/* 로고: 원본 위치·크기 그대로, 터치 통과 */}
      {/* eslint-disable-next-line @next/next/no-img-element -- 원본 로고, 배치 좌표 고정 */}
      <img
        src={LOGO_IMAGE_SM}
        srcSet={`${LOGO_IMAGE_SM} 520w, ${LOGO_IMAGE} 900w`}
        sizes="200px"
        alt=""
        aria-hidden
        className="pointer-events-none absolute max-w-none select-none"
        style={{ left: u(logo.left), top: u(logo.top), width: u(logo.w), height: `calc(var(--u) * ${logo.w * LOGO_RATIO})` }}
      />

      {/* 뒤로 → 인트로 (터치 영역 44px, 그림은 원본 크기) */}
      <Link
        href="/"
        aria-label="인트로로 돌아가기"
        className="absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-chat-accent"
        style={{ left: u(back.x + back.w / 2), top: u(back.y + back.h / 2) }}
      >
        <svg viewBox="0 0 15 29" fill="none" aria-hidden style={{ width: u(back.w + 4), height: u(back.h + 4) }}>
          <path d="M13 2 2.5 14.5 13 27" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: u(dots.cx), top: u(dots.cy) }}>
        <HeaderMenu
          label="더보기"
          align="right"
          icon={
            <span aria-hidden className="flex items-center" style={{ gap: u(dots.gap - dots.d) }}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="rounded-full bg-white" style={{ width: u(dots.d), height: u(dots.d) }} />
              ))}
            </span>
          }
          items={[
            { kind: "link", label: "운세 홈", href: "/home" },
            { kind: "link", label: "샘플 결과 보기", href: "/result" },
            { kind: "link", label: "심층 리포트 미리보기", href: "/report" },
            { kind: "action", label: "처음부터 다시 (입력 정보 지우기)", onSelect: onRestart, danger: true },
            {
              kind: "note",
              text: "입력한 정보는 이 탭의 메모리에만 있어요. 서버로 보내거나 기기에 저장하지 않아요. 앱 안에서 다른 화면에 다녀오면 대화가 이어지고, 새로고침하거나 30분이 지나거나 처음부터 다시를 누르면 지워져요.",
            },
          ]}
        />
      </div>

      {/* 헤더 아래 선 — 원본: 가운데 #efe3dc, 양 끝으로 갈수록 흐려짐.
          x<150(원본 픽셀)은 배경 그림에 원본 선이 남아 있어(벚꽃 위) 그 뒤부터 이어 그림 */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent 15.7%, #a37b7d 15.7%, #b19d9a 30%, #efe3dc 50%, #b19d9a 70%, rgb(172 126 136 / 0.75) 90%, rgb(172 126 136 / 0) 100%)" }}
      />
    </header>
  );
}
