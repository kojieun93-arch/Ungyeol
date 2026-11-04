/* ──────────────────────────────────────────────────────────
   운세 주제 (샘플 풀이)
   실제 풀이 API 가 없으므로 모두 '샘플 사주(乙木 일간) 기준' 예시.
   단정·예언 대신 경향과 작은 실천으로만 서술.
   ────────────────────────────────────────────────────────── */

export const TOPIC_IDS = ["love", "reunion", "compat", "wealth", "career", "relation", "year2027", "overall"] as const;
export type TopicId = (typeof TOPIC_IDS)[number];

export type Topic = {
  id: TopicId;
  label: string; // 버튼
  ask: string; // 사용자 말풍선
  intro: string; // 운결 첫 마디
  title: string;
  lines: string[];
  practice: string;
  note?: string;
  reportChapter: string;
};

export const TOPICS: Record<TopicId, Topic> = {
  love: {
    id: "love",
    label: "연애·인연운",
    ask: "연애·인연운이 궁금해요.",
    intro: "연애와 인연 이야기를 해볼게요.",
    title: "연애·인연운",
    lines: [
      "첫인상보다 대화가 쌓일수록 깊어지는 관계에서 편안함을 느끼는 경향이에요.",
      "상대의 마음을 먼저 살피다 보니, 정작 내 마음을 말할 타이밍을 놓치기 쉬워요.",
    ],
    practice: "좋았던 순간을 그날 안에 한 문장으로 전해 보세요.",
    reportChapter: "Chapter 4 · 사랑의 결",
  },
  reunion: {
    id: "reunion",
    label: "재회운",
    ask: "재회운이 궁금해요.",
    intro: "다시 이어지는 인연에 대한 이야기예요.",
    title: "재회운",
    lines: [
      "을목의 결은 끊어진 줄기보다 남아 있는 뿌리를 오래 기억하는 편이에요.",
      "다만 재회는 두 사람의 지금 마음에 달린 일이라, 사주만으로 결과를 말할 수는 없어요.",
    ],
    practice: "그 사람이 아니라 ‘그때의 나’에게 무엇이 필요했는지 먼저 적어 보세요.",
    reportChapter: "Chapter 4 · 사랑의 결",
  },
  compat: {
    id: "compat",
    label: "궁합",
    ask: "궁합을 보고 싶어요.",
    intro: "궁합은 두 사람의 결을 함께 봐야 해요.",
    title: "궁합",
    lines: [
      "목(木)이 중심인 결은 물(水)처럼 품어 주거나 흙(土)처럼 받쳐 주는 상대와 편안함을 느끼는 경향이 있어요.",
      "다만 이건 전통적인 상생 관계의 일반론이고, 실제 궁합은 상대의 생년월일이 있어야 볼 수 있어요.",
    ],
    practice: "함께 있을 때 내가 가장 ‘나답게’ 말하게 되는 사람을 떠올려 보세요.",
    note: "상대방 정보를 알려주셨어도, 두 사람을 실제로 비교하는 풀이는 만세력 계산이 연결된 뒤에 열려요.",
    reportChapter: "Chapter 6 · 관계의 결",
  },
  wealth: {
    id: "wealth",
    label: "재물운",
    ask: "재물운이 궁금해요.",
    intro: "돈을 다루는 습관에 대한 이야기예요.",
    title: "재물운",
    lines: [
      "큰 한 번보다 작은 습관이 쌓이는 방식이 기질과 잘 맞는 편이에요.",
      "의미를 느끼는 곳에는 아낌없이 쓰는 경향이 있어, 지출의 이유를 기록하면 흐름이 선명해져요.",
    ],
    practice: "이번 달 ‘의미 있었던 지출’ 세 가지만 적어 보세요.",
    reportChapter: "Chapter 5 · 일과 재물의 결",
  },
  career: {
    id: "career",
    label: "직업·적성운",
    ask: "직업·적성운이 궁금해요.",
    intro: "일과 적성 이야기를 해볼게요.",
    title: "직업·적성운",
    lines: [
      "스스로 납득한 목표 앞에서 집중력이 크게 올라가는 편이에요.",
      "사람과 이야기를 다루는 일, 혼자 깊이 몰입할 시간이 보장되는 환경에서 강점이 드러나기 쉬워요.",
    ],
    practice: "지금 하는 일을 ‘내가 왜 하는지’ 한 줄로 정리해 보세요.",
    reportChapter: "Chapter 5 · 일과 재물의 결",
  },
  relation: {
    id: "relation",
    label: "인간관계",
    ask: "인간관계가 궁금해요.",
    intro: "사람들과의 관계를 살펴볼게요.",
    title: "인간관계",
    lines: [
      "적은 수의 사람과 오래 깊게 이어지는 관계를 편하게 느끼는 경향이에요.",
      "배려가 습관이 되어 지치기 쉬우니, 혼자 회복할 시간을 미리 정해 두면 좋아요.",
    ],
    practice: "이번 주, 나를 위한 빈 저녁 하나를 달력에 먼저 적어 두세요.",
    reportChapter: "Chapter 6 · 관계의 결",
  },
  year2027: {
    id: "year2027",
    label: "2027년 신년운세",
    ask: "2027년 신년운세가 궁금해요.",
    intro: "2027년, 정미년(丁未年)의 흐름이에요.",
    title: "2027 신년운세",
    lines: [
      "전통 해석에서 정화(丁火)는 을목에게 ‘표현’의 기운, 미토(未土)는 ‘현실·재물’의 기운으로 읽혀요.",
      "마음속 생각을 작게라도 꺼내 보이는 시도와 잘 어울리는 흐름으로 볼 수 있어요.",
    ],
    practice: "올해 꺼내 보이고 싶은 작업이나 생각 하나를 정해 두세요.",
    note: "특정 사건을 예측하지 않는 참고용 읽기예요.",
    reportChapter: "Chapter 7 · 2027 정미년의 흐름",
  },
  overall: {
    id: "overall",
    label: "종합운",
    ask: "종합운을 알고 싶어요.",
    intro: "지금까지의 이야기를 한데 모아 볼게요.",
    title: "종합운",
    lines: [
      "부드럽게 어우러지되 멈추지 않고 자라는 것, 그게 이 결의 큰 흐름이에요.",
      "정리하고 매듭짓는 힘(金)이 적은 편이라, 마무리를 도와줄 사람이나 습관이 큰 힘이 돼요.",
    ],
    practice: "미뤄 둔 일 하나를 오늘 ‘끝’이라고 이름 붙여 마무리해 보세요.",
    reportChapter: "Prologue · 두 결의 지도",
  },
};
