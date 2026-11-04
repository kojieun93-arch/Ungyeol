import type { CSSProperties, ReactNode } from "react";
import { LOGO_IMAGE, LOGO_IMAGE_SM, LOGO_RATIO } from "@/content/brand";
import { cn } from "@/lib/cn";
import { Cloud, Knot } from "./icons";

/* ──────────────────────────────────────────────────────────
   결과 카드 공통 틀 — 첨부 시안(결과 카드 6종) 기준
   ┌ 딥 플럼 헤더: 양쪽 위 벚꽃 · 공식 로고(윗부분) · ─ 운결 샘플 결과 ─ ┐
   │ ┌ 크림 카드 · 금빛 이중 테두리 · 윗변 가운데 매듭 ─────────────┐ │
   │ │ (구름 무늬)        [ · 샘플 결과 · ]         (벚꽃 가지)   │ │
   │ │                     사 주 원 국                            │ │
   │ │                     …본문 (HTML/SVG)…                      │ │
   │ │ (구름)              ※ 샘플 안내               (구름)       │ │
   └ └──────────────────────────────────────────────────────────┘ ┘
   - 모든 길이는 em: mode 별 글자 크기 하나로 채팅 요약 · 전체 화면 · 공유 이미지를 같은 비율로
   - 이미지 에셋은 벚꽃 가지(채팅 배경 원본에서 잘라낸 것)와 공식 로고뿐, 글·표·그래프는 모두 HTML/SVG
   ────────────────────────────────────────────────────────── */

export type CardMode = "chat" | "full" | "share";

export const MODE_FONT: Record<CardMode, string> = {
  chat: "clamp(12px, 3.45vw, 13.5px)",
  full: "clamp(13.5px, 3.9vw, 16px)",
  share: "15px",
};

export const C = {
  plum: "#3a1f2b",
  plumDeep: "#2c1720",
  cream: "#fbf2e8",
  gold: "#d3ab7c",
  goldDeep: "#b88a57",
  title: "#4a1a2c",
  ink: "#3a2229",
  soft: "#7b6266",
  burgundy: "#6e2a40",
  line: "#e6cdbd",
};

/** 카드 윗부분 알약 (샘플 결과 · 샘플 분석 …) */
export function Pill({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <span
      className={cn("inline-flex items-center gap-[0.55em] rounded-full font-serif leading-none font-medium whitespace-nowrap text-[#fff4e8]", className)}
      style={{
        padding: "0.42em 1.05em",
        fontSize: "0.92em",
        background: "linear-gradient(180deg, #81394f 0%, #5a2336 100%)",
        boxShadow: `0 0 0 1px ${C.gold}, 0 0.15em 0.4em rgb(74 26 44 / 0.25)`,
        ...style,
      }}
    >
      <span aria-hidden className="size-[0.32em] rotate-45 bg-[#e8c9ac]" />
      {children}
      <span aria-hidden className="size-[0.32em] rotate-45 bg-[#e8c9ac]" />
    </span>
  );
}

