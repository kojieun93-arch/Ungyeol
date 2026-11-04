/** 결과 화면 데이터 구조. 실제 계산 로직이 붙으면 같은 모양으로 채워 넣습니다. */

export type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";

export type ElementCount = {
  key: ElementKey;
  label: string; // 목
  hanja: string; // 木
  count: number;
};

export type MbtiAxis = {
  left: string; // E
  right: string; // I
  leftLabel: string;
  rightLabel: string;
  /** 오른쪽 성향 쪽으로 기운 정도 0~100 */
  value: number;
};

export type SelfPortrait = {
  label: string; // 타고난 나
  source: string; // 사주 · 일간
  name: string; // 을목 乙木
  image: string; // 한 줄 이미지 비유
  keywords: string[];
  summary: string;
};

export type MapChapter = {
  id: "love" | "wealth" | "career" | "relation" | "year";
  index: string; // 01
  title: string;
  theme: string;
  body: string;
  practice: string;
  reportChapter: string;
};

export type ResultData = {
  isSample: boolean;
  displayName: string;
  innate: SelfPortrait;
  present: SelfPortrait;
  elements: ElementCount[];
  mbtiAxes: MbtiAxis[];
  meeting: {
    title: string;
    resonance: string[];
    tension: string[];
    sentence: string;
  };
  chapters: MapChapter[];
};

export type ReportChapter = {
  no: string;
  title: string;
  subtitle: string;
  page: number;
};
