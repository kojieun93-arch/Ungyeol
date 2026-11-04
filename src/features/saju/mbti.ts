import type { MbtiLetter, SelfReportedMBTI } from "./types";

/* ──────────────────────────────────────────────────────────
   MBTI — 사용자가 직접 고른 유형의 '선호' 풀이
   성격 진단·검사 결과가 아니며, 특정 업체의 유형 별칭은 쓰지 않음
   ────────────────────────────────────────────────────────── */

type TypeText = { summary: string; strengths: string[]; growth: string[] };

export const MBTI_TEXT: Record<string, TypeText> = {
  INTJ: { summary: "논리적이고 전략적이며, 스스로의 기준이 뚜렷해요.", strengths: ["계획 수립과 문제 해결에 강해요.", "목표를 향해 꾸준히 나아가요."], growth: ["감정을 표현하는 데 서툴 수 있어요.", "혼자서 너무 많은 걸 책임지려 해요."] },
  INTP: { summary: "원리를 파고들며 스스로 납득할 때까지 생각해요.", strengths: ["복잡한 문제를 구조로 풀어내요.", "새로운 관점을 잘 떠올려요."], growth: ["생각이 길어져 실행이 늦어질 수 있어요.", "감정 표현이 짧게 느껴질 수 있어요."] },
  ENTJ: { summary: "목표를 세우고 사람과 일을 효율적으로 이끌어요.", strengths: ["결정이 빠르고 추진력이 있어요.", "큰 그림을 실행 계획으로 바꿔요."], growth: ["속도가 빨라 주변이 버거워할 수 있어요.", "쉬는 것을 미루기 쉬워요."] },
  ENTP: { summary: "가능성을 탐색하고 새로운 시도를 즐겨요.", strengths: ["아이디어가 많고 순발력이 좋아요.", "막힌 상황에서 다른 길을 찾아요."], growth: ["시작한 일을 마무리하는 힘이 필요해요.", "논쟁이 상대에게 날카롭게 느껴질 수 있어요."] },
  INFJ: { summary: "깊이 있는 통찰과 따뜻한 공감이 돋보여요.", strengths: ["사람의 마음을 섬세하게 읽어요.", "의미 있는 방향을 오래 지켜요."], growth: ["혼자 감정을 삭이다 지치기 쉬워요.", "기대가 높아 실망도 깊을 수 있어요."] },
  INFP: { summary: "자신만의 가치를 소중히 여기며 조용히 지켜요.", strengths: ["진심 어린 공감과 상상력이 있어요.", "좋아하는 일에 깊이 몰입해요."], growth: ["현실적인 마감과 정리가 버거울 수 있어요.", "상처를 마음에 오래 담아 두기 쉬워요."] },
  ENFJ: { summary: "사람을 북돋우고 함께 성장하는 것을 중요하게 여겨요.", strengths: ["분위기를 모으고 사람을 이끌어요.", "상대의 가능성을 먼저 봐요."], growth: ["남을 챙기느라 내 마음을 놓치기 쉬워요.", "거절하는 것이 어려울 수 있어요."] },
  ENFP: { summary: "호기심과 열정으로 사람과 가능성을 연결해요.", strengths: ["새로운 일에 활기를 불어넣어요.", "사람의 장점을 잘 발견해요."], growth: ["관심이 넓어 한곳에 머물기 어려울 수 있어요.", "반복되는 일에 쉽게 지칠 수 있어요."] },
  ISTJ: { summary: "책임감 있고 꼼꼼하게 약속을 지켜요.", strengths: ["맡은 일을 정확하게 해내요.", "경험을 바탕으로 안정감을 줘요."], growth: ["갑작스러운 변화가 불편할 수 있어요.", "마음을 말로 표현하는 데 시간이 걸려요."] },
  ISFJ: { summary: "곁의 사람을 세심하게 살피고 묵묵히 챙겨요.", strengths: ["필요한 것을 먼저 알아채요.", "꾸준하고 성실해요."], growth: ["내 필요를 말하지 못하고 참기 쉬워요.", "부탁을 거절하기 어려울 수 있어요."] },
  ESTJ: { summary: "체계를 세우고 일을 확실하게 끝맺어요.", strengths: ["조직하고 관리하는 능력이 좋아요.", "결정을 미루지 않아요."], growth: ["내 방식이 정답처럼 들릴 수 있어요.", "감정을 다루는 대화가 어색할 수 있어요."] },
  ESFJ: { summary: "사람 사이의 조화를 만들고 다정하게 챙겨요.", strengths: ["분위기를 따뜻하게 만들어요.", "함께하는 일을 잘 꾸려요."], growth: ["다른 사람의 평가에 마음이 흔들리기 쉬워요.", "갈등을 피하려다 속앓이를 할 수 있어요."] },
  ISTP: { summary: "상황을 침착하게 관찰하고 필요한 만큼 움직여요.", strengths: ["위기에서 실용적인 해법을 찾아요.", "손과 몸으로 익히는 데 강해요."], growth: ["감정을 잘 드러내지 않아 거리감이 생길 수 있어요.", "장기 계획이 답답하게 느껴질 수 있어요."] },
  ISFP: { summary: "지금 이 순간의 감각과 마음을 소중히 여겨요.", strengths: ["섬세한 미적 감각이 있어요.", "상대를 있는 그대로 받아들여요."], growth: ["갈등 앞에서 물러서기 쉬워요.", "계획과 마감이 부담스러울 수 있어요."] },
  ESTP: { summary: "현장에서 빠르게 판단하고 바로 움직여요.", strengths: ["순발력과 행동력이 좋아요.", "분위기를 읽고 대응해요."], growth: ["결과를 오래 기다리는 일이 지루할 수 있어요.", "말이 앞서 오해를 살 수 있어요."] },
  ESFP: { summary: "사람과 함께하는 즐거움을 만들고 나눠요.", strengths: ["주변에 활기를 불어넣어요.", "지금 필요한 도움을 바로 줘요."], growth: ["먼 계획을 세우는 일이 버거울 수 있어요.", "싫은 소리를 듣는 것이 힘들 수 있어요."] },
};

