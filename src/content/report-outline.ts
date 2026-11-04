import type { ReportChapter } from "@/types/result";

/**
 * 심층 리포트 구성안 (준비 중)
 * 목차와 샘플 페이지는 품질 방향을 보여주기 위한 미리보기입니다.
 * 가격·출시일은 정해지지 않았으며, 현재 구매할 수 없습니다.
 */
export const REPORT_STATUS = {
  available: false,
  note: "심층 리포트는 현재 준비 중입니다. 가격과 출시일은 아직 정해지지 않았습니다.",
} as const;

export const REPORT_TITLE = {
  kicker: "Personal Edition",
  title: "두 가지 결의 책",
  subtitle: "타고난 기질과 지금의 성향으로 읽는 나의 이야기",
};

export const REPORT_CHAPTERS: ReportChapter[] = [
  { no: "Prologue", title: "두 결의 지도", subtitle: "이 책을 읽는 방법", page: 4 },
  { no: "Chapter 1", title: "타고난 결", subtitle: "사주 원국과 오행의 균형", page: 8 },
  { no: "Chapter 2", title: "지금의 결", subtitle: "네 가지 축으로 본 성향의 지형", page: 18 },
  { no: "Chapter 3", title: "두 결이 만나는 자리", subtitle: "닮은 점과 부딪히는 점", page: 26 },
  { no: "Chapter 4", title: "사랑의 결", subtitle: "가까워지는 방식, 표현하는 방식", page: 34 },
  { no: "Chapter 5", title: "일과 재물의 결", subtitle: "몰입의 조건과 돈을 다루는 습관", page: 42 },
  { no: "Chapter 6", title: "관계의 결", subtitle: "에너지를 주고받는 사람들", page: 50 },
  { no: "Chapter 7", title: "2027 정미년의 흐름", subtitle: "열두 달의 결", page: 58 },
  { no: "Epilogue", title: "나에게 쓰는 문장", subtitle: "직접 채우는 마지막 페이지", page: 70 },
];
