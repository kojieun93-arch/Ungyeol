import type { Profile } from "./types";

/** 메시지 시간: 오후 10:09 */
export function formatTime(at: number) {
  return new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit" }).format(at);
}

/** 날짜 구분선: 2026년 11월 2일 월요일 */
export function formatDay(at: number) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(at);
}

export function formatBirth(p: Profile) {
  if (!p.birth) return "";
  const { y, m, d } = p.birth;
  const cal = p.calendar === "lunar" ? "음력" : "양력";
  const leap = p.calendar === "lunar" ? (p.leap === true ? " (윤달)" : p.leap === null ? " (윤달 여부 모름)" : "") : "";
  return `${cal} ${y}년 ${m}월 ${d}일${leap}`;
}

export function formatBirthTime(t: Profile["time"]) {
  if (t === null) return "모름";
  if (!t) return "";
  const ap = t.h < 12 ? "오전" : "오후";
  const h12 = t.h % 12 === 0 ? 12 : t.h % 12;
  return `${ap} ${h12}시 ${String(t.m).padStart(2, "0")}분`;
}

export function formatGender(g: Profile["gender"]) {
  return g === "female" ? "여성" : g === "male" ? "남성" : "";
}

export function formatMbti(m: Profile["mbti"]) {
  return m === null ? "모름" : (m ?? "");
}
