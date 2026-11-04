import { CHAPTER_ASKS, CHAPTER_META, type ChapterMeta } from "@/content/report/chapters";
import { MBTI_TYPES, type Profile } from "@/features/chat/types";
import { BRANCHES, ELEMENTS, ELEMENT_ORDER, STEMS, elementLabel } from "@/features/saju/elements";
import { AXIS, RELATION_STYLE, isLetter } from "@/features/saju/mbti";
import { DAY_MASTER_TRAITS } from "@/features/saju/personality";
import { getLiveEntry } from "@/features/saju/live";
import { getSampleManse } from "@/features/saju/provider";
import { buildResultPayload } from "@/features/saju/reading";
import { elementOf, relationTo, type GodGroup } from "@/features/saju/relations";
import { TOPICS } from "@/features/saju/topics";
import { isDemo, type ElementKey, type MbtiLetter, type ResultPayload } from "@/features/saju/types";
import type { DataSlot, Report, ReportChapter, ReportId, ReportMetadata, ReportSection, ReportVisual } from "./types";

/* ──────────────────────────────────────────────────────────
   ResultPayload → 12챕터 리포트
   - 본문은 결과 데이터에서 계산 (일간 · 오행 개수 · 십성 갈래 · MBTI 글자)
   - 같은 문장을 챕터마다 되풀이하지 않도록, 챕터마다 다른 근거를 씀
   - 계산이 필요한데 아직 없는 것(대운 · 세운 · 두 사람 사주 비교 · 개인 월운)은 미연결 칸으로 남김
   ────────────────────────────────────────────────────────── */

const SAMPLE_MBTI = "INFP";

/** 리포트에 필요한 상담 정보 (개인정보는 메타데이터에 넣지 않음) */
export type ReportInput = {
  mbti: string | null;
  timeUnknown: boolean;
  partner: Profile["partner"];
  topic: string;
};

export function sampleInput(): ReportInput {
  return { mbti: SAMPLE_MBTI, timeUnknown: false, partner: undefined, topic: "integrated" };
}

export function inputFromProfile(p: Profile, topic: string): ReportInput {
  return { mbti: p.mbti ?? null, timeUnknown: p.time === null, partner: p.partner, topic };
}

/* ── 도움 함수 ── */

const ctx = (r: ResultPayload) => {
  const dm = r.sajuPersonality.dayMaster;
  const count = (k: ElementKey) => r.fiveElements.counts.find((c) => c.key === k)?.count ?? 0;
  const god = (g: GodGroup) => {
    const el = elementOf(dm.element, g);
    return { el, label: elementLabel(el), count: count(el) };
  };
  return { dm, count, god, basis: r.fiveElements.basis, letters: (r.selfReportedMBTI.type ?? "").split("").filter(isLetter) as MbtiLetter[] };
};

const demoSlot = (r: ResultPayload, what: string): DataSlot =>
  isDemo(r)
    ? { status: "demo", label: "데모 사주 · 계산 미연결", detail: `${r.demo?.label ?? "샘플 사주"} 기준의 예시예요. 만세력 계산이 연결되면 입력하신 정보로 계산한 ${what}가 이 자리에 들어와요.` }
    : { status: "calculated", label: "실제 만세력 계산 (HRUM)", detail: `입력하신 생년월일로 계산한 원국이에요. ${what} 해석은 운결 해설표 기준이에요.` };

const unconnected = (label: string, detail: string, needs: string[]): DataSlot => ({ status: "unconnected", label, detail, needs });

const amount = (n: number, basis: number) => (n === 0 ? "없어요" : n >= Math.max(3, Math.ceil(basis * 0.35)) ? `${n}글자로 많은 편이에요` : n === 1 ? "1글자로 적은 편이에요" : `${n}글자예요`);

const PILLAR_READ: Record<string, string> = {
  year: "뿌리 — 집안의 배경과 어린 시절의 환경",
  month: "줄기 — 자라 온 환경, 사회 속 모습, 태어난 계절",
  day: "꽃 — 나 자신(일간)과 가장 가까운 관계",
  hour: "열매 — 앞으로의 방향, 아랫사람과의 관계, 삶의 후반부",
};

/* ── 챕터별 ── */

