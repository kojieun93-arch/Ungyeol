import type { CalendarType } from "./types";

export const MIN_YEAR = 1900;

export function daysInSolarMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

/** 음력은 큰달 30일까지. 실제 해당 연월의 일수 검증은 만세력 연동 후 보강 */
export function maxDay(calendar: CalendarType, y: number | null, m: number | null) {
  if (calendar === "lunar") return 30;
  if (!y || !m) return 31;
  return daysInSolarMonth(y, m);
}

export type DateErrors = Partial<Record<"y" | "m" | "d" | "form", string>>;

export function validateBirthDate(
  calendar: CalendarType,
  raw: { y: string; m: string; d: string },
  now = new Date(),
): { ok: true; value: { y: number; m: number; d: number } } | { ok: false; errors: DateErrors } {
  const errors: DateErrors = {};
  const thisYear = now.getFullYear();
  const y = Number(raw.y);
  const m = Number(raw.m);
  const d = Number(raw.d);

  if (!raw.y.trim()) errors.y = "태어난 해를 입력해주세요.";
  else if (!/^\d{4}$/.test(raw.y.trim())) errors.y = "네 자리 숫자로 입력해주세요. 예) 1996";
  else if (y < MIN_YEAR || y > thisYear) errors.y = `${MIN_YEAR}년부터 ${thisYear}년 사이로 입력해주세요.`;

  if (!raw.m) errors.m = "태어난 달을 골라주세요.";
  if (!raw.d) errors.d = "태어난 날을 골라주세요.";

  if (!errors.y && !errors.m && !errors.d) {
    const max = maxDay(calendar, y, m);
    if (d > max) errors.d = `${y}년 ${m}월은 ${max}일까지 있어요.`;
    else if (calendar === "solar") {
      const date = new Date(y, m - 1, d);
      if (date.getTime() > now.getTime()) errors.form = "오늘 이후의 날짜는 입력할 수 없어요.";
    }
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { y, m, d } };
}

export function validateTime(raw: string, unknown: boolean): { ok: true; value: { h: number; m: number } | null } | { ok: false; error: string } {
  if (unknown) return { ok: true, value: null };
  const match = /^(\d{2}):(\d{2})$/.exec(raw);
  if (!match) return { ok: false, error: "태어난 시간을 입력하거나 ‘모름’을 선택해주세요." };
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return { ok: false, error: "올바른 시간을 입력해주세요." };
  return { ok: true, value: { h, m } };
}

export const NICKNAME_MAX = 12;

export function validateNickname(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const v = raw.trim().replace(/\s+/g, " ");
  if (!v) return { ok: false, error: "불러드릴 이름을 적어주세요. 넘어가도 괜찮아요." };
  if (v.length > NICKNAME_MAX) return { ok: false, error: `${NICKNAME_MAX}자 이내로 적어주세요.` };
  return { ok: true, value: v };
}

/** 헤어진 연 · 월 — 날짜(일)는 받지 않음. 미래 · 태어나기 전은 안 됨 */
export function validateYearMonth(
  raw: { y: string; m: string },
  { now = new Date(), birthYear = null }: { now?: Date; birthYear?: number | null } = {},
): { ok: true; value: { y: number; m: number } } | { ok: false; errors: Partial<Record<"y" | "m" | "form", string>> } {
  const errors: Partial<Record<"y" | "m" | "form", string>> = {};
  const thisYear = now.getFullYear();
  const y = Number(raw.y);
  const m = Number(raw.m);
  const min = Math.max(MIN_YEAR, birthYear ?? MIN_YEAR);
  if (!raw.y.trim()) errors.y = "헤어진 해를 입력해주세요.";
  else if (!/^\d{4}$/.test(raw.y.trim())) errors.y = "네 자리 숫자로 입력해주세요. 예) 2025";
  else if (y < min || y > thisYear) errors.y = birthYear && y < birthYear ? "태어난 해보다 앞설 수 없어요." : `${min}년부터 ${thisYear}년 사이로 입력해주세요.`;
  if (!raw.m) errors.m = "헤어진 달을 골라주세요.";
  if (!errors.y && !errors.m && y === thisYear && m > now.getMonth() + 1) errors.form = "아직 오지 않은 달이에요.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { y, m } };
}
