/* ──────────────────────────────────────────────────────────
   운결 도메인 데이터 계층 (PHASE 2 ~ 6 준비)

   층 구분
   ① 입력      UserProfile · BirthInformation · SelfReportedMBTI · ConsultationSession
   ② 계산      ManseResult · FiveElementDistribution            ← 만세력 엔진(HRUM) 영역. 해석 문장 없음
   ③ 해석      SajuPersonality · SajuMBTIReferenceType · SajuMBTIComparison · Report · ReportChapter (features/report/types.ts)
                                                                ← 규칙 기반(지금) 또는 AI 해석(나중). 계산값을 바꾸지 않음
   ④ 판매      PurchaseStatus                                    ← 결제 미구현. 테스트 UI 전용 상태만

   HRUM 실제 응답을 확인하기 전이라, 응답 필드 이름을 추정해 쓰지 않음.
   HRUM 원본은 HrumRawResponse(unknown)로만 받고, 변환 함수는 실제 응답을 본 뒤 작성.
   ────────────────────────────────────────────────────────── */

import type {
  ElementKey,
  FiveElementDistribution,
  ManseResult,
  SajuMBTIComparison,
  SajuPersonality,
  SelfReportedMBTI,
} from "@/features/saju/types";
import type { FortuneId } from "@/content/fortunes";

export type { FiveElementDistribution, ManseResult, SajuMBTIComparison, SajuPersonality, SelfReportedMBTI };

/* ── ① 입력 ── */

export type BirthInformation = {
  calendar: "solar" | "lunar";
  /** 음력일 때만. null = 잘 모름 */
  leap: boolean | null;
  date: { y: number; m: number; d: number };
  /** null = 태어난 시간 모름 */
  time: { h: number; m: number } | null;
  gender: "female" | "male";
};

export type UserProfile = {
  /** null = 이름 건너뜀 */
  nickname: string | null;
  birth: BirthInformation | null;
  mbti: SelfReportedMBTI["type"];
};

/** 궁합 · 재회의 상대 정보 (선택) — 생년월일만 있어도 비교 가능 */
export type PartnerProfile = {
  label: string; // "상대" 처럼 이름 대신
  birth: Partial<BirthInformation> | null;
  mbti: string | null;
};

/** 상담 세션 — 한 탭의 메모리에만 존재 (서버 · 기기 저장 없음) */
export type ConsultationSession = {
  id: string;
  startedAt: number;
  topic: FortuneId | null;
  profile: UserProfile;
  partner: PartnerProfile | null;
  /** 주제별 추가 질문의 답 */
  followUpAnswers: Record<string, string>;
  /** 입력 단계 진행도 — 이전 단계로 돌아가 수정할 때 사용 */
  steps: { key: StepKey; status: "todo" | "done" | "skipped" }[];
  /** 채팅을 떠났다 돌아올 때 이어 볼 위치 */
  resume: { lastMessageId: string | null; openedCard: string | null };
};

export type StepKey = "nickname" | "calendar" | "birthdate" | "birthtime" | "gender" | "mbti" | "topic" | "followUp" | "partner";

/* ── ② 계산 (HRUM) ── */

/** HRUM 원본 응답 — 실제 응답을 확인하기 전이라 모양을 정하지 않음 */
export type HrumRawResponse = unknown;

/** 계산 결과의 출처 표시 (화면의 '샘플' 표시는 이 값으로만 결정) */
export type CalculationSource = { kind: "sample" } | { kind: "hrum"; requestedAt: number };

/* ── ③ 해석 ── */

/** 해석 출처: 지금은 규칙 기반 샘플. AI 해석은 계산값(ManseResult)을 입력으로만 쓰고 바꾸지 않음 */
export type InterpretationSource = "rule-sample" | "rule" | "ai";

/** 사주 기반 MBTI 참고유형 — 운결의 자체 비유. MBTI 진단 결과가 아님 */
export type SajuMBTIReferenceType = {
  type: string;
  reason: string;
  /** 화면에 반드시 함께 표시할 안내 */
  disclaimer: string;
  method: "ungyeol-day-master-analogy";
};

/* 리포트 (PHASE 4) — features/report/types.ts 로 통합 */
export type {
  ConsultationContext,
  Report,
  ReportAccessState,
  ReportChapter,
  ReportInsight,
  ReportMetadata,
  ReportSection,
} from "@/features/report/types";
export type { ResultPayload } from "@/features/saju/types";

/* ── ④ 판매 (테스트 UI 전용) ── */

export type PurchaseStatus =
  | { state: "not-for-sale" } // 지금 모든 상품
  | { state: "test-checkout"; productId: string } // 테스트 결제 화면만 (실제 결제 · 권한 없음)
  | { state: "owned"; productId: string; grantedAt: number }; // 실제 권한 부여 — 구현하지 않음

/** 오행 키를 다시 내보냄 (리포트 시각화에서 사용) */
export type { ElementKey };