function ch01(meta: ChapterMeta, r: ResultPayload): Partial<ReportChapter> {
  const { dm, count, basis } = ctx(r);
  const pillars = [...r.manseResult.pillars].reverse(); // 년 → 시
  const strong = r.fiveElements.strongest.map(elementLabel).join("·");
  return {
    summary: `중심 글자는 일간 ${r.sajuPersonality.title}. ${basis}글자 가운데 ${strong} 기운이 가장 많이 놓였어요.`,
    dataSlot: demoSlot(r, "원국"),
    sections: [
      {
        id: "pillars",
        title: "네 기둥을 읽는 순서",
        body: ["만세력은 년주에서 시주 쪽으로 읽어요. 전통적으로는 뿌리 · 줄기 · 꽃 · 열매에 빗대어, 삶의 시기와 관계의 자리를 나눠 봐요."],
        list: pillars.map((p) => `${p.label} ${p.stem && p.branch ? `${p.stem.hanja}${p.branch.hanja}` : "미확정"} · ${PILLAR_READ[p.key]}`),
      },
      {
        id: "day-master",
        title: "일간, ‘나’를 나타내는 글자",
        body: [
          `일간은 태어난 날의 천간이에요. 이 원국의 일간은 ${dm.hanja}(${dm.hangul}) — ${dm.yinYang === "yin" ? "음(陰)" : "양(陽)"}의 ${ELEMENTS[dm.element].hangul}(${ELEMENTS[dm.element].hanja}) 기운이에요.`,
          `사주는 이 한 글자를 기준으로 나머지 글자가 나를 돕는지, 내가 만들어 내는지, 나를 다듬는지를 읽어요. 아래 표는 그 다섯 갈래를 원국의 글자 수와 함께 정리한 거예요.`,
        ],
        more: ["같은 오행이라도 음양이 다르면 결이 달라요. 예를 들어 같은 목(木)이라도 갑(甲)은 곧게 뻗는 나무, 을(乙)은 휘어지며 자라는 덩굴로 비유해요."],
      },
      {
        id: "time",
        title: r.manseResult.hourKnown ? "태어난 시간에 대해" : "태어난 시간을 모를 때",
        body: r.manseResult.hourKnown
          ? ["시주는 두 시간 단위로 바뀌어요. 경계 시각 가까이 태어났다면 시주가 달라질 수 있어, 정확한 시간을 한 번 더 확인해 보면 좋아요."]
          : [`시주 두 글자를 알 수 없어 ${basis}글자로 읽었어요. 오행 분포가 실제와 다를 수 있고, 시주로 읽는 삶의 후반부 · 아랫사람과의 관계는 이 리포트에서 다루지 않아요.`, "일간은 날짜로 정해지므로 기질의 큰 줄기는 그대로 볼 수 있어요."],
      },
    ],
    visuals: [
      { kind: "manse-table" },
      {
        kind: "ten-gods",
        rows: ELEMENT_ORDER.map((k) => {
          const rel = relationTo(dm.element, k);
          return { element: elementLabel(k), color: ELEMENTS[k].color, group: rel.name, text: rel.text, count: count(k) };
        }),
      },
    ],
    insight: {
      advisor: ["원국은 결론이 아니라 지도예요.", "지도를 펼쳤으니, 다음 장에서 그 길의 결을 함께 읽어 볼게요."],
      questions: ["네 기둥의 비유 중 지금의 나와 가장 닮았다고 느끼는 건 어느 쪽인가요?"],
    },
  };
}

function ch02(meta: ChapterMeta, r: ResultPayload): Partial<ReportChapter> {
  const p = r.sajuPersonality;
  const e = r.fiveElements;
  const strong = e.strongest.map((k) => `${elementLabel(k)}(${ELEMENTS[k].tendency})`).join(", ");
  const weak = e.weakest.map((k) => `${elementLabel(k)}(${ELEMENTS[k].tendency})`).join(", ");
  return {
    summary: p.summary,
    dataSlot: demoSlot(r, "기질 풀이"),
    sections: [
      { id: "image", title: "일간의 비유", body: [`${p.title} — 전통적으로 ‘${p.image}’에 비유해요.`, p.core] },
      { id: "strength", title: "드러나는 강점", body: [`원국에서 가장 많이 보이는 기운은 ${strong}이에요. 이 기운이 강점의 바탕이 돼요.`], list: p.strengths },
      {
        id: "caution",
        title: "보완이 필요한 결",
        body: [`상대적으로 적게 보이는 기운은 ${weak}이에요. 부족하다는 뜻이라기보다, 이 기운이 필요한 순간에 의식적으로 힘을 써야 할 수 있다는 뜻이에요.`],
        list: p.cautions,
        more: [`핵심 키워드 · ${p.keywords.join(" · ")}`],
      },
    ],
    visuals: [{ kind: "element-radar" }],
    insight: {
      advisor: ["강점과 보완점은 같은 결의 앞면과 뒷면이에요.", "어느 한쪽만 나라고 생각하지 않아도 괜찮아요."],
      practice: r.integratedInsight.advice,
      questions: ["최근에 ‘이건 나답다’고 느낀 순간은 언제였나요?"],
    },
  };
}

