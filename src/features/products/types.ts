import type { ChapterAsk, DataSlot, ReportId, ReportInsight, ReportSection, ReportVisual } from "@/features/report/types";
import type { ResultPayload } from "@/features/saju/types";

/* ──────────────────────────────────────────────────────────
   주제별 프리미엄 리포트 (PHASE 5)

   층 구분 — PHASE 4 와 같은 원칙
   - 상품 정의   : ReportProduct (content/products) — 제목 · 입력 항목 · 챕터 구성 · 미리보기 범위 · 가격(미정)
   - 계산 데이터 : ResultPayload (지금은 데모 사주) + 상담 입력 (MBTI · 상대 정보 · 이별 정보 …)
   - 콘텐츠      : ProductChapter — 상품별 빌더(features/products/*)가 입력에 맞춰 만듦
   - UI          : components/report/common 의 공통 컴포넌트가 이 타입만 보고 그림 (7개 상품 공용)
   실제 결제 · 유료 권한 없음. purchase 는 항상 "not-connected"
   ────────────────────────────────────────────────────────── */

export const PRODUCT_IDS = ["love", "reunion", "compat", "wealth", "career", "relation", "year2027"] as const;
export type ProductId = (typeof PRODUCT_IDS)[number];
export const isProductId = (v: string | null | undefined): v is ProductId => !!v && (PRODUCT_IDS as readonly string[]).includes(v);

export type ProductCategory = "relationship" | "money-work" | "yearly";
export const CATEGORY_LABEL: Record<ProductCategory, string> = { relationship: "관계", "money-work": "재물 · 일", yearly: "한 해" };

/** 상담에서 받는 정보 — 리포트에 어떻게 쓰이는지 · 저장 여부를 함께 안내 */
export type ProductInputKey =
  | "birth"
  | "birthtime"
  | "gender"
  | "mbti"
  | "partnerBirth"
  | "partnerMbti"
  | "breakup"
  | "contact"
  | "reason"
  | "question"
  | "relationType"
  | "money"
  | "workStage"
  | "relationScope";

export type InputRequirement = { key: ProductInputKey; label: string; use: string };

/** 가격 — 확정 전에는 null. 화면에는 '가격 미정'만 */
export type PriceInfo = { amountKRW: number | null; status: "undecided"; note: string };

/**
 * 열람 상태 — 데모 전용
 * stage: test = 판매 전 테스트 상태 (실제 구매 상태가 아님)
 * mode : public(공개 챕터만) / demo-full(화면 확인용 전체 보기 · 결제 아님)
 */
export type ProductAccessState = {
  mode: "public" | "demo-full";
  purchase: "not-connected";
  stage: "test";
  freeChapters: string[];
};

export type ProductChapterMeta = {
  id: string;
  title: string;
  question: string;
  /** 잠긴 챕터 · 준비 중 챕터에서 보여 줄 '담기는 내용' */
  includes: string[];
  access: "free" | "premium";
  /** written = 본문 있음 · planned = 구조만 (본문 준비 중) */
  status: "written" | "planned";
};

/* ── 상품 전용 시각 자료 (모두 HTML 표 · SVG) ── */
export type PairRow = { label: string; me: string; partner: string | null; meSample?: boolean };
export type ProductVisual =
  | ReportVisual
  | { kind: "pair-table"; title: string; note?: string; rows: PairRow[] }
  | { kind: "element-relations"; me: { label: string; color: string }; rows: { element: string; color: string; relation: string; text: string }[]; note: string }
  | {
      kind: "breakup-timing";
      status: "known" | "unknown" | "private";
      year?: { label: string; pillar: string; reading: string; color: string; relation: string };
      window?: { calendar: string; before: { label: string; pillar: string }; after: { label: string; pillar: string }; term: string };
      elapsed?: string;
    }
  | { kind: "input-status"; rows: { label: string; state: string; known: boolean; use: string }[] }
  | { kind: "pattern-loop"; steps: string[]; center: string; note?: string }
  | { kind: "term-calendar"; year: number; rows: { calendar: string; term: string; before: string; after: string }[] }
  | { kind: "habit-table"; title: string; columns: [string, string]; rows: { label: string; a: string; b: string }[]; note?: string };

export type ProductChapter = ProductChapterMeta & {
  no: number;
  summary: string;
  dataSlot: DataSlot;
  sections: ReportSection[];
  visuals: ProductVisual[];
  insight: ReportInsight;
  asks: ChapterAsk[];
  card?: "manse" | "elements" | "innate" | "current" | "compare" | "insight";
};

export type ReportProduct = {
  id: ProductId;
  title: string;
  summary: string;
  category: ProductCategory;
  /** 홈 · 채팅의 상담 주제 (FortuneId 와 같은 값) */
  topic: ProductId;
  requiredInputs: InputRequirement[];
  optionalInputs: InputRequirement[];
  chapters: ProductChapterMeta[];
  /** 상품 소개 화면에 미리 보여 줄 공개 챕터의 섹션 (본문은 빌더가 만든 샘플 리포트에서 가져옴 — 문구 중복 없음) */
  sampleSections: { chapterId: string; sectionIds: string[] }[];
  previewAvailability: {
    freeChapters: string[];
    /** 모든 챕터 본문이 있어 데모 전체 보기가 가능한지 */
    fullDemo: boolean;
    written: "complete" | "structure";
  };
  price: PriceInfo;
  accessState: ProductAccessState;
  /** 이 상품에서 특히 지키는 안내 */
  safety: string[];
  /** 무엇을 알 수 없는지 (과장 방지) */
  limits: string[];
};

/** 리포트에 보여도 되는 상담 정보 요약 — 이름 · 생년월일 · 상대 생년월일 · 상세 사연은 넣지 않음 */
export type ProductBasis = { label: string; value: string }[];

export type ProductReport = {
  product: ReportProduct;
  reportId: ReportId;
  payload: ResultPayload;
  basis: ProductBasis;
  chapters: ProductChapter[];
  /** my 리포트: 만든 기준이 된 상담 결과의 세대 · 그 뒤 정보를 고쳤는지 */
  source: { epoch: number; stale: boolean } | null;
};
