import { ELEMENTS, ELEMENT_ORDER, elementLabel } from "./elements";
import { AXIS, LETTER_COMMON, MBTI_TEXT, axisDifference, isLetter } from "./mbti";
import { DAY_MASTER_TRAITS, REFERENCE_MBTI_NOTE } from "./personality";
import { DEMO_PROFILE } from "./provider";
import type {
  ConsultationProfile,
  ResultPayload,
  SajuMBTIReference,
  ElementKey,
  FiveElementDistribution,
  IntegratedInsight,
  ManseResult,
  MbtiLetter,
  SajuMBTIComparison,
  SajuPersonality,
  SelfReportedMBTI,
} from "./types";

/* ──────────────────────────────────────────────────────────
   결과 카드 6종 데이터 만들기
   ManseResult(샘플이든 HRUM 계산이든) + 사용자가 고른 MBTI → ReadingResult
   화면은 ReadingResult 만 받아 그리므로, 데이터 출처가 바뀌어도 UI 는 그대로
   ────────────────────────────────────────────────────────── */

const RATIO_METHOD = (basis: number) =>
  `천간·지지 ${basis}글자를 한 글자씩 같은 무게로 센 개수 비율이에요.`;
const RATIO_LIMITS = [
  "지지 속에 숨은 기운(지장간)은 넣지 않았어요.",
  "태어난 계절(월령)에 따른 힘의 차이는 반영하지 않았어요.",
];

/** 개수 → 합계 100 인 정수 비율 (최대 나머지 방식) */
function toPercents(counts: { key: ElementKey; count: number }[], basis: number) {
  if (basis === 0) return counts.map((c) => ({ key: c.key, percent: 0 }));
  const raw = counts.map((c) => ({ key: c.key, exact: (c.count / basis) * 100 }));
  const floor = raw.map((r) => ({ key: r.key, percent: Math.floor(r.exact), rem: r.exact - Math.floor(r.exact) }));
  let left = 100 - floor.reduce((s, r) => s + r.percent, 0);
  [...floor].sort((a, b) => b.rem - a.rem).forEach((r) => {
    if (left > 0 && r.rem > 0) {
      r.percent++;
      left--;
    }
  });
  return floor.map(({ key, percent }) => ({ key, percent }));
}

export function buildElements(manse: ManseResult): FiveElementDistribution {
  const e = manse.elements;
  return {
    ...e,
    ratios: toPercents(e.counts, e.basis),
    method: RATIO_METHOD(e.basis),
    limits: manse.hourKnown ? RATIO_LIMITS : ["태어난 시간을 몰라 시주 두 글자를 빼고 6글자로만 셌어요.", ...RATIO_LIMITS],
  };
}

export function buildPersonality(manse: ManseResult): SajuPersonality {
  const dm = manse.dayMaster;
  const t = DAY_MASTER_TRAITS[dm.hanja] ?? DAY_MASTER_TRAITS["乙"];
  return {
    isSample: manse.isSample,
    source: manse.source,
    dayMaster: dm,
    title: `${dm.hangul}${ELEMENTS[dm.element].hangul} ${dm.hanja}${ELEMENTS[dm.element].hanja}`,
    image: t.image,
    summary: t.summary,
    core: t.core,
    strengths: t.strengths,
    cautions: t.cautions,
    keywords: t.keywords,
  };
}

/**
 * 사주 기반 참고 MBTI — 운결 자체 비유 분류
 * 분류 규칙(일간 → 유형 표)이 아직 확정되지 않아 ruleStatus 는 "draft"
 */
export function buildReference(manse: ManseResult): SajuMBTIReference {
  const dm = manse.dayMaster;
  const t = DAY_MASTER_TRAITS[dm.hanja] ?? DAY_MASTER_TRAITS["乙"];
  return {
    type: t.referenceMbti,
    reason: t.reason,
    basis: [`일간 ${dm.hanja}${ELEMENTS[dm.element].hanja}(${dm.hangul}${ELEMENTS[dm.element].hangul})`, `전통 비유 ‘${t.image}’`, `핵심 키워드 ${t.keywords.join(" · ")}`],
    method: "ungyeol-day-master-analogy",
    ruleStatus: "draft",
    note: REFERENCE_MBTI_NOTE,
  };
}