function ch03(meta: ChapterMeta, r: ResultPayload): Partial<ReportChapter> {
  const ref = r.sajuMBTIReference;
  const used = new Set(Object.values(DAY_MASTER_TRAITS).map((t) => t.referenceMbti));
  const missing = MBTI_TYPES.filter((t) => !used.has(t));
  const rows = Object.entries(DAY_MASTER_TRAITS).map(([stem, t]) => ({
    stem: `${stem} ${STEMS[stem].hangul}${ELEMENTS[STEMS[stem].element].hangul}`,
    image: t.image,
    type: t.referenceMbti,
    current: stem === r.sajuPersonality.dayMaster.hanja,
  }));
  return {
    summary: `이 원국의 참고 유형은 ${ref.type}예요. 운결이 일간의 전통적 비유를 MBTI의 말로 옮겨 본 자체 분류이고, 진단이 아니에요.`,
    dataSlot: { status: "demo", label: ref.ruleStatus === "draft" ? "운결 자체 분류 · 규칙 확정 전 시안" : "운결 자체 분류", detail: "분류 규칙이 확정되기 전이라, 표의 짝은 바뀔 수 있어요. 계산이나 검사로 나온 유형이 아니에요." },
    sections: [
      {
        id: "method",
        title: "운결의 참고 분류 방식",
        body: [
          "일간 열 개에는 전통적으로 쓰는 비유가 있어요. 운결은 그 이미지와 가장 닮은 MBTI 유형을 하나씩 짝지어 아래 표로 정리했어요.",
          "일간 한 글자만 보고 정하기 때문에, 오행 분포 · 태어난 계절 · 십성 구성은 이 분류에 반영되지 않아요.",
        ],
      },
      { id: "this", title: `이 원국의 참고 유형 · ${ref.type}`, body: [`${ref.reason}이에요.`], list: ref.basis.map((b) => `근거 · ${b}`) },
      {
        id: "limits",
        title: "이 분류가 말할 수 없는 것",
        body: ["참고 유형은 대화를 시작하기 위한 비유예요. 아래 한계를 함께 읽어 주세요."],
        list: [
          "사주와 MBTI 사이의 관계는 과학적으로 검증된 인과관계가 아니에요.",
          "MBTI 공식 검사와 무관하고, 검사 결과를 대신하지 않아요.",
          `일간 열 개에 하나씩 짝지었기 때문에 열여섯 유형 중 ${missing.length}개(${missing.join(" · ")})는 참고 유형으로 나오지 않아요.`,
          "같은 일간이면 누구나 같은 참고 유형이 나와요. 개인의 차이는 4장에서 직접 고른 MBTI와 비교하며 살펴봐요.",
        ],
      },
    ],
    visuals: [{ kind: "reference-rules", rows, missing }],
    insight: {
      advisor: ["참고 유형은 정답이 아니라 거울이에요.", "다음 장에서 직접 고르신 MBTI와 나란히 놓아 볼게요."],
      questions: ["표의 비유 중 나와 가장 닮았다고 느끼는 일간은 무엇인가요? 꼭 이 원국의 일간이 아니어도 괜찮아요."],
    },
  };
}

