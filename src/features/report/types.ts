import type { ResultPayload, ResultStatus } from "@/features/saju/types";
import type { TopicId } from "@/features/saju/topics";

/* ──────────────────────────────────────────────────────────
   종합 리포트 데이터 모델 (PHASE 4)

   층 구분
   - 계산 데이터  : ResultPayload (만세력 · 오행 · 참고 MBTI · 비교 …) — 지금은 데모, HRUM 연결 후 같은 모양으로 변환
   - 콘텐츠       : Report · ReportChapter · ReportSection · ReportInsight — 계산 데이터에서 만들어지는 글
   - 접근 권한    : ReportAccessState — 데모 전용 (실제 결제 · 유료 권한 없음)
   - 상담 연결    : ConsultationContext — 리포트 ↔ 채팅 이동 (주소에는 id 만)
   UI 컴포넌트(components/report)는 이 타입만 보고 그림
   ────────────────────────────────────────────────────────── */

export type ReportId = "sample" | "my";
export const CHAPTER_IDS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] as const;
export type ChapterId = (typeof CHAPTER_IDS)[number];
export const isChapterId = (v: string): v is ChapterId => (CHAPTER_IDS as readonly string[]).includes(v);
export const isReportId = (v: string): v is ReportId => v === "sample" || v === "my";

/** 실제 분석 데이터가 들어올 자리의 상태 — 계산되지 않은 것을 계산된 것처럼 보이지 않게 */
export type DataSlot = {
  status: "demo" | "unconnected" | "needs-input";
  label: string;
  detail: string;
  /** 연결에 필요한 것 */
  needs?: string[];
};

export type ReportSection = {
  id: string;
  title: string;
  body: string[];
  /** 접었다 펼치는 추가 설명 */
  more?: string[];
  /** 목록으로 보여 줄 내용 */
  list?: string[];
};

export type ReportVisual =
  | { kind: "manse-table" }
  | { kind: "ten-gods"; rows: { element: string; color: string; group: string; text: string; count: number }[] }
  | { kind: "element-radar" }
  | { kind: "reference-rules"; rows: { stem: string; image: string; type: string; current: boolean }[]; missing: string[] }
  | { kind: "compare-card" }
  | { kind: "letter-compare"; left: { label: string; type: string }; right: { label: string; type: string | null }; rows: { axis: string; left: string; right: string | null; same: boolean | null }[] }
  | { kind: "cycle-slots"; count: number }
  | { kind: "month-pillars"; year: { pillar: string; reading: string }; months: { term: string; approx: string; pillar: string; element: string; color: string; tendency: string }[] }
  | { kind: "insight-card" };

/** 챕터 끝 정리 — 운결의 한마디 · 실천 · 질문 */
export type ReportInsight = {
  advisor: string[];
  practice?: string;
  questions: string[];
};

/** 채팅에서 '운결에게 더 물어보기' 선택지 — 미리 작성된 설명 (AI 답변 아님) */
export type ChapterAsk = { q: string; answer: string[] };

export type ReportChapter = {
  id: ChapterId;
  no: number;
  title: string;
  /** 핵심 질문 */
  question: string;
  /** 한눈에 보는 요약 */
  summary: string;
  access: "free" | "premium";
  /** 잠긴 챕터에서 보여 줄 '담기는 내용' */
  includes: string[];
  dataSlot: DataSlot;
  sections: ReportSection[];
  visuals: ReportVisual[];
  insight: ReportInsight;
  /** 채팅 연결: 관련 운세 주제 · 질문 선택지 */
  topic: TopicId | null;
  asks: ChapterAsk[];
  /** 이 챕터의 결과 카드 (이미지 저장 · 크게 보기) */
  card?: "manse" | "elements" | "innate" | "current" | "compare" | "insight";
};

export type ReportMetadata = {
  id: ReportId;
  title: string;
  subtitle: string;
  resultStatus: ResultStatus;
  /** 데모일 때 기준 사주 이름 */
  demoLabel: string | null;
  /** 개인정보 없는 요약 (이름 · 생년월일 · 시간 없음) */
  basis: { mbti: string | null; timeUnknown: boolean; partner: "none" | "mbti-only" | "birth" | "birth-mbti"; topic: string };
  chapterCount: number;
  /** 추후 확장: 전체 리포트 PDF 내보내기 */
  exports: { pdf: "planned" };
};

export type Report = {
  meta: ReportMetadata;
  payload: ResultPayload;
  chapters: ReportChapter[];
};

/**
 * 접근 권한 — 데모 전용
 * public    : 공개 샘플 챕터만 (기본)
 * demo-full : 화면 확인용 체험 — 결제 · 구매 · 유료 권한이 아님 (새로고침하면 해제)
 */
export type ReportAccessState = {
  mode: "public" | "demo-full";
  purchase: "not-connected";
  freeChapters: ChapterId[];
};

/** 리포트 → 채팅 → 리포트 */
export type ConsultationContext = {
  reportId: ReportId;
  /** 종합 리포트는 "01"~"12", 주제별 리포트는 그 상품의 챕터 id */
  chapterId: string;
  /** 주제별 리포트(PHASE 5)에서 왔으면 상품 id. 종합 리포트면 없음 */
  productId?: string | null;
  topic: TopicId | null;
  returnTo: { path: string; scrollY: number };
  /** 떠날 때 리포트를 만든 상담 결과의 세대 (돌아왔을 때 정보가 바뀌었는지 비교) */
  epoch?: number | null;
};

export const FREE_CHAPTERS: ChapterId[] = ["01", "04"];
