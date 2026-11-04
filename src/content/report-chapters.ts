import type { ChapterVisual, ReportChapter } from "@/types/domain";

/* ──────────────────────────────────────────────────────────
   종합 리포트 12개 챕터 — 구성 명세 (PHASE 4 에서 이 표를 따라 화면 구현)
   - needs: 이 챕터에 꼭 필요한 데이터. 없으면 availability 로 안내 (꾸며 내지 않음)
   - 챕터마다 '다른 관점'을 맡아 같은 문장이 반복되지 않도록 focus 를 정함
   ────────────────────────────────────────────────────────── */

export type ChapterSpec = {
  no: number;
  id: string;
  title: string;
  focus: string; // 이 챕터만 다루는 관점
  basis: string[]; // 근거로 쓰는 데이터
  visual: ChapterVisual["kind"];
  needs: ("manse" | "birthTime" | "mbti" | "partner" | "luckCycles" | "yearPillars")[];
  access: ReportChapter["access"];
};

export const REPORT_CHAPTERS: ChapterSpec[] = [
  { no: 1, id: "manse", title: "나의 사주 원국", focus: "여덟 글자의 구성과 일간", basis: ["사주 원국 8글자", "일간"], visual: "manse-table", needs: ["manse"], access: "free" },
  { no: 2, id: "innate", title: "타고난 나의 성향", focus: "일간과 오행 분포로 본 기질 · 강점 · 보완점", basis: ["일간", "오행 분포"], visual: "element-radar", needs: ["manse"], access: "free" },
  { no: 3, id: "reference-mbti", title: "사주 기반 MBTI 참고유형", focus: "운결의 자체 비유 방식과 그 한계", basis: ["일간 이미지"], visual: "none", needs: ["manse"], access: "free" },
  { no: 4, id: "compare", title: "실제 MBTI와의 비교", focus: "참고유형과 직접 고른 MBTI의 글자별 비교", basis: ["참고 MBTI", "직접 고른 MBTI"], visual: "type-compare", needs: ["manse", "mbti"], access: "free" },
  { no: 5, id: "love", title: "연애와 인연", focus: "관계 기질 · 감정 표현", basis: ["일간", "오행 분포", "MBTI 판단 선호"], visual: "none", needs: ["manse"], access: "premium" },
  { no: 6, id: "reunion-compat", title: "재회와 궁합", focus: "두 사람의 비교 (상대 정보가 있을 때만)", basis: ["두 사람의 원국", "두 사람의 MBTI"], visual: "pair-compare", needs: ["manse", "partner"], access: "premium" },
  { no: 7, id: "wealth", title: "재물운", focus: "재성(財星) 중심 전통 해석과 소비 성향", basis: ["재성의 유무 · 개수"], visual: "none", needs: ["manse"], access: "premium" },
  { no: 8, id: "career", title: "직업과 적성", focus: "일의 방식 · 환경 · 전환 탐색", basis: ["식상 · 관성", "MBTI 생활 방식"], visual: "none", needs: ["manse"], access: "premium" },
  { no: 9, id: "relation", title: "인간관계", focus: "대인관계 성향과 갈등 패턴", basis: ["비겁 · 인성", "MBTI 에너지 선호"], visual: "none", needs: ["manse"], access: "premium" },
  { no: 10, id: "cycles", title: "대운과 세운", focus: "10년 단위 흐름과 해마다의 흐름", basis: ["대운(성별 · 출생 정보 필요)", "세운"], visual: "timeline", needs: ["manse", "luckCycles"], access: "premium" },
  { no: 11, id: "year2027", title: "2027년 월별 운세", focus: "정미년(丁未年) 열두 달", basis: ["2027년 연 · 월 간지"], visual: "month-grid", needs: ["manse", "yearPillars"], access: "premium" },
  { no: 12, id: "summary", title: "종합 분석과 조언", focus: "앞 챕터의 결론만 모은 정리 (새 주장 없음)", basis: ["1~11장 요약"], visual: "none", needs: ["manse"], access: "premium" },
];