function ch04(meta: ChapterMeta, r: ResultPayload): Partial<ReportChapter> {
  const c = r.comparison;
  const ref = c.reference.split("") as MbtiLetter[];
  const sel = c.selected ? (c.selected.split("") as MbtiLetter[]) : null;
  const rows = ref.map((l, i) => ({ axis: AXIS[l].title, left: `${l} · ${AXIS[l].text.replace(/편이에요\.|선호해요\./, "").trim()}`, right: sel ? `${sel[i]} · ${AXIS[sel[i]].text.replace(/편이에요\.|선호해요\./, "").trim()}` : null, same: sel ? sel[i] === l : null }));
  const sections: ReportSection[] =
    c.relation === "unknown"
      ? [
          { id: "selected", title: "직접 고른 MBTI", body: ["MBTI를 고르지 않으셨어요. 그래서 이 장은 참고 유형을 거울삼아 스스로 살펴보는 질문으로 진행해요.", "운결은 MBTI 검사를 제공하지 않아요. 알게 되면 상담에서 알려주세요."] },
          { id: "mirror", title: `참고 유형 ${c.reference}를 거울삼아`, body: ["아래 표의 네 글자를 하나씩 읽으며, 나와 닮은 글자와 다른 글자를 떠올려 보세요."] },
        ]
      : [
          { id: "selected", title: `직접 고른 MBTI · ${c.selected}`, body: [r.selfReportedMBTI.summary ?? "", r.mixesUserMbti ? "MBTI는 직접 고르신 값 그대로이고, 비교 상대인 참고 유형은 데모 사주에서 나온 것이에요." : ""].filter(Boolean) },
          { id: "common", title: c.relation === "same" ? "같은 유형이에요" : "닮은 점", body: [c.relation === "same" ? `네 글자가 모두 같아요. ${c.insight}` : `네 글자 중 ${c.sameLetters.length}글자가 같아요.`], list: c.common },
          { id: "diff", title: c.relation === "same" ? "같은 유형이라도 살펴볼 것" : "다른 점", body: [c.relation === "same" ? "글자가 같아도 쓰이는 상황은 다를 수 있어요." : "다른 글자는 같은 상황에서 다른 선택을 하는 지점이에요."], list: c.differences },
        ];
  return {
    summary: c.relation === "unknown" ? `참고 유형 ${c.reference}만 있어요. 직접 고른 MBTI가 없어, 스스로 살펴보는 질문으로 비교해요.` : c.insight,
    dataSlot: { status: "demo", label: c.selected ? "혼합 데모 · 직접 고른 MBTI + 데모 사주" : "데모 사주 · MBTI 미선택", detail: "참고 유형은 데모 사주의 일간에서 나온 운결 자체 분류(시안)예요." },
    sections,
    visuals: [{ kind: "compare-card" }, { kind: "letter-compare", left: { label: "사주 기반 참고", type: c.reference }, right: { label: c.selected ? "직접 고른 MBTI" : "MBTI 미선택", type: c.selected }, rows }],
    insight: {
      advisor: c.relation === "different" ? ["두 결이 다르다는 건, 고를 수 있는 길이 두 갈래라는 뜻이기도 해요."] : c.relation === "same" ? ["두 결이 같은 곳을 가리킬 때는 그 방향을 믿어 보되, 반대편의 목소리도 가끔 들어 보세요."] : ["MBTI를 몰라도 괜찮아요. 질문에 답하다 보면 지금의 결이 조금씩 보여요."],
      questions: c.questions,
    },
  };
}

