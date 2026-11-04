"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { validateYearMonth } from "@/features/chat/validation";
import { errorBase, fieldBase, labelBase, submitBase } from "./field-styles";

type Errors = Partial<Record<"y" | "m" | "form", string>>;

/** 헤어진 연 · 월 — 연(숫자) · 월(select). 날짜(일)는 묻지 않음. 기억나지 않음 · 말하고 싶지 않음 */
export function BreakupForm({ birthYear, onSubmit }: { birthYear: number | null; onSubmit: (v: { y: number; m: number } | null | "private") => void }) {
  const [y, setY] = useState("");
  const [m, setM] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const id = useId();
  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`${id}-${k}-err`} role="alert" className={errorBase}>
        {errors[k]}
      </p>
    ) : null;
  return (
    <form
      noValidate
      aria-labelledby={`${id}-title`}
      className="animate-panel-in"
      onSubmit={(e) => {
        e.preventDefault();
        const res = validateYearMonth({ y, m }, { birthYear });
        if (!res.ok) return setErrors(res.errors);
        setErrors({});
        onSubmit(res.value);
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p id={`${id}-title`} className="text-[0.9375rem] font-semibold text-chat-text">
          헤어진 때
        </p>
        <span className="rounded-full border border-chat-accent/40 px-2.5 py-0.5 text-[0.75rem] text-chat-accent">연 · 월만</span>
      </div>
      <div className="grid grid-cols-[1.35fr_1fr] gap-2">
        <div>
          <label htmlFor={`${id}-y`} className={labelBase}>
            년
          </label>
          <input
            id={`${id}-y`}
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            autoComplete="off"
            placeholder="2025"
            value={y}
            onChange={(e) => {
              setY(e.target.value.replace(/\D/g, ""));
              setErrors((er) => ({ ...er, y: undefined, form: undefined }));
            }}
            aria-invalid={!!errors.y}
            aria-describedby={errors.y ? `${id}-y-err` : undefined}
            className={fieldBase}
          />
        </div>
        <div>
          <label htmlFor={`${id}-m`} className={labelBase}>
            월
          </label>
          <select
            id={`${id}-m`}
            value={m}
            onChange={(e) => {
              setM(e.target.value);
              setErrors((er) => ({ ...er, m: undefined, form: undefined }));
            }}
            aria-invalid={!!errors.m}
            aria-describedby={errors.m ? `${id}-m-err` : undefined}
            className={cn(fieldBase, "appearance-none", !m && "text-chat-subtle")}
          >
            <option value="">선택</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}월
              </option>
            ))}
          </select>
        </div>
      </div>
      {err("y")}
      {err("m")}
      {err("form")}
      <button type="submit" className={cn(submitBase, "mt-3")}>
        보내기
      </button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onSubmit(null)} className="min-h-11 rounded-full text-[0.875rem] text-chat-text shadow-[inset_0_0_0_1px_rgb(231_195_187/0.45)]">
          기억나지 않아요
        </button>
        <button type="button" onClick={() => onSubmit("private")} className="min-h-11 rounded-full text-[0.875rem] text-chat-text shadow-[inset_0_0_0_1px_rgb(231_195_187/0.45)]">
          말하고 싶지 않아요
        </button>
      </div>
    </form>
  );
}