/** 가운데 알약 + 양옆 금빛 선 (일간 · 사주 기반 참고 MBTI 같은 구획 제목) */
export function RuledPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-[0.4em]", className)}>
      <span aria-hidden className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${C.goldDeep})` }} />
      <Knot className="size-[1.1em] shrink-0" />
      <span
        className="rounded-full font-serif leading-none font-medium whitespace-nowrap text-[#fff4e8]"
        style={{ padding: "0.5em 1.05em", fontSize: "1.02em", background: "linear-gradient(180deg, #81394f, #5a2336)", boxShadow: `0 0 0 1px ${C.gold}` }}
      >
        {children}
      </span>
      <Knot className="size-[1.1em] shrink-0" />
      <span aria-hidden className="h-px flex-1" style={{ background: `linear-gradient(270deg, transparent, ${C.goldDeep})` }} />
    </div>
  );
}

/** 공식 로고의 윗부분(글자 · 달 · 인장 · 구름)만 보이게 — 이미지 자체는 원본 그대로 */
export function LogoMark({ width }: { width: string }) {
  return (
    <div aria-hidden className="relative overflow-hidden" style={{ width, height: `calc(${width} * ${LOGO_RATIO} * 0.665)` }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 공식 로고 원본 */}
      <img
        src={LOGO_IMAGE_SM}
        srcSet={`${LOGO_IMAGE_SM} 520w, ${LOGO_IMAGE} 900w`}
        sizes="240px"
        alt=""
        crossOrigin="anonymous"
        className="absolute top-0 left-0 block max-w-none"
        style={{ width, height: `calc(${width} * ${LOGO_RATIO})` }}
      />
    </div>
  );
}

export function ReadingFrame({
  mode,
  isSample,
  pill,
  title,
  titleNote,
  titleId,
  footnote,
  action,
  children,
}: {
  mode: CardMode;
  isSample: boolean;
  pill: ReactNode;
  title: ReactNode;
  /** 제목 옆 작은 글씨 (사주 분석) */
  titleNote?: ReactNode;
  titleId?: string;
  footnote?: ReactNode;
  /** 헤더 오른쪽 위 버튼 (채팅: 크게 보기) */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="relative w-full overflow-hidden text-left"
      style={{
        fontSize: MODE_FONT[mode],
        borderRadius: "1.45em",
        background: `linear-gradient(180deg, #432433 0%, ${C.plum} 40%, ${C.plumDeep} 100%)`,
        boxShadow: "0 0 0 1px rgb(232 201 172 / 0.22), 0 0.6em 1.6em -0.6em rgb(0 0 0 / 0.55)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ── 헤더 ── */}
      <div className="relative flex flex-col items-center" style={{ height: "6.3em", paddingTop: "0.35em" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 채팅 배경 원본에서 잘라낸 벚꽃 */}
        <img src="/images/reading/sakura-corner.webp" alt="" aria-hidden crossOrigin="anonymous" className="pointer-events-none absolute top-0 left-0" style={{ width: "10.5em" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/reading/sakura-corner.webp" alt="" aria-hidden crossOrigin="anonymous" className="pointer-events-none absolute top-0 right-0 -scale-x-100" style={{ width: "9em" }} />
        <LogoMark width="9.6em" />
        <div className="flex w-full items-center justify-center gap-[0.6em] px-[1.4em]" style={{ marginTop: "0.15em" }}>
          <span aria-hidden className="h-px max-w-[4.5em] flex-1" style={{ background: "linear-gradient(90deg, transparent, rgb(232 201 172 / 0.7))" }} />
          <span className="font-serif leading-none tracking-[0.12em] whitespace-nowrap text-[#ecd3b8]" style={{ fontSize: "1.02em" }}>
            {isSample ? "운결 샘플 결과" : "운결 결과"}
          </span>
          <span aria-hidden className="h-px max-w-[4.5em] flex-1" style={{ background: "linear-gradient(270deg, transparent, rgb(232 201 172 / 0.7))" }} />
        </div>
        {action && <div className="absolute top-[0.35em] right-[0.35em] z-10">{action}</div>}
      </div>

      {/* ── 크림 카드 ── */}
      <div
        className="relative"
        style={{
          margin: "0 0.75em 0.75em",
          padding: "1.55em 1.15em 1.1em",
          borderRadius: "1.2em",
          background: "radial-gradient(120% 70% at 50% 0%, #fff9f2 0%, #fbf2e8 50%, #f5e5d6 100%)",
          boxShadow: `0 0 0 1.5px ${C.gold}, inset 0 0 0 0.32em #fbf2e8, inset 0 0 0 calc(0.32em + 1px) rgb(211 171 124 / 0.55)`,
          color: C.ink,
        }}
      >
        <Knot className="absolute left-1/2 size-[1.5em] -translate-x-1/2" style={{ top: "-0.78em" }} />
        <Cloud className="pointer-events-none absolute opacity-60" style={{ left: "0.6em", top: "1.4em", width: "5.2em" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/reading/sakura-sprig-light.webp" alt="" aria-hidden crossOrigin="anonymous" className="pointer-events-none absolute opacity-90" style={{ right: "0.4em", top: "0.45em", width: "6.6em" }} />
        <Cloud className="pointer-events-none absolute opacity-50" style={{ left: "0.5em", bottom: "0.5em", width: "5.5em" }} />
        <Cloud flip className="pointer-events-none absolute opacity-50" style={{ right: "0.5em", bottom: "0.5em", width: "5.5em" }} />

        <div className="relative flex flex-col items-center text-center">
          <Pill>{pill}</Pill>
          <h2
            id={titleId}
            className="font-serif leading-[1.2] font-semibold tracking-[-0.02em]"
            style={{ color: C.title, fontSize: "2.05em", marginTop: "0.32em", wordBreak: "keep-all" }}
          >
            {title}
            {titleNote && (
              <span className="ml-[0.25em] align-[0.15em] text-[0.48em] font-medium tracking-normal" style={{ color: C.burgundy }}>
                {titleNote}
              </span>
            )}
          </h2>
        </div>

        <div className="relative" style={{ marginTop: "1em" }}>
          {children}
        </div>

        {footnote && (
          <p className="relative mx-auto text-center font-serif" style={{ marginTop: "1em", fontSize: "max(0.82em, 11.5px)", lineHeight: 1.55, color: C.soft, maxWidth: "26em", wordBreak: "keep-all" }}>
            {footnote}
          </p>
        )}
      </div>
    </div>
  );
}

/** 아이콘 + 소제목 + 내용 한 줄 (타고난 나 · 지금의 나) */
export function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div
      className="flex items-center text-left"
      style={{ gap: "0.75em", padding: "0.75em 0.85em", borderRadius: "0.9em", background: "rgb(255 255 255 / 0.55)", boxShadow: `0 0 0 1px ${C.line}` }}
    >
      <span className="grid shrink-0 place-items-center" style={{ width: "2.1em" }}>
        {icon}
      </span>
      <span className="shrink-0 font-serif font-semibold" style={{ width: "4.2em", color: C.burgundy, fontSize: "1.02em", lineHeight: 1.3, wordBreak: "keep-all" }}>
        {label}
      </span>
      <span className="min-w-0 flex-1" style={{ fontSize: "0.93em", lineHeight: 1.55, wordBreak: "keep-all" }}>
        {children}
      </span>
    </div>
  );
}

/** MBTI 큰 글자 캡슐 (월계 장식) */
export function TypeCapsule({ type, size = 1, laurel = true }: { type: string; size?: number; laurel?: boolean }) {
  return (
    <div className="flex items-center justify-center" style={{ gap: "0.35em", fontSize: `${size}em` }}>
      {laurel && <LaurelSide />}
      <span
        className="inline-grid place-items-center rounded-full font-serif font-semibold tracking-[0.04em]"
        style={{
          minWidth: "5.6em",
          height: "1.85em",
          padding: "0 0.6em",
          fontSize: "1.75em",
          color: C.title,
          background: "linear-gradient(180deg, #fde9ee 0%, #f3cdd6 100%)",
          boxShadow: `0 0 0 1px #e7b3c0, inset 0 0.08em 0 #fff`,
        }}
      >
        {type}
      </span>
      {laurel && <LaurelSide flip />}
    </div>
  );
}

function LaurelSide({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 16 32" aria-hidden style={{ width: "1em", height: "2em", transform: flip ? "scaleX(-1)" : undefined }}>
      <path d="M13 30C5 26 2 18 4 8" stroke="#c79a5e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse key={i} cx={4.4 + i * 0.5} cy={8.5 + i * 4.5} rx="2.3" ry="1.15" transform={`rotate(-40 ${4.4 + i * 0.5} ${8.5 + i * 4.5})`} fill="#e3c08c" />
      ))}
    </svg>
  );
}
