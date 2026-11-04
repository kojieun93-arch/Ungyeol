/* ──────────────────────────────────────────────────────────
   사주 · 오행 · 사주×MBTI 분석 결과 타입
   다음 단계에서 HRUM 만세력 API 응답을 이 모양으로 변환해 넣습니다.
   ────────────────────────────────────────────────────────── */

export type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";
export type YinYang = "yang" | "yin";

/** 천간 또는 지지 한 글자 */
export type Glyph = {
  hanja: string; // 乙
  hangul: string; // 을
  element: ElementKey;
  yinYang: YinYang;
};

export type PillarKey = "hour" | "day" | "month" | "year";

export type Pillar = {
  key: PillarKey;
  label: string; // 시주
  stem: Glyph | null; // 천간 (시간 미상이면 null)
  branch: Glyph | null; // 지지
};

/** 만세력 계산에 넘길 입력 (사용자 입력 그대로) */
export type ManseInput = {
  calendar: "solar" | "lunar";
  leap: boolean | null;
  birth: { y: number; m: number; d: number };
  time: { h: number; m: number } | null;
  gender: "female" | "male";
};

export type ElementCount = { key: ElementKey; count: number };

export type ElementDistribution = {
  counts: ElementCount[];
  /** 몇 글자를 기준으로 셌는지 (시주 미상이면 6) */
  basis: number;
  strongest: ElementKey[];
  weakest: ElementKey[];
};

export type ManseResult = {
  /**
   * true: 실제 계산이 아닌 샘플. 화면은 반드시 '샘플 만세력'으로 표시해야 함
   * false: 만세력 엔진(HRUM 등)이 사용자 입력으로 계산한 결과
   */
  isSample: boolean;
  source: "mock" | "hrum";
  /** 표시 순서: 시 · 일 · 월 · 년 (전통 만세력 순서) */
  pillars: Pillar[];
  dayMaster: Glyph;
  hourKnown: boolean;
  elements: ElementDistribution;
};

/* ──────────────────────────────────────────────────────────
   결과 카드 6종이 받는 데이터
   UI 는 아래 타입만 보고 그림 → 샘플이든 HRUM 계산 결과든 같은 화면
   ────────────────────────────────────────────────────────── */

export type MbtiLetter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

/** 데이터 출처 — 화면의 '샘플' 표시는 이 값으로만 결정 */
export type DataOrigin = { isSample: boolean; source: "mock" | "hrum" };

/** ② 오행 분포 + 비율 산출 기준 */
export type FiveElementDistribution = ElementDistribution & {
  /** 기운별 비율(%) — 합계 100. 산출 기준은 method 에 명시 */
  ratios: { key: ElementKey; percent: number }[];
  method: string; // 예: "천간·지지 8글자를 한 글자씩 같은 무게로 센 개수 비율"
  limits: string[]; // 이 비율이 반영하지 않는 것 (지장간·계절 가중치 등)
};

/** ③ 타고난 나 — 사주(일간 중심) 기질 */
export type SajuPersonality = DataOrigin & {
  dayMaster: Glyph;
  title: string; // 을목 乙木
  image: string; // 한 줄 비유
  summary: string; // 카드 한 줄 설명
  core: string; // 기본 기질
  strengths: string[];
  cautions: string[]; // 보완점
  keywords: string[];
};

/**
 * 사주 기반 참고 MBTI — 운결 자체의 비유 분류 (MBTI 진단 · 계산 결과가 아님)
 * ruleStatus: 분류 규칙이 확정되기 전에는 "draft" → 화면에 '규칙 확정 전 시안'으로 표시
 */
export type SajuMBTIReference = {
  type: string;
  reason: string;
  /** 분류 근거 (예: "일간 乙木 · 전통 비유 ‘덩굴’") */
  basis: string[];
  method: "ungyeol-day-master-analogy";
  ruleStatus: "draft" | "confirmed";
  note: string;
};