function topicChapter(id: "05" | "07" | "08" | "09", r: ResultPayload): Partial<ReportChapter> {
  const { dm, god, letters, basis } = ctx(r);
  const has = (l: MbtiLetter) => letters.includes(l);
  const mbti = r.selfReportedMBTI.type;
  if (id === "05") {
    const out = god("식상");
    const t = TOPICS.love;
    return {
      summary: t.lines[0],
      dataSlot: unconnected("시기별 흐름 · 미연결", "인연이 닿기 쉬운 시기는 대운 · 세운 계산이 필요해요. 만세력 연결 전에는 보여드리지 않아요.", ["생년월일시", "성별", "대운 · 세운 계산"]),
      sections: [
        { id: "temper", title: "관계에서 드러나는 기질", body: [`${r.sajuPersonality.title}의 결은 관계에서 ‘${r.sajuPersonality.keywords[1] ?? r.sajuPersonality.keywords[0]}’로 드러나기 쉬워요.`, t.lines[1] ?? ""].filter(Boolean) },
        {
          id: "express",
          title: "감정을 표현하는 방식",
          body: [`마음을 밖으로 꺼내는 기운(식상)은 일간 ${dm.hanja} 기준으로 ${out.label}이고, 원국에 ${amount(out.count, basis)}.`, mbti ? `직접 고르신 ${mbti}의 판단 선호(${has("F") ? "F · 사람과 가치를 먼저" : "T · 논리와 원칙을 먼저"})도 표현 방식에 영향을 줘요.` : "MBTI를 고르지 않아 판단 선호는 함께 보지 않았어요."],
        },
      ],
      visuals: [],
      insight: { advisor: ["사랑의 방식에는 정답이 없어요. 나에게 편한 속도를 아는 게 먼저예요."], practice: t.practice, questions: ["가장 편안했던 관계는 어떤 속도로 가까워졌나요?"] },
    };
  }
  if (id === "07") {
    const w = god("재성");
    const t = TOPICS.wealth;
    return {
      summary: `일간 ${dm.hanja} 기준 재성은 ${w.label} — 원국에 ${amount(w.count, basis)}. 재물을 대하는 방식의 차이로 읽어요.`,
      dataSlot: demoSlot(r, "재성 분석"),
      sections: [
        { id: "wealth-star", title: "재성(財星)으로 본 전통적 해석", body: ["사주에서는 일간이 다스리는 기운을 재성이라 하고, 재물 · 성과 · 현실을 다루는 힘으로 읽어요.", `이 원국에서 재성은 ${w.label}이고 ${amount(w.count, basis)}.`, "이 풀이는 투자나 재무 조언이 아니에요."] },
        {
          id: "spend",
          title: "소비 · 저축 성향",
          body: mbti
            ? [`${has("J") ? "J — 계획을 세우고 지키는 쪽이라, 예산을 정해 두면 마음이 편한 편이에요." : "P — 상황에 맞춰 쓰는 쪽이라, 큰 틀만 정해 두고 여유를 남기면 좋아요."}`, `${has("S") ? "S — 눈앞의 필요를 먼저 챙기는 편이에요." : "N — 앞으로의 가능성에 쓰는 돈을 아끼지 않는 편이에요."}`]
            : ["MBTI를 고르지 않아 소비 성향은 질문으로 대신해요: 계획을 세워 쓰는 편인가요, 그때그때 쓰는 편인가요?"],
        },
        { id: "chance", title: "기회를 대하는 태도", body: [t.lines[0], t.lines[1] ?? ""].filter(Boolean) },
      ],
      visuals: [],
      insight: { advisor: ["돈을 대하는 습관은 나를 대하는 습관과 닮아 있어요."], practice: t.practice, questions: ["최근에 쓴 돈 중 가장 만족스러웠던 건 무엇이었나요?"] },
    };
  }
  if (id === "08") {
    const out = god("식상");
    const off = god("관성");
    const t = TOPICS.career;
    return {
      summary: t.lines[0],
      dataSlot: demoSlot(r, "적성 분석"),
      sections: [
        { id: "gods", title: "식상 · 관성으로 본 일의 결", body: [`만들어 내는 힘(식상, ${out.label})은 ${amount(out.count, basis)}. 규범과 책임을 다루는 힘(관성, ${off.label})은 ${amount(off.count, basis)}.`, out.count >= off.count ? "자유롭게 만들어 내는 일에서 힘이 나기 쉬운 구성으로 읽어요." : "체계와 기준이 분명한 환경에서 힘이 나기 쉬운 구성으로 읽어요."] },
        { id: "style", title: "업무 스타일", body: mbti ? [AXIS[has("J") ? "J" : "P"].text, AXIS[has("T") ? "T" : "F"].text] : ["MBTI를 고르지 않아 업무 스타일은 질문으로 대신해요."], more: t.lines.slice(1) },
        { id: "shift", title: "전환을 고민할 때", body: ["결정을 대신하진 않아요. 대신 아래 질문으로 지금 자리와 원하는 자리를 비교해 보세요."], list: ["지금 일에서 가장 힘이 나는 순간은?", "반대로 가장 힘이 빠지는 순간은?", "옮긴다면 꼭 지키고 싶은 조건 한 가지는?"] },
      ],
      visuals: [],
      insight: { advisor: ["직업 이름보다 ‘일하는 방식’이 맞는지가 더 오래가요."], practice: t.practice, questions: ["다시 해도 좋을 것 같은 일은 무엇이었나요?"] },
    };
  }
  // 09
  const peer = god("비겁");
  const help = god("인성");
  const t = TOPICS.relation;
  const style = letters.length === 4 ? RELATION_STYLE[`${letters[0]}${letters[2]}`] : null;
  return {
    summary: t.lines[0],
    dataSlot: demoSlot(r, "관계 분석"),
    sections: [
      { id: "gods", title: "비겁 · 인성으로 본 관계의 결", body: [`나와 같은 기운(비겁, ${peer.label})은 ${amount(peer.count, basis)}. 나를 돕는 기운(인성, ${help.label})은 ${amount(help.count, basis)}.`, peer.count > help.count ? "스스로 서는 힘이 강한 대신, 기대거나 도움을 청하는 걸 어려워할 수 있어요." : "도움을 주고받는 관계에서 편안함을 느끼기 쉬운 구성으로 읽어요."] },
      { id: "style", title: "대인관계 방식", body: [style ?? "MBTI를 고르지 않아 대인관계 방식은 질문으로 대신해요.", t.lines[1] ?? ""].filter(Boolean) },
    ],
    visuals: [],
    insight: { advisor: ["모든 사람과 가까울 필요는 없어요. 편한 거리를 아는 것도 관계의 힘이에요."], practice: t.practice, questions: ["요즘 나에게 힘이 되는 사람은 누구인가요?"] },
  };
}

