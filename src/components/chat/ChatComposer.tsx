"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { HeaderMenu } from "./HeaderMenu";
import { READ, SPEC, u } from "./spec";

/* ──────────────────────────────────────────────────────────
   하단 바 — 원본 03-chat.png 의 두 줄
   1) [⊞] [📅 생년월일] [🕒 태어난 시간] [👤 성별] [☺ MBTI]
   2) [+] [ 여기에 답변을 입력해주세요...        (➤) ]

   기능 연결
   - 정보 칩: 지금 묻고 있는 항목이면 입력 패널을 열고/닫음 (aria-pressed)
              아직이면/이미 답했으면 짧은 안내
   - ⊞: 바로가기 메뉴 (샘플 결과 · 리포트 미리보기 · 둘러보기)
   - +: 현재 답변 패널(선택지·입력 폼) 열기/닫기
   - 입력창: 이름을 묻는 단계에서만 입력 가능, 그 외에는 안내
   - ➤: 입력한 이름 보내기
   그림은 원본 비율, 실제 버튼 요소는 44×44px 이상
   ────────────────────────────────────────────────────────── */

export type InfoKey = "birth" | "time" | "gender" | "mbti";

const C = SPEC.chips;
const K = SPEC.composer;

/** 원본 칩 아이콘 (29u 정사각, 분홍 선) */
const ICONS: Record<InfoKey | "grid", ReactNode> = {
  grid: (
    <g fill="currentColor">
      <rect x="3.2" y="3.2" width="7.6" height="7.6" rx="2" />
      <rect x="13.2" y="3.2" width="7.6" height="7.6" rx="2" />
      <rect x="3.2" y="13.2" width="7.6" height="7.6" rx="2" />
      <rect x="13.2" y="13.2" width="7.6" height="7.6" rx="2" />
    </g>
  ),
  birth: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M8 13h2.2" />
    </g>
  ),
  time: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.4 2" />
    </g>
  ),
  gender: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="8" r="4.2" />
      <path d="M4 20.5c.8-4 4-6.3 8-6.3s7.2 2.3 8 6.3Z" />
    </g>
  ),
  mbti: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.3 14.3c1 1.4 2.2 2 3.7 2s2.7-.6 3.7-2" />
      <circle cx="9" cy="10" r=".6" fill="currentColor" />
      <circle cx="15" cy="10" r=".6" fill="currentColor" />
    </g>
  ),
};

function Icon({ name, size }: { name: keyof typeof ICONS; size: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="shrink-0 text-chat-chip-icon" style={{ width: size, height: size }}>
      {ICONS[name]}
    </svg>
  );
}

/** 칩·원형 버튼 테두리 (원본 2.5u, 최소 1px) */
const ring = (w: number): CSSProperties => ({ boxShadow: `inset 0 0 0 max(${u(w)}, 1px) var(--color-chat-chip-stroke)` });

/*
  터치 영역: 모든 버튼의 실제 요소는 44×44px 이상.
  보이는 모양(원·알약)은 그 안의 span 으로, 원본 크기·색·테두리를 그대로 유지.
*/
const T = 44; // px
const GRID_V = `max(${u(C.grid)}, 30px)`; // 보이는 원 지름
const CHIP_H = `max(${u(C.h)}, 30px)`;
const CHIP_FONT = READ.chip;
const CHIP_ICON = `max(${u(C.icon + 3)}, 13px)`;
const PLUS_V = `max(${u(K.plus)}, 32px)`;
const SEND_V = `max(${u(K.sendD)}, 32px)`;
const half = (v: string) => `((${T}px - ${v}) / 2)`;

export const INFO_CHIPS: { key: InfoKey; label: string }[] = [
  { key: "birth", label: "생년월일" },
  { key: "time", label: "태어난 시간" },
  { key: "gender", label: "성별" },
  { key: "mbti", label: "MBTI" },
];

