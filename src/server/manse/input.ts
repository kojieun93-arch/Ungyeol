import { MONTH_TERMS } from "@/features/products/calendar";
import type { ManseInput } from "@/features/saju/types";

/* ──────────────────────────────────────────────────────────
   만세력 계산 요청 — 입력 검증 · 경계 경고 (서버 전용, 순수 함수)
   - 받는 값: 양력/음력 · 윤달 · 생년월일 · 출생 시각(모르면 null) · 성별 · 시간대
   - 이름 · MBTI · 상대방 정보처럼 계산에 필요 없는 값은 받지 않음 (개인정보 최소 수집)
   - 시간대: 지금은 대한민국 표준시(Asia/Seoul)만. 해외 출생은 지원 전
   - 경고는 '운결 쪽에서 미리 알 수 있는 주의점'. 계산 엔진의 처리 방식은 공식 문서에 적힌 것만 안내
   ────────────────────────────────────────────────────────── */

export const SUPPORTED_TIMEZONES = ["Asia/Seoul"] as const;
export type ManseTimezone = (typeof SUPPORTED_TIMEZONES)[number];
export type ManseRequest = ManseInput & { timezone: ManseTimezone };

export type InputErrorCode = "INVALID_BODY" | "INVALID_CALENDAR" | "LEAP_UNKNOWN" | "INVALID_LEAP" | "INVALID_DATE" | "FUTURE_DATE" | "OUT_OF_RANGE" | "INVALID_TIME" | "INVALID_GENDER" | "UNSUPPORTED_TIMEZONE";
export type InputError = { code: InputErrorCode; field: string; message: string };

export const MIN_BIRTH_YEAR = 1900;

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);
const daysInSolarMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** 요청 본문 → 검증된 입력. 알 수 없는 키는 무시하고 다음 단계로 넘기지 않음 */
export function validateManseRequest(raw: unknown, now = new Date()): { ok: true; value: ManseRequest } | { ok: false; errors: InputError[] } {
  const errors: InputError[] = [];
  const err = (code: InputErrorCode, field: string, message: string) => errors.push({ code, field, message });
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, errors: [{ code: "INVALID_BODY", field: "body", message: "요청 형식이 올바르지 않아요." }] };
  const b = raw as Record<string, unknown>;

  const calendar = b.calendar;
  if (calendar !== "solar" && calendar !== "lunar") err("INVALID_CALENDAR", "calendar", "양력(solar) 또는 음력(lunar)을 골라 주세요.");

  // 윤달: 음력이면 true/false 가 꼭 필요 (모름이면 계산하지 않음 — 추측하지 않기 위해)
  let leap: boolean | null = null;
  if (calendar === "lunar") {
    if (b.leap === true || b.leap === false) leap = b.leap;
    else err("LEAP_UNKNOWN", "leap", "음력 생일은 윤달인지 아닌지 알아야 정확히 계산할 수 있어요.");
  } else if (b.leap === true) err("INVALID_LEAP", "leap", "윤달은 음력 생일에만 있어요.");

  const birth = b.birth as Record<string, unknown> | undefined;
  const y = birth?.y, m = birth?.m, d = birth?.d;
  if (!isInt(y) || !isInt(m) || !isInt(d)) err("INVALID_DATE", "birth", "생년월일을 숫자로 보내 주세요.");
  else if (y < MIN_BIRTH_YEAR || y > now.getFullYear()) err("OUT_OF_RANGE", "birth.y", `${MIN_BIRTH_YEAR}년부터 ${now.getFullYear()}년 사이만 계산해요.`);
  else if (m < 1 || m > 12) err("INVALID_DATE", "birth.m", "월은 1~12 사이예요.");
  else if (calendar === "lunar" ? d < 1 || d > 30 : d < 1 || d > daysInSolarMonth(y, m)) err("INVALID_DATE", "birth.d", "없는 날짜예요.");
  else if (calendar === "lunar" && (y > 2050 || (y === 2050 && (m > 11 || (m === 11 && d > 30))))) err("OUT_OF_RANGE", "birth", "음력은 2050년 11월 30일까지만 바꿀 수 있어요.");
  else if (calendar === "solar" && Date.UTC(y, m - 1, d) > Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) err("FUTURE_DATE", "birth", "오늘 이후의 날짜는 계산하지 않아요.");

  let time: ManseInput["time"] = null;
  if (b.time !== null && b.time !== undefined) {
    const t = b.time as Record<string, unknown>;
    if (!isInt(t.h) || !isInt(t.m) || t.h < 0 || t.h > 23 || t.m < 0 || t.m > 59) err("INVALID_TIME", "time", "출생 시각은 00:00~23:59, 모르면 null 이에요.");
    else time = { h: t.h, m: t.m };
  }

  if (b.gender !== "female" && b.gender !== "male") err("INVALID_GENDER", "gender", "성별(female · male)이 필요해요.");

  const tz = b.timezone ?? "Asia/Seoul";
  if (!(SUPPORTED_TIMEZONES as readonly unknown[]).includes(tz)) err("UNSUPPORTED_TIMEZONE", "timezone", "지금은 대한민국 표준시(Asia/Seoul) 출생만 계산해요.");

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { calendar: calendar as "solar" | "lunar", leap, birth: { y: y as number, m: m as number, d: d as number }, time, gender: b.gender as "female" | "male", timezone: tz as ManseTimezone } };
}

