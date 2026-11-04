import { manseProvider, getSampleManse } from "@/features/saju/provider";
import { buildResultPayload } from "@/features/saju/reading";
import type { ConsultationProfile, ResultPayload } from "@/features/saju/types";
import type { ConsultTopic, Profile } from "./types";

/* ──────────────────────────────────────────────────────────
   채팅 상태 → 결과 계산 입력 (ConsultationProfile) → 결과 묶음 (ResultPayload)

   지금은 MockManseProvider 의 고정 데모 사주를 씀 (입력한 생년월일로 계산하지 않음)
   - 태어난 시간 '모름'이면 데모 사주의 시주만 비워, 시간 미상일 때 화면이 어떻게 달라지는지 보여줌
   - HRUM 연동 후에는 서버(Route Handler)에서 받은 ManseResult 를 buildResultPayload 에 넘기면 화면은 그대로
   ────────────────────────────────────────────────────────── */

export function toConsultationProfile(p: Profile, topic: ConsultTopic = "integrated"): ConsultationProfile {
  return {
    nickname: p.nickname ?? null,
    calendar: p.calendar ?? null,
    leap: p.calendar === "lunar" ? (p.leap ?? null) : null,
    birth: p.birth ?? null,
    time: p.time ?? null,
    timeUnknown: p.time === null,
    gender: p.gender ?? null,
    mbti: p.mbti ?? null,
    topic,
  };
}

/** 채팅 카드 · 전체 화면이 쓰는 결과 (동기 — 데모 사주는 즉시 만들 수 있음) */
export function resultFor(p: Profile, topic?: ConsultTopic): ResultPayload {
  const cp = toConsultationProfile(p, topic);
  const manse = getSampleManse(!cp.timeUnknown && cp.time !== null);
  return buildResultPayload(manse, cp);
}

/** 지금 연결된 만세력 제공자 이름 (mock 이면 결과는 항상 demo) */
export const providerName = manseProvider.name;