/** ④ 지금의 나 — 사용자가 직접 고른 MBTI (모르면 type=null) */
export type SelfReportedMBTI = {
  type: string | null;
  source: "user-selected";
  nickname?: string; // 유형 별칭 (예: 용의주도한 전략가 같은 상표명은 쓰지 않음)
  summary?: string;
  strengths: string[];
  growth: string[]; // 보완점
  axes: { axis: "energy" | "perception" | "judgement" | "lifestyle"; letter: MbtiLetter; title: string; text: string }[];
};

/** ⑤ 두 개의 나 — 사주 기반 참고 MBTI vs 사용자가 고른 MBTI */
export type SajuMBTIComparison = {
  reference: string; // 사주 기반 참고 MBTI
  selected: string | null; // 사용자가 고른 MBTI (모르면 null)
  relation: "same" | "different" | "unknown";
  sameLetters: MbtiLetter[];
  common: string[]; // 공통점 (최대 3)
  differences: string[]; // 차이점 (최대 3)
  insight: string; // 한마디
  questions: string[]; // 생각해볼 질문
};

/** ⑥ 종합 인사이트 */
export type IntegratedInsight = DataOrigin & {
  keywords: { word: string; icon: "leaf" | "heart" | "spark" | "balance" | "root" | "wave" }[];
  summary: string;
  advice: string;
  /** 강점 · 자기탐색 포인트 */
  strength: string;
  explore: string;
  /** 운세별 상세 분석 연결 (8개) */
  topics: { id: "overall" | "love" | "reunion" | "compat" | "wealth" | "career" | "relation" | "year2027"; label: string }[];
};

/* ── 결과 묶음 ── */

/**
 * demo        : 고정된 데모 사주로 만든 결과 (지금 전부) — 모든 사주 카드에 '샘플' 표시
 * calculated  : 만세력 엔진(HRUM)이 사용자 입력으로 계산한 결과 — 실제 연동 전에는 쓰지 않음
 * unavailable : 계산에 필요한 정보가 없음 (예: 생년월일 없음)
 */
export type ResultStatus = "demo" | "calculated" | "unavailable";

/** 데모 결과의 기준이 되는 고정 프로필 (특정 인물 아님 · 사용자 입력과 무관) */
export type DemoProfile = { id: string; label: string; description: string };

/** 결과 계산에 넘기는 상담 정보 (채팅 상태에서 변환) */
export type ConsultationProfile = {
  nickname: string | null;
  calendar: "solar" | "lunar" | null;
  leap: boolean | null;
  birth: { y: number; m: number; d: number } | null;
  time: { h: number; m: number } | null;
  timeUnknown: boolean;
  gender: "female" | "male" | null;
  mbti: string | null;
  topic: string;
};

/** 실제 계산(HRUM)에서 함께 받은 값 — 근거 표시용 (운결이 계산하지 않은 값) */
export type LiveExtras = {
  source: "hrum";
  /** 기둥별 십신 · 오행 (HRUM 값 그대로. 일간 자리는 표기하지 않음) */
  tenGods: { key: PillarKey; stem: string | null; branch: string | null; ohaeng: string | null }[];
  /** 계산 기준 안내 (표준시 · 자시 규칙 등) */
  basis: string[];
  warnings: string[];
};

/** 결과 카드 6종이 받는 데이터 */
export type ResultPayload = {
  resultStatus: ResultStatus;
  /** demo 일 때 기준 프로필 */
  demo: DemoProfile | null;
  /** 사용자가 직접 고른 MBTI 를 데모 사주와 함께 썼는지 (혼합 데모 안내용) */
  mixesUserMbti: boolean;
  manseResult: ManseResult;
  fiveElements: FiveElementDistribution;
  sajuPersonality: SajuPersonality;
  sajuMBTIReference: SajuMBTIReference;
  selfReportedMBTI: SelfReportedMBTI;
  comparison: SajuMBTIComparison;
  integratedInsight: IntegratedInsight;
  /** 실제 계산일 때만 — 십신 · 계산 기준 */
  liveExtras?: LiveExtras | null;
};

/** 이전 이름 (호환용) */
export type ReadingResult = ResultPayload;

/** 계산 결과가 아니면 true — 화면의 '샘플' 표시는 이 함수로만 결정 */
export const isDemo = (r: Pick<ResultPayload, "resultStatus">) => r.resultStatus !== "calculated";
