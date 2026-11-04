"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import type { CalendarType, Profile } from "@/features/chat/types";
import { maxDay, validateBirthDate, type DateErrors } from "@/features/chat/validation";
import { errorBase, fieldBase, labelBase, submitBase } from "./field-styles";

/** 생년월일 — 연(숫자 입력) · 월 · 일(select). 음력은 30일까지 */
export function BirthDateForm({
  calendar,
  leap,
  onSubmit,
}: {
  calendar: CalendarType;
  leap: Profile["leap"];
  onSubmit: (v: { y: number; m: number; d: number }) => void;
}) {
  const [y, setY] = useState("");
  const [m, setM] = useState("");
  const [d, setD] = useState("");
  const [errors, setErrors] = useState<DateErrors>({});
  const id = useId();

  const days = maxDay(calendar, /^\d{4}$/.test(y) ? Number(y) : null, m ? Number(m) : null);
  const calLabel = calendar === "lunar" ? `음력${leap === true ? " · 윤달" : leap === null ? " · 윤달 모름" : " · 평달"}` : "양력";

  const err = (k: keyof DateErrors) =>
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
        const res = validateBirthDate(calendar, { y, m, d });
        if (!res.ok) return setErrors(res.errors);
        setErrors({});
        onSubmit(res.value);
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p id={`${id}-title`} className="text-[0.9375rem] font-semibold text-chat-text">
          생년월일
        </p>
        <span className="rounded-full border border-chat-accent/40 px-2.5 py-0.5 text-[0.75rem] text-chat-accent">{calLabel}</span>
      </div>

      <div className="grid grid-cols-[1.35fr_1fr_1fr] gap-2">
        <div>
          <label htmlFor={`${id}-y`} className={labelBase}>
            년
          </label>
          <input
            id={`${id}-y`}
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            autoComplete="bday-year"
            placeholder="1996"
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
              setErrors((er) => ({ ...er, m: undefined, d: undefined, form: undefined }));
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
        <div>
          <label htmlFor={`${id}-d`} className={labelBase}>
            일
          </label>
          <select
            id={`${id}-d`}
            value={d}
            onChange={(e) => {
              setD(e.target.value);
              setErrors((er) => ({ ...er, d: undefined, form: undefined }));
            }}
            aria-invalid={!!errors.d}
            aria-describedby={errors.d ? `${id}-d-err` : undefined}
            className={cn(fieldBase, "appearance-none", !d && "text-chat-subtle")}
          >
            <option value="">선택</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i} value={i + 1} disabled={i + 1 > days}>
                {i + 1}일
              </option>
            ))}
          </select>
        </div>
      </div>
      {err("y")}
      {err("m")}
      {err("d")}
      {err("form")}

      <button type="submit" className={cn(submitBase, "mt-3")}>
        보내기
      </button>
    </form>
  );
}
