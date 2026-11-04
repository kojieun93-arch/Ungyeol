"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { validateTime } from "@/features/chat/validation";
import { errorBase, fieldBase, labelBase, submitBase } from "./field-styles";

/** 출생 시간 — time input + '모름' 체크 */
export function BirthTimeForm({ onSubmit }: { onSubmit: (v: { h: number; m: number } | null) => void }) {
  const [time, setTime] = useState("");
  const [unknown, setUnknown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  return (
    <form
      noValidate
      aria-labelledby={`${id}-title`}
      className="animate-panel-in"
      onSubmit={(e) => {
        e.preventDefault();
        const res = validateTime(time, unknown);
        if (!res.ok) return setError(res.error);
        setError(null);
        onSubmit(res.value);
      }}
    >
      <p id={`${id}-title`} className="mb-3 text-[0.9375rem] font-semibold text-chat-text">
        태어난 시간
      </p>
      <label htmlFor={`${id}-t`} className={labelBase}>
        시간
      </label>
      <input
        id={`${id}-t`}
        type="time"
        value={time}
        disabled={unknown}
        onChange={(e) => {
          setTime(e.target.value);
          setError(null);
        }}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={cn(fieldBase, "[color-scheme:dark]")}
      />

      <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-1 text-[0.9375rem] text-chat-text">
        <input
          type="checkbox"
          checked={unknown}
          onChange={(e) => {
            setUnknown(e.target.checked);
            setError(null);
          }}
          className="size-5 shrink-0 accent-[#a15768]"
        />
        태어난 시간을 몰라요
      </label>

      {error && (
        <p id={`${id}-err`} role="alert" className={errorBase}>
          {error}
        </p>
      )}

      <button type="submit" className={cn(submitBase, "mt-2")}>
        보내기
      </button>
    </form>
  );
}