function ch06(meta: ChapterMeta, r: ResultPayload, input: ReportInput): Partial<ReportChapter> {
  const p = input.partner;
  const pm = p?.mbti ?? null;
  const me = r.selfReportedMBTI.type;
  const partnerState: ReportMetadata["basis"]["partner"] = !p ? "none" : p.birth && p.mbti ? "birth-mbti" : p.birth ? "birth" : "mbti-only";
  const visuals: ReportVisual[] = [];
  if (pm && me) {
    const a = me.split("") as MbtiLetter[];
    const b = pm.split("") as MbtiLetter[];
    visuals.push({ kind: "letter-compare", left: { label: "나 (직접 고른 MBTI)", type: me }, right: { label: "상대 MBTI", type: pm }, rows: a.map((l, i) => ({ axis: AXIS[l].title, left: l, right: b[i], same: l === b[i] })) });
  }
  return {
    summary: partnerState === "none" ? "상대 정보가 없어, 나의 관계 패턴을 중심으로 정리했어요. 두 사람의 비교는 상대 정보가 있을 때 따로 안내해요." : "상대 정보를 받았어요. MBTI 글자 비교는 지금 볼 수 있고, 두 사람의 사주 비교는 만세력 연결 후에 열려요.",
    dataSlot:
      partnerState === "none"
        ? { status: "needs-input", label: "상대 정보 없음", detail: "재회 · 궁합 상담에서 상대의 생년월일이나 MBTI를 알려주시면 비교할 수 있어요. 모두 선택 사항이에요.", needs: ["상대 생년월일 (선택)", "상대 MBTI (선택)"] }
        : unconnected("두 사람의 사주 비교 · 미연결", "상대 생년월일로 원국을 계산해야 비교할 수 있어요. 만세력 연결 전에는 보여드리지 않아요.", ["두 사람의 만세력 계산"]),
    sections: [
      { id: "pattern", title: isDemo(r) ? "샘플 사주로 본 관계 패턴" : "나의 관계 패턴", body: [TOPICS.reunion.lines[0], TOPICS.compat.lines[0]] },
      {
        id: "partner",
        title: partnerState === "none" ? "상대 정보가 있으면" : "상대 정보로 볼 수 있는 것",
        body:
          partnerState === "none"
            ? ["상대의 생년월일을 알면 두 원국의 오행을 나란히 놓고, MBTI를 알면 네 글자를 비교할 수 있어요.", "상대 정보는 모두 선택이고, 입력하지 않아도 이 장의 나머지는 읽을 수 있어요."]
            : [pm && me ? `직접 고르신 ${me}와 상대 ${pm}의 네 글자를 아래에 나란히 놓았어요.` : "MBTI가 둘 다 있어야 글자 비교를 할 수 있어요.", "사주 비교는 계산이 연결된 뒤에 열려요."],
      },
    ],
    visuals,
    insight: { advisor: ["관계는 한 사람만의 결로 정해지지 않아요. 지금은 나의 결부터 차분히 봐요."], practice: TOPICS.compat.practice, questions: ["관계에서 내가 반복하는 장면이 있다면 어떤 장면인가요?"] },
  };
}

