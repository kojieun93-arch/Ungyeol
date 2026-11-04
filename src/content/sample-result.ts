import type { ResultData } from "@/types/result";

/**
 * ⚠️ 샘플 데이터
 * 화면 구성을 보여주기 위한 예시입니다. 실제 생년월일로 계산한 결과가 아니며,
 * 특정 인물의 데이터도 아닙니다. 문구는 단정·예언 대신 '경향'으로 서술합니다.
 */
export const SAMPLE_RESULT: ResultData = {
  isSample: true,
  displayName: "샘플 사용자",

  innate: {
    label: "타고난 나",
    source: "사주 · 일간(日干)",
    name: "을목 乙木",
    image: "바람에 맞춰 몸을 굽히되, 결국 빛 쪽으로 자라는 덩굴",
    keywords: ["유연함", "관계 속 성장", "섬세한 감각"],
    summary:
      "을목은 풀과 덩굴의 기운으로 풀이됩니다. 정면으로 부딪히기보다 주변과 어우러지며 길을 찾고, 천천히 그러나 꾸준히 뻗어 나가는 성향으로 해석되곤 합니다.",
  },

  present: {
    label: "지금의 나",
    source: "MBTI · 자기 응답",
    name: "INFP",
    image: "조용한 방 안에서 자신만의 지도를 그리는 사람",
    keywords: ["내면의 가치", "상상력", "깊은 공감"],
    summary:
      "스스로 납득할 수 있는 의미를 중요하게 여기는 편입니다. 혼자만의 시간에서 에너지를 회복하고, 가능성과 이야기를 통해 세상을 이해하려는 경향이 있습니다.",
  },

  elements: [
    { key: "wood", label: "목", hanja: "木", count: 3 },
    { key: "fire", label: "화", hanja: "火", count: 1 },
    { key: "earth", label: "토", hanja: "土", count: 2 },
    { key: "metal", label: "금", hanja: "金", count: 1 },
    { key: "water", label: "수", hanja: "水", count: 1 },
  ],

  mbtiAxes: [
    { left: "E", right: "I", leftLabel: "외향", rightLabel: "내향", value: 68 },
    { left: "S", right: "N", leftLabel: "감각", rightLabel: "직관", value: 72 },
    { left: "T", right: "F", leftLabel: "사고", rightLabel: "감정", value: 64 },
    { left: "J", right: "P", leftLabel: "판단", rightLabel: "인식", value: 58 },
  ],

  meeting: {
    title: "부드럽게, 그러나 멈추지 않고",
    resonance: [
      "두 결 모두 '관계 속에서 자라는 힘'을 중요하게 여깁니다.",
      "강하게 밀어붙이기보다 공감과 설득으로 영향을 주는 방식이 닮았습니다.",
    ],
    tension: [
      "목의 기운은 바깥으로 뻗으려 하고, 내향의 성향은 에너지를 안으로 모으려 합니다.",
      "그래서 마음이 먼저 움직여도 실제 행동으로 옮기기까지 시간이 걸릴 수 있습니다.",
    ],
    sentence: "충분히 머문 다음에 뻗어 나가는 것, 그것이 당신의 속도입니다.",
  },

  chapters: [
    {
      id: "love",
      index: "01",
      title: "연애",
      theme: "천천히 스며드는 마음",
      body: "첫인상보다 대화가 쌓일수록 깊어지는 관계에서 편안함을 느끼는 경향입니다. 상대의 감정을 먼저 살피다 보니 정작 내 마음을 말할 타이밍을 놓치기 쉽습니다.",
      practice: "좋았던 순간을 그날 안에 한 문장으로 전해 보세요.",
      reportChapter: "Chapter 4 · 사랑의 결",
    },
    {
      id: "wealth",
      index: "02",
      title: "재물",
      theme: "작게, 오래, 꾸준히",
      body: "큰 한 번보다 작은 습관이 쌓이는 방식이 기질과 잘 맞는 편입니다. 의미를 느끼는 곳에는 아낌없이 쓰는 경향이 있어, 지출의 이유를 기록해 두면 흐름이 선명해집니다.",
      practice: "이번 달 '의미 있었던 지출' 세 가지만 적어 보세요.",
      reportChapter: "Chapter 5 · 일과 재물의 결",
    },
    {
      id: "career",
      index: "03",
      title: "직업",
      theme: "의미가 동력이 되는 일",
      body: "스스로 납득한 목표 앞에서 집중력이 크게 올라가는 편입니다. 사람과 이야기를 다루는 일, 혼자 깊이 몰입할 시간이 보장되는 환경에서 강점이 드러나기 쉽습니다.",
      practice: "지금 하는 일에서 '내가 왜 하는지' 한 줄로 정리해 보세요.",
      reportChapter: "Chapter 5 · 일과 재물의 결",
    },
    {
      id: "relation",
      index: "04",
      title: "인간관계",
      theme: "넓게보다 깊게",
      body: "적은 수의 사람과 오래 깊게 이어지는 관계를 선호하는 경향입니다. 배려가 습관이 되어 지치기 쉬우니, 회복을 위한 혼자의 시간을 미리 정해 두는 것이 도움이 됩니다.",
      practice: "이번 주, 나를 위한 빈 저녁 하나를 달력에 먼저 적어 두세요.",
      reportChapter: "Chapter 6 · 관계의 결",
    },
    {
      id: "year",
      index: "05",
      title: "2027 신년운세",
      theme: "정미년(丁未年), 표현과 현실의 해",
      body: "전통적 해석에서 정미년의 정화(丁火)는 을목에게 '표현'의 기운, 미토(未土)는 '현실·재물'의 기운으로 읽힙니다. 마음속에 있던 생각을 작게라도 꺼내 보이는 시도와 잘 어울리는 흐름으로 볼 수 있습니다.",
      practice: "올해 꺼내 보이고 싶은 작업이나 생각 하나를 정해 두세요.",
      reportChapter: "Chapter 7 · 2027 정미년의 흐름",
    },
  ],
};