export function InfoChips({
  current,
  answered,
  panelOpen,
  onToggle,
  onHint,
}: {
  current: InfoKey | null;
  answered: Set<InfoKey>;
  panelOpen: boolean;
  onToggle: () => void;
  onHint: (text: string) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  // 지금 묻는 항목 칩이 화면 밖(작은 화면 가로 스크롤)이면 보이게
  useEffect(() => {
    if (!current) return;
    const el = rowRef.current?.querySelector<HTMLElement>(`[data-chip="${current}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [current]);

  return (
    <div className="flex items-center" style={{ paddingLeft: `max(0px, calc(${u(50)} - ${half(GRID_V)}))` }}>
      {/* ⊞ 바로가기 — 메뉴가 잘리지 않도록 스크롤 영역 밖에 고정 */}
      <HeaderMenu
        label="바로가기"
        align="left"
        placement="above"
        buttonClassName="group size-11 shrink-0 focus-visible:outline-none"
        icon={
          <span
            className="grid place-items-center rounded-full bg-chat-chip transition-[filter] duration-200 group-active:brightness-125 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-chat-accent"
            style={{ width: GRID_V, height: GRID_V, ...ring(C.stroke) }}
          >
            <Icon name="grid" size={`max(${u(C.icon + 2)}, 13px)`} />
          </span>
        }
        items={[
          { kind: "link", label: "샘플 결과 보기", href: "/result" },
          { kind: "link", label: "운명 지도 (샘플)", href: "/result#map" },
          { kind: "link", label: "심층 리포트 미리보기", href: "/report" },
          { kind: "link", label: "먼저 둘러보기", href: "/explore" },
        ]}
      />

      {/* 정보 칩 — 화면이 좁으면 가로 스크롤 (스크롤바 숨김, 칩 단위로 멈춤) */}
      <div
        ref={rowRef}
        role="group"
        aria-label="입력 항목"
        className="no-scrollbar flex min-w-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        style={{ gap: `max(${u(C.gap - 6)}, 6px)`, paddingRight: "8px", scrollPaddingInline: "12px" }}
      >
        {INFO_CHIPS.map(({ key, label }) => {
          const isCurrent = current === key;
          return (
            <button
              key={key}
              data-chip={key}
              type="button"
              aria-pressed={isCurrent ? panelOpen : undefined}
              aria-label={isCurrent ? `${label} 입력 ${panelOpen ? "닫기" : "열기"}` : label}
              onClick={() => {
                if (isCurrent) onToggle();
                else if (answered.has(key)) onHint(`${label}은(는) 이미 입력했어요. 바꾸려면 확인 단계에서 ‘다시 입력할게요’를 눌러주세요.`);
                else onHint(`${label}은(는) 조금 뒤에 여쭤볼게요. 지금 질문에 먼저 답해주세요.`);
              }}
              className="group flex h-11 min-w-11 shrink-0 snap-start items-center focus-visible:outline-none"
            >
              <span
                className={cn(
                  "flex items-center rounded-full bg-chat-chip font-normal whitespace-nowrap text-white transition-[filter] duration-200 group-active:brightness-125",
                  "group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-chat-accent",
                  isCurrent && "brightness-125",
                )}
                style={{
                  height: CHIP_H,
                  padding: `0 max(${u(25)}, 10px) 0 max(${u(C.px)}, 10px)`,
                  gap: `max(${u(C.iconGap)}, 5px)`,
                  fontSize: CHIP_FONT,
                  ...ring(isCurrent ? C.stroke + 1 : C.stroke),
                }}
              >
                <Icon name={key} size={CHIP_ICON} />
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Composer({
  enabled,
  onSubmit,
  validate,
  maxLength,
  onBlockedFocus,
  canTogglePanel,
  panelOpen,
  onTogglePanel,
  onInputFocus,
}: {
  enabled: boolean;
  onSubmit: (v: string) => void;
  validate?: (v: string) => { ok: true; value: string } | { ok: false; error: string };
  maxLength?: number;
  onBlockedFocus: () => void;
  canTogglePanel: boolean;
  panelOpen: boolean;
  onTogglePanel: () => void;
  /** 입력을 시작하면 대화 맨 아래로 (키보드가 올라와도 마지막 질문이 보이게) */
  onInputFocus?: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    if (enabled) ref.current?.focus({ preventScroll: true });
    else setError(null);
  }, [enabled]);

  const submit = () => {
    if (!enabled) return onBlockedFocus();
    const res = validate ? validate(value) : ({ ok: true, value: value.trim() } as const);
    if (!res.ok) return setError(res.error);
    setError(null);
    setValue("");
    onSubmit(res.value);
  };

  return (
    <div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mb-2 text-[0.8125rem] leading-snug text-chat-error" style={{ paddingLeft: `calc(${u(51)} + ${T}px + 14px)` }}>
          {error}
        </p>
      )}
      <form
        className="flex items-center"
        style={{
          paddingLeft: `max(0px, calc(${u(51)} - ${half(PLUS_V)}))`,
          paddingRight: u(47),
          gap: `max(0px, calc(${u(K.plusGap)} - ${half(PLUS_V)}))`,
        }}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <button
          type="button"
          onClick={canTogglePanel ? onTogglePanel : onBlockedFocus}
          aria-label={panelOpen ? "답변 도구 닫기" : "답변 도구 열기"}
          aria-expanded={canTogglePanel ? panelOpen : undefined}
          className="group grid size-11 shrink-0 place-items-center focus-visible:outline-none"
        >
          <span
            className="grid place-items-center rounded-full bg-chat-chip text-white transition-[filter] duration-200 group-active:brightness-125 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-chat-accent"
            style={{ width: PLUS_V, height: PLUS_V, ...ring(2.5) }}
          >
            <svg viewBox="0 0 24 24" aria-hidden style={{ width: `max(${u(K.icon)}, 14px)`, height: `max(${u(K.icon)}, 14px)` }}>
              <path d="M12 3.5v17M3.5 12h17" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </span>
        </button>

        <div
          className="relative flex min-w-0 flex-1 items-center rounded-full bg-chat-surface"
          style={{
            height: `max(${u(K.h)}, ${T}px)`,
            boxShadow: `inset 0 0 0 max(${u(K.border)}, 1px) var(--color-chat-field-stroke)`,
            paddingLeft: `max(${u(K.px)}, 14px)`,
          }}
        >
          <label htmlFor={id} className="sr-only">
            답변 입력
          </label>
          <input
            ref={ref}
            id={id}
            type="text"
            value={value}
            readOnly={!enabled}
            aria-disabled={!enabled}
            onFocus={() => {
              if (!enabled) {
                ref.current?.blur();
                onBlockedFocus();
              } else onInputFocus?.();
            }}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            maxLength={maxLength ? maxLength + 4 : undefined}
            placeholder="여기에 답변을 입력해주세요..."
            enterKeyHint="send"
            autoComplete="off"
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-err` : undefined}
            // 16px 이상: iOS Safari 가 입력할 때 화면을 확대하지 않음
            className="h-full min-w-0 flex-1 truncate bg-transparent text-[16px] text-white outline-none placeholder:text-chat-subtle"
          />
          <button
            type="submit"
            aria-label="보내기"
            className="group grid size-11 shrink-0 place-items-center rounded-full focus-visible:outline-none"
          >
            <span
              className={cn(
                "grid place-items-center rounded-full bg-chat-send text-white transition-[filter,opacity] duration-200 group-active:brightness-110 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-chat-accent",
                !enabled && "opacity-90",
              )}
              style={{ width: SEND_V, height: SEND_V }}
            >
              <svg viewBox="0 0 24 24" aria-hidden style={{ width: `max(${u(K.icon + 6)}, 17px)`, height: `max(${u(K.icon + 6)}, 17px)` }}>
                <path d="M21.5 2.5 2.8 10.2l7.4 3 .9 7.7 3.6-5.6 4.9 2.6Z" fill="currentColor" />
                <path d="m10.2 13.2 8.6-7.9" stroke="#a15768" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

/** 하단 입력창 (이전 ChatInput 자리) */
export { Composer as ChatInput };