export function buildCurrent(mbti: string | null): SelfReportedMBTI {
  if (!mbti || !MBTI_TEXT[mbti]) return { type: null, source: "user-selected", strengths: [], growth: [], axes: [] };
  const t = MBTI_TEXT[mbti];
  return {
    type: mbti,
    source: "user-selected",
    summary: t.summary,
    strengths: t.strengths,
    growth: t.growth,
    axes: mbti
      .split("")
      .filter(isLetter)
      .map((l) => ({ axis: AXIS[l].axis, letter: l, title: AXIS[l].title, text: AXIS[l].text })),
  };
}

const AXIS_QUESTION: Record<string, string> = {
  energy: "요즘 나는 에너지를 모으는 시기인가요, 뻗어 나가는 시기인가요?",
  perception: "최근의 선택에서 눈앞의 사실과 앞으로의 가능성 중 무엇을 더 믿었나요?",
  judgement: "최근의 결정에서 논리와 마음 중 무엇이 더 크게 작용했나요?",
  lifestyle: "계획대로 되지 않았던 일이 오히려 좋은 방향으로 흘러간 적이 있나요?",
};

const GENERIC_COMMON = [
  "상황에 따라 다른 얼굴을 꺼내 쓸 수 있는 넓은 폭",
  "스스로를 더 알고 싶어 하는 마음",
];
const GENERIC_DIFF = [
  "사주는 타고난 바탕을, MBTI는 지금의 선호를 보여줘요.",
  "참고 MBTI는 비유라, 다르다고 틀린 것은 아니에요.",
  "같은 사람도 시기에 따라 다른 선호를 꺼내 써요.",
];

export function buildComparison(reference: string, selected: string | null): SajuMBTIComparison {
  if (!selected) {
    return {
      reference,
      selected: null,
      relation: "unknown",
      sameLetters: [],
      common: [],
      differences: [],
      insight: "MBTI를 알게 되면 두 유형을 나란히 놓고 비교할 수 있어요. 지금은 참고 MBTI를 거울삼아 스스로를 살펴보세요.",
      questions: [
        `참고 MBTI ${reference}의 네 글자 중, 나와 닮았다고 느끼는 글자는 무엇인가요?`,
        AXIS_QUESTION.energy,
        AXIS_QUESTION.judgement,
      ],
    };
  }
  const r = reference.split("") as MbtiLetter[];
  const s = selected.split("") as MbtiLetter[];
  const same = r.filter((l, i) => l === s[i]);
  const diffIdx = r.map((l, i) => (l !== s[i] ? i : -1)).filter((i) => i >= 0);

  const common = [...same.map((l) => LETTER_COMMON[l]), ...GENERIC_COMMON].slice(0, 3);
  const differences = [...diffIdx.map((i) => axisDifference(r[i], s[i], reference, selected)), ...GENERIC_DIFF].slice(0, 3);
  const questions = [...diffIdx.map((i) => AXIS_QUESTION[AXIS[r[i]].axis]), "두 결 중 요즘 더 자주 꺼내 쓰는 쪽은 어느 쪽인가요?", AXIS_QUESTION.energy]
    .filter((q, i, a) => a.indexOf(q) === i)
    .slice(0, 3);

  const relation = diffIdx.length === 0 ? "same" : "different";
  const insight =
    relation === "same"
      ? "타고난 결과 지금의 결이 같은 방향을 가리켜요. 그만큼 한쪽으로 치우치지 않는지 가끔 살펴보면 좋아요."
      : `${reference}의 결과 ${selected}의 결을 함께 지닌 셈이에요. 다른 글자는 상황에 따라 꺼내 쓰는 또 하나의 도구가 될 수 있어요.`;

  return { reference, selected, relation, sameLetters: same, common, differences, insight, questions };
}

