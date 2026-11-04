import type { ChatState } from "@/features/chat/reducer";
import { RESULT_CARDS, type Profile, type ReunionInfo } from "@/features/chat/types";
import type { ReportId } from "@/features/report/types";
import { getSampleManse } from "@/features/saju/provider";
import { buildResultPayload } from "@/features/saju/reading";
import type { ResultPayload } from "@/features/saju/types";
import type { ProductId } from "./types";

/* ──────────────────────────────────────────────────────────
   리포트를 만드는 재료 (ProductSource)
   - sample: 공개 샘플 — 데모 사주 + 예시 상황 (사용자 정보 없음, 화면에 '예시'로 표시)
   - my    : 채팅 상담의 '가장 최근 결과 카드'가 만들어질 때의 입력 그대로
             → 그 뒤 정보를 고치면(결과 세대가 바뀌면) stale = true 로 '이전 정보 기준' 표시
   개인정보(이름 · 생년월일 · 상대 생년월일)는 리포트 화면에 쓰지 않고, 계산 자리에만 전달
   ────────────────────────────────────────────────────────── */

export type ProductSource = {
  reportId: ReportId;
  payload: ResultPayload;
  mbti: string | null;
  timeUnknown: boolean;
  partner: Profile["partner"];
  reunion: ReunionInfo | undefined;
  /** 상담 첫 질문(지금의 마음)의 답 값 */
  concern: string | null;
  now: Date;
};

/** 공개 샘플의 예시 상황 — 실제 사람이 아님 */
export const SAMPLE_CASE = {
  mbti: "INFP",
  partner: { mbti: "ESTJ" as const },
  reunion: { breakup: { y: 2025, m: 3 }, contact: "some", reason: "talk", question: "missed" } satisfies ReunionInfo,
  concern: "unsure",
};

export function sampleSource(productId: ProductId, now = new Date()): ProductSource {
  const relational = productId === "reunion" || productId === "compat";
  return {
    reportId: "sample",
    payload: buildResultPayload(getSampleManse(true), { mbti: SAMPLE_CASE.mbti, birth: null }, { publicSample: true }),
    mbti: SAMPLE_CASE.mbti,
    timeUnknown: false,
    partner: relational ? { ...SAMPLE_CASE.partner } : undefined,
    reunion: productId === "reunion" ? { ...SAMPLE_CASE.reunion } : undefined,
    concern: productId === "reunion" ? SAMPLE_CASE.concern : null,
    now,
  };
}

const RESULT_LIKE = [...RESULT_CARDS, "product"] as readonly string[];

/** 채팅 상담 → my 리포트 재료. 결과 카드가 아직 없으면 null */
export function sourceFromChat(state: ChatState, productId: ProductId, now = new Date()): { source: ProductSource; epoch: number; stale: boolean } | null {
  const card = [...state.messages].reverse().find((m) => m.kind === "card" && RESULT_LIKE.includes(m.card));
  if (!card || card.kind !== "card") return null;
  const p = card.profile;
  if (!p.birth) return null;
  const epoch = card.epoch ?? 0;
  const ctx = card.context;
  return {
    source: {
      reportId: "my",
      payload: buildResultPayload(getSampleManse(p.time !== null && p.time !== undefined), { mbti: p.mbti ?? null, birth: p.birth }),
      mbti: p.mbti ?? null,
      timeUnknown: p.time === null,
      partner: p.partner,
      reunion: p.reunion,
      concern: ctx?.topic === productId ? (ctx.answers.concern?.value ?? null) : null,
      now,
    },
    epoch,
    stale: epoch !== state.resultEpoch,
  };
}
