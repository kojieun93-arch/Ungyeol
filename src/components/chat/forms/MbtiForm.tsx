"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { MBTI_TYPES, type MbtiType } from "@/features/chat/types";
import { errorBase, secondaryBase, submitBase } from "./field-styles";

/** MBTI — 16유형 라디오 그리드(키보드 화살표 이동 가능) + '몰라요' */
export function MbtiForm({ onSubmit }: { onSubmit: (v: MbtiType | null) => void }) {
  const [value, setValue] = useState<MbtiType | "">("");
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  return (
    <form
      noValidate
      className="animate-panel-in"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value) return setError("MBTI를 골라주세요. 모르면 ‘MBTI를 몰라요’를 눌러주세요.");
        onSubmit(value);
      }}
    >
      <fieldset aria-describedby={error ? `${id}-err` : undefined}>
        <legend className="mb-3 text-[0.9375rem] font-semibold text-chat-text">MBTI</legend>
        <div className="grid grid-cols-4 gap-1.5">
          {MBTI_TYPES.map((t) => (
            <label key={t} className="relative">
              <input
                type="radio"
                name={`${id}-mbti`}
                value={t}
                checked={value === t}
                onChange={() => {
                  setValue(t);
                  setError(null);
                }}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center rounded-full border text-[0.875rem] font-semibold tracking-[0.04em] transition-colors duration-150",
                  "border-chat-chip-stroke/70 bg-chat-chip text-white",
                  "peer-checked:border-chat-user-rim peer-checked:bg-chat-send peer-checked:text-white",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-chat-accent",
                )}
              >
                {t}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p id={`${id}-err`} role="alert" className={errorBase}>
          {error}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className={secondaryBase} onClick={() => onSubmit(null)}>
          MBTI를 몰라요
        </button>
        <button type="submit" className={submitBase}>
          보내기
        </button>
      </div>
    </form>
  );
}