function ch10(meta: ChapterMeta, r: ResultPayload): Partial<ReportChapter> {
  return {
    summary: "대운(10년)과 세운(1년)은 원국 위로 흘러가는 시간의 기운이에요. 나의 대운표는 만세력 계산이 연결된 뒤에 열려요.",
    dataSlot: unconnected("대운 · 세운 · 미연결", "정확한 생년월일시 · 성별 · 절기 기준 계산이 필요해, 지금은 비워 두었어요.", ["생년월일시", "성별", "절기 기준 대운 계산"]),
    sections: [
      { id: "what", title: "대운과 세운을 읽는 법", body: ["대운은 10년마다 바뀌는 큰 흐름, 세운은 해마다 바뀌는 흐름이에요.", "같은 원국이라도 어떤 대운을 지나느냐에 따라 같은 기질이 다르게 드러난다고 봐요."] },
      { id: "direction", title: "대운의 방향을 정하는 규칙", body: ["전통적으로 태어난 해의 천간이 양(陽)인 남성과 음(陰)인 여성은 대운이 앞으로(순행), 그 반대는 뒤로(역행) 흐른다고 봐요.", "대운이 시작되는 나이는 태어난 날과 가까운 절기까지의 거리로 계산해요. 그래서 성별과 정확한 날짜가 필요해요."] },
    ],
    visuals: [{ kind: "cycle-slots", count: 8 }],
    insight: { advisor: ["흐름을 안다고 미래가 정해지는 건 아니에요. 계산이 연결되면 흐름 위의 나를 함께 볼게요."], questions: ["지난 10년을 하나의 단어로 표현한다면 무엇인가요?"] },
  };
}

/* 2027 정미년 — 연 간지와 월 간지는 달력으로 정해진 값 (丁 · 壬 해는 壬寅월부터 시작) */
const MONTH_TERMS: [string, string][] = [
  ["입춘", "2월 초"], ["경칩", "3월 초"], ["청명", "4월 초"], ["입하", "5월 초"], ["망종", "6월 초"], ["소서", "7월 초"],
  ["입추", "8월 초"], ["백로", "9월 초"], ["한로", "10월 초"], ["입동", "11월 초"], ["대설", "12월 초"], ["소한", "2028년 1월 초"],
];
const MONTH_STEMS = "壬癸甲乙丙丁戊己庚辛壬癸".split("");
const MONTH_BRANCHES = "寅卯辰巳午未申酉戌亥子丑".split("");

function ch11(meta: ChapterMeta, r: ResultPayload): Partial<ReportChapter> {
  const t = TOPICS.year2027;
  return {
    summary: t.lines[0],
    dataSlot: unconnected("나와의 관계 해석 · 미연결", "달마다의 간지는 달력으로 정해져 있어 아래에 보여드려요. 그 기운이 나의 원국과 어떻게 만나는지는 계산이 필요해 비워 두었어요.", ["원국 계산", "세운 · 월운 계산"]),
    sections: [
      { id: "year", title: "2027년 정미년(丁未年)", body: ["천간 정(丁)은 화(火), 지지 미(未)는 토(土)예요. 전통적으로 따뜻한 불과 메마른 흙의 해로 읽어요.", t.lines[1] ?? ""].filter(Boolean) },
      { id: "months", title: "달마다 들어오는 기운", body: ["월은 절기로 바뀌어요. 아래 표의 날짜는 대략적인 시작 무렵이에요. 오른쪽은 그 달 천간 오행의 전통적 성향이고, 나에게 어떻게 작용하는지는 아직 계산하지 않았어요."] },
    ],
    visuals: [
      {
        kind: "month-pillars",
        year: { pillar: "丁未", reading: "정미 · 화 · 토" },
        months: MONTH_TERMS.map(([term, approx], i) => {
          const st = STEMS[MONTH_STEMS[i]];
          const br = BRANCHES[MONTH_BRANCHES[i]];
          return { term, approx, pillar: `${st.hanja}${br.hanja} ${st.hangul}${br.hangul}`, element: `${ELEMENTS[st.element].hangul}·${ELEMENTS[br.element].hangul}`, color: ELEMENTS[st.element].color, tendency: ELEMENTS[st.element].tendency.split(" · ")[0] };
        }),
      },
    ],
    insight: { advisor: ["한 해의 흐름은 달력보다 내 마음의 계절이 먼저일 때가 많아요."], practice: t.practice, questions: ["2027년이 끝날 때 어떤 문장을 남기고 싶나요?"] },
  };
}