export type BoundaryWarning = { code: "TIME_UNKNOWN" | "NEAR_SOLAR_TERM" | "NEAR_IPCHUN" | "KOREA_DST" | "KOREA_STANDARD_TIME_CHANGE" | "ZASI_BOUNDARY" | "LUNAR_CONVERTED_BY_PROVIDER"; message: string };

/**
 * 결과를 읽을 때 주의할 점 (계산 방식에 대한 단정 없음)
 * - 절기 경계: 절기 날짜(해마다 하루 안팎 차이) ±1일이면 월주가, 입춘 무렵이면 연주가 시각에 따라 달라질 수 있음
 * - 대한민국 표준시 변경 · 서머타임 시기(1908–1911 · 1948–1961 · 1987–1988 무렵): 출생 시각을 어떻게 보정하는지 제공자 확인 필요
 * - 23시~01시: 자시를 어떻게 나누는지(야자시 · 조자시)에 따라 일주가 달라질 수 있음
 */
export function boundaryWarnings(v: ManseRequest): BoundaryWarning[] {
  const w: BoundaryWarning[] = [];
  if (!v.time) w.push({ code: "TIME_UNKNOWN", message: "출생 시각을 몰라 시주는 비워 두고 계산해요." });
  if (v.calendar === "lunar") w.push({ code: "LUNAR_CONVERTED_BY_PROVIDER", message: "음력 생일은 계산 엔진이 한국천문연구원 기준으로 양력으로 바꿔 계산해요." });
  else {
    const t = MONTH_TERMS[v.birth.m - 1];
    if (Math.abs(v.birth.d - t.day) <= 1) {
      w.push({ code: "NEAR_SOLAR_TERM", message: `${t.term}(${v.birth.m}월 ${t.day}일 무렵) 가까이 태어나 월주가 출생 시각에 따라 달라질 수 있어요.` });
      if (v.birth.m === 2) w.push({ code: "NEAR_IPCHUN", message: "입춘 무렵이라 연주도 출생 시각에 따라 달라질 수 있어요." });
    }
  }
  // 공식 문서: 1948–51 · 1955–60 · 1987–88 서머타임 기간 출생은 HRUM 이 1시간을 빼서 계산 (timezone 이 서울일 때)
  const y = v.birth.y;
  if (v.time && ((y >= 1948 && y <= 1951) || (y >= 1955 && y <= 1960) || (y >= 1987 && y <= 1988)))
    w.push({ code: "KOREA_DST", message: "서머타임 시행 시기 출생이라, 계산 엔진이 출생 시각에서 1시간을 빼서 계산해요. 기록된 시각이 서머타임 기준인지 확인해 주세요." });
  // 문서에 따로 설명이 없는 예전 표준시(UTC+8:30) 시기는 주의 안내만
  if (v.time && ((y >= 1908 && y <= 1911) || (y >= 1954 && y <= 1961)))
    w.push({ code: "KOREA_STANDARD_TIME_CHANGE", message: "대한민국 표준시가 지금과 달랐던 시기예요. 출생 시각 해석에 주의가 필요해요." });
  // zaSiRule 을 보내지 않음 → 공식 기본값 traditional (23시 이후 출생은 다음 날 일주)
  if (v.time && v.time.h === 23) w.push({ code: "ZASI_BOUNDARY", message: "23시대 출생은 기본 규칙(전통 자시)에 따라 다음 날 일주로 계산해요. 야자시 규칙을 쓰면 일주가 달라질 수 있어요." });
  return w;
}