/** 네 가지 선호 — 에너지 · 인식 · 판단 · 생활 방식 */
export const AXIS: Record<MbtiLetter, { axis: SelfReportedMBTI["axes"][number]["axis"]; title: string; text: string }> = {
  E: { axis: "energy", title: "에너지", text: "사람과 바깥 활동에서 에너지를 얻는 편이에요." },
  I: { axis: "energy", title: "에너지", text: "혼자만의 시간에서 에너지를 회복하는 편이에요." },
  S: { axis: "perception", title: "인식", text: "구체적인 사실과 경험을 먼저 보는 편이에요." },
  N: { axis: "perception", title: "인식", text: "가능성과 의미, 큰 그림을 먼저 보는 편이에요." },
  T: { axis: "judgement", title: "판단", text: "결정할 때 논리와 원칙을 먼저 세우는 편이에요." },
  F: { axis: "judgement", title: "판단", text: "결정할 때 사람과 가치를 먼저 살피는 편이에요." },
  J: { axis: "lifestyle", title: "생활 방식", text: "계획을 세우고 마무리 짓는 것을 선호해요." },
  P: { axis: "lifestyle", title: "생활 방식", text: "상황에 맞춰 열어 두는 것을 선호해요." },
};

/** 같은 글자일 때의 공통점 / 다른 글자일 때의 차이점 문장 */
export const LETTER_COMMON: Record<MbtiLetter, string> = {
  E: "사람과 함께할 때 힘을 얻는 모습",
  I: "혼자만의 시간에서 힘을 얻는 모습",
  S: "구체적인 경험을 믿는 현실 감각",
  N: "깊이 있는 사고와 통찰력",
  T: "논리로 길을 정리하는 판단",
  F: "사람과 가치를 살피는 따뜻한 판단",
  J: "이상을 현실로 만들고자 하는 의지",
  P: "흐름에 맞춰 길을 여는 유연함",
};

const AXIS_DIFF: Record<SelfReportedMBTI["axes"][number]["axis"], (ref: MbtiLetter, sel: MbtiLetter, r: string, s: string) => string> = {
  energy: (ref, _s, r, s) => `${r}는 ${ref === "E" ? "바깥에서" : "혼자서"} 에너지를 채우고, ${s}는 ${ref === "E" ? "혼자서" : "바깥에서"} 채우는 쪽이에요.`,
  perception: (ref, _s, r, s) => `${r}는 ${ref === "N" ? "가능성과 의미" : "구체적인 사실"}을, ${s}는 ${ref === "N" ? "구체적인 사실" : "가능성과 의미"}을 먼저 봐요.`,
  judgement: (ref, _s, r, s) => `${r}는 ${ref === "F" ? "사람과의 조화와 공감" : "논리와 원칙"}을, ${s}는 ${ref === "F" ? "논리적이고 전략적인 판단" : "사람과의 조화와 공감"}을 중시해요.`,
  lifestyle: (ref, _s, r, s) => `${r}는 ${ref === "J" ? "계획하고 매듭짓는" : "열어 두고 맞춰 가는"} 박자, ${s}는 ${ref === "J" ? "열어 두고 맞춰 가는" : "계획하고 매듭짓는"} 박자예요.`,
};

export const isLetter = (c: string): c is MbtiLetter => "EISNTFJP".includes(c);

export function axisDifference(ref: MbtiLetter, sel: MbtiLetter, refType: string, selType: string) {
  return AXIS_DIFF[AXIS[ref].axis](ref, sel, refType, selType);
}

/** 에너지(E/I) × 판단(F/T) 으로 본 관계 방식 */
export const RELATION_STYLE: Record<string, string> = {
  EF: "사람 사이에서 마음을 나누며 가까워지는 편이에요. 분위기를 따뜻하게 만드는 역할을 자주 맡아요.",
  ET: "함께 일하며 가까워지는 편이에요. 솔직하고 분명한 대화를 편하게 느껴요.",
  IF: "소수의 사람과 깊게 이어지는 편이에요. 마음을 열기까지 시간이 걸리지만, 한번 열면 오래가요.",
  IT: "거리를 존중하는 관계를 편하게 느껴요. 말보다 믿을 만한 행동으로 신뢰를 쌓는 편이에요.",
};