const STRONG_WORD: Record<ElementKey, { word: string; icon: IntegratedInsight["keywords"][number]["icon"] }> = {
  wood: { word: "성장", icon: "leaf" },
  fire: { word: "열정", icon: "spark" },
  earth: { word: "안정", icon: "root" },
  metal: { word: "기준", icon: "balance" },
  water: { word: "지혜", icon: "wave" },
};
const FILL_WORD: Record<ElementKey, { word: string; icon: IntegratedInsight["keywords"][number]["icon"]; how: string }> = {
  wood: { word: "시작", icon: "leaf", how: "작게라도 새로 시작해 보는 것" },
  fire: { word: "표현", icon: "spark", how: "마음을 말과 표정으로 꺼내 보는 것" },
  earth: { word: "중심", icon: "root", how: "하루의 리듬을 일정하게 지키는 것" },
  metal: { word: "정리", icon: "balance", how: "미뤄 둔 일을 하나씩 매듭짓는 것" },
  water: { word: "휴식", icon: "wave", how: "생각을 멈추고 충분히 쉬어 가는 것" },
};

export function buildInsight(manse: ManseResult, p: SajuPersonality, c: SajuMBTIComparison): IntegratedInsight {
  const strong = STRONG_WORD[p.dayMaster.element];
  const weakKey = ELEMENT_ORDER.find((k) => manse.elements.weakest.includes(k)) ?? "metal";
  const fill = FILL_WORD[weakKey];
  const third =
    c.relation === "unknown" ? { word: "탐색", icon: "wave" as const } : c.relation === "same" ? { word: "확장", icon: "leaf" as const } : { word: "균형", icon: "heart" as const };
  const words = [strong, third, fill].filter((w, i, a) => a.findIndex((x) => x.word === w.word) === i);
  while (words.length < 3) words.push({ word: "쉼", icon: "wave" });

  const weakLabel = manse.elements.weakest.map(elementLabel).join("·");
  const summary =
    c.selected === null
      ? `${p.image}처럼, ${p.keywords[0]}과 ${p.keywords[1]}을 바탕에 둔 결이에요.`
      : c.relation === "same"
        ? `${p.keywords[0]}을 바탕에 둔 타고난 결과, ${c.selected}로 살아가는 지금의 결이 같은 방향을 보고 있어요.`
        : `${p.keywords[0]}을 바탕에 둔 타고난 결 위에서, 지금은 ${c.selected}의 방식으로 세상과 만나고 있어요.`;
  const advice = `상대적으로 적게 나타난 ${weakLabel} 기운은 ${fill.how}으로 채워 볼 수 있어요. 너무 완벽하려 하기보다, 두 결 사이에서 나에게 맞는 균형을 찾아가 보세요.`;

  return {
    isSample: manse.isSample,
    source: manse.source,
    keywords: words.slice(0, 3),
    summary,
    advice,
    strength: p.strengths[0],
    explore: c.questions[0] ?? "요즘 나를 가장 크게 자라게 한 일은 무엇이었나요?",
    topics: [
      { id: "overall", label: "종합운" },
      { id: "love", label: "연애·인연운" },
      { id: "reunion", label: "재회운" },
      { id: "compat", label: "궁합" },
      { id: "wealth", label: "재물운" },
      { id: "career", label: "직업·적성" },
      { id: "relation", label: "인간관계" },
      { id: "year2027", label: "2027년 신년운세" },
    ],
  };
}

/**
 * 결과 묶음 만들기
 * - manse.isSample(데모 사주)이면 resultStatus 는 항상 "demo" — 실제 계산 전에는 "calculated" 로 바꾸지 않음
 * - 생년월일이 없으면 "unavailable"
 */
export function buildResultPayload(manse: ManseResult, profile: Pick<ConsultationProfile, "mbti" | "birth">): ResultPayload {
  const mbti = profile.mbti;
  const sajuPersonality = buildPersonality(manse);
  const sajuMBTIReference = buildReference(manse);
  const comparison = buildComparison(sajuMBTIReference.type, mbti);
  const resultStatus = !profile.birth ? "unavailable" : manse.isSample ? "demo" : "calculated";
  return {
    resultStatus,
    demo: manse.isSample ? DEMO_PROFILE : null,
    mixesUserMbti: manse.isSample && !!mbti,
    manseResult: manse,
    fiveElements: buildElements(manse),
    sajuPersonality,
    sajuMBTIReference,
    selfReportedMBTI: buildCurrent(mbti),
    comparison,
    integratedInsight: buildInsight(manse, sajuPersonality, comparison),
  };
}