function ch12(meta: ChapterMeta, r: ResultPayload, practices: string[]): Partial<ReportChapter> {
  const s = r.integratedInsight;
  return {
    summary: s.summary,
    dataSlot: demoSlot(r, "종합 조언"),
    sections: [
      { id: "keywords", title: "핵심 키워드", body: [`${s.keywords.map((k) => k.word).join(" · ")} — 앞의 챕터에서 가장 자주 만난 결이에요.`] },
      { id: "advice", title: "나를 위한 조언", body: [s.advice] },
      { id: "practice", title: "챕터별 실천 모음", body: ["새로 만든 조언이 아니라, 앞 챕터의 실천을 한곳에 모은 거예요. 하나만 골라 일주일 해 보세요."], list: practices },
    ],
    visuals: [{ kind: "insight-card" }],
    insight: { advisor: ["여기까지 읽어 주셔서 고마워요.", "리포트는 끝나도, 두 결을 알아 가는 일은 계속돼요."], questions: [s.explore] },
  };
}

/* ── 조립 ── */

export function buildReport(id: ReportId, payload: ResultPayload, input: ReportInput): Report {
  const parts: Record<string, Partial<ReportChapter>> = {};
  for (const meta of CHAPTER_META) {
    const p =
      meta.id === "01" ? ch01(meta, payload)
      : meta.id === "02" ? ch02(meta, payload)
      : meta.id === "03" ? ch03(meta, payload)
      : meta.id === "04" ? ch04(meta, payload)
      : meta.id === "06" ? ch06(meta, payload, input)
      : meta.id === "10" ? ch10(meta, payload)
      : meta.id === "11" ? ch11(meta, payload)
      : meta.id === "12" ? {}
      : topicChapter(meta.id as "05" | "07" | "08" | "09", payload);
    parts[meta.id] = p;
  }
  const practices = Object.values(parts).map((p) => p.insight?.practice).filter((x): x is string => !!x).filter((x, i, a) => a.indexOf(x) === i);
  parts["12"] = ch12(CHAPTER_META[11], payload, practices);

  const chapters: ReportChapter[] = CHAPTER_META.map((meta) => {
    const p = parts[meta.id];
    return {
      ...meta,
      summary: p.summary ?? "",
      dataSlot: p.dataSlot ?? demoSlot(payload, "풀이"),
      sections: p.sections ?? [],
      visuals: p.visuals ?? [],
      insight: p.insight ?? { advisor: [], questions: [] },
      asks: CHAPTER_ASKS[meta.id],
    };
  });

  const partner = input.partner;
  const meta: ReportMetadata = {
    id,
    title: "두 가지 결의 책",
    subtitle: "사주 × MBTI 종합 리포트",
    resultStatus: payload.resultStatus,
    demoLabel: payload.demo?.label ?? null,
    basis: {
      mbti: input.mbti,
      timeUnknown: input.timeUnknown,
      partner: !partner ? "none" : partner.birth && partner.mbti ? "birth-mbti" : partner.birth ? "birth" : "mbti-only",
      topic: input.topic,
    },
    chapterCount: chapters.length,
    exports: { pdf: "planned" },
  };
  return { meta, payload, chapters };
}

/** 공개 샘플 리포트 — 데모 사주 + 예시 MBTI (사용자 정보 없음) */
export function buildSampleReport(): Report {
  const input = sampleInput();
  const payload = buildResultPayload(getSampleManse(true), { mbti: input.mbti, birth: null }, { publicSample: true });
  return buildReport("sample", payload, input);
}

/** 상담한 내용으로 만든 리포트 — 지금도 사주는 데모 (입력한 생년월일로 계산하지 않음) */
export function buildMyReport(p: Profile, topic: string): Report | null {
  if (!p.birth) return null;
  const input = inputFromProfile(p, topic);
  const live = getLiveEntry(p);
  const payload =
    live?.phase === "calculated"
      ? buildResultPayload(live.manse, { mbti: input.mbti, birth: p.birth }, { liveExtras: live.extras })
      : buildResultPayload(getSampleManse(!input.timeUnknown && p.time !== undefined), { mbti: input.mbti, birth: p.birth });
  return buildReport("my", payload, input);
}
