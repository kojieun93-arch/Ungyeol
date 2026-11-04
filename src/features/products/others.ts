import { OTHER_ASKS, OTHER_CHAPTERS } from "@/content/products/others";
import type { DataSlot } from "@/features/report/types";
import { ELEMENTS, ELEMENT_ORDER, elementLabel } from "@/features/saju/elements";
import { MBTI_TEXT, isLetter } from "@/features/saju/mbti";
import { DAY_MASTER_TRAITS } from "@/features/saju/personality";
import { CONTROLS, GENERATES, elementOf, relationTo, type GodGroup } from "@/features/saju/relations";
import { isDemo, type ElementKey, type MbtiLetter } from "@/features/saju/types";
import { ganjiText, monthWindow, yearGanJi } from "./calendar";
import type { ProductSource } from "./source";
import type { ProductChapter, ProductId } from "./types";

/* ──────────────────────────────────────────────────────────
   연애 · 궁합 · 재물 · 직업 · 인간관계 · 2027 — 공개 샘플 챕터 1개씩
   나머지 챕터는 구조(planned)만: 제목 · 핵심 질문 · 담기는 내용
   ────────────────────────────────────────────────────────── */

type Part = Pick<ProductChapter, "summary" | "dataSlot" | "sections" | "visuals" | "insight"> & { card?: ProductChapter["card"] };
type Other = Exclude<ProductId, "reunion">;

function ctx(s: ProductSource) {
  const r = s.payload;
  const dm = r.sajuPersonality.dayMaster;
  const count = (k: ElementKey) => r.fiveElements.counts.find((c) => c.key === k)?.count ?? 0;
  const god = (g: GodGroup) => {
    const el = elementOf(dm.element, g);
    return { el, n: count(el), label: elementLabel(el) };
  };
  const type = s.mbti ?? r.sajuMBTIReference.type;
  const L = type.split("").filter(isLetter) as MbtiLetter[];
  const demo = isDemo(r);
  return { r, dm, trait: DAY_MASTER_TRAITS[dm.hanja], count, god, type, L, own: !!s.mbti, demo, tag: demo ? " (샘플)" : "", dmWho: demo ? "샘플 사주의 일간" : "나의 일간" };
}

const slot = (s: ProductSource, what: string, extra = ""): DataSlot =>
  isDemo(s.payload)
    ? { status: "demo", label: "샘플 사주 · 계산 미연결", detail: `${s.payload.demo?.label ?? "샘플 사주"} 기준의 예시예요. 입력하신 생년월일로 계산한 ${what}가 아니에요.${extra}` }
    : { status: "demo", label: "계산 결과", detail: extra.trim() };

const many = (n: number) => (n === 0 ? "보이지 않아요" : n >= 3 ? `${n}글자로 두드러져요` : `${n}글자 있어요`);

/* 연애 01 연애 성향 */
function love01(s: ProductSource): Part {
  const x = ctx(s);
  const sik = x.god("식상");
  const gwan = x.god("관성");
  const fast = x.L.includes("E") || x.L.includes("P");
  return {
    summary: `${x.demo ? "샘플 사주로 보면 " : ""}‘${x.trait.image}’처럼, ${fast ? "설렘을 빨리 알아차리고 먼저 다가가는" : "천천히 마음을 열고 확신이 생긴 뒤 다가가는"} 연애 결로 읽혀요.`,
    dataSlot: slot(s, "연애 성향"),
    sections: [
      { id: "start", title: "설렘이 시작되는 방식", body: [`표현의 기운(식상)이 ${many(sik.n)}. ${sik.n >= 2 ? "마음이 생기면 말과 행동으로 먼저 신호를 보내는 편이에요." : "마음이 생겨도 겉으로 드러내기까지 시간이 걸리는 편이에요."}`, `${x.own ? `직접 고른 ${x.type}` : `참고유형 ${x.type}(운결 자체 분류)`}로 보면, ${x.L.includes("N") ? "상대와 나눌 이야기와 가능성에서" : "함께한 구체적인 순간에서"} 설렘을 느끼기 쉬워요.`] },
      { id: "pace", title: "가까워지는 속도", body: [fast ? "호감이 생기면 연락과 만남의 간격이 빠르게 좁혀지는 편이에요. 상대의 속도도 한 번씩 확인해 주세요." : "가까워지는 데 시간을 두는 편이에요. 그 신중함이 상대에게 거리감으로 보이지 않게, 작은 표현을 남겨 주세요."] },
      { id: "long", title: "오래 가는 관계를 만드는 힘", body: [`약속과 책임의 기운(관성)이 ${many(gwan.n)}. ${gwan.n >= 2 ? "관계를 지키려는 마음이 커서 오래 가는 연애에 강해요. 다만 책임감이 부담이 되지 않게 살펴요." : "얽매이는 느낌을 싫어할 수 있어요. 서로 편한 규칙을 함께 정하면 오래 갈 수 있어요."}`] },
    ],
    visuals: [{ kind: "element-radar" }],
    insight: { advisor: ["연애 성향은 정답이 아니라 출발점이에요."], practice: "마지막으로 설렜던 순간을 떠올리고, 그때 무엇이 마음을 움직였는지 적어 보세요.", questions: ["나는 사랑받는다고 느낄 때 무엇을 보고 알까?"] },
    card: "innate",
  };
}

/* 궁합 02 오행 관계 */
const KIND_READ = [
  { kind: "연인", text: "정서적인 거리에서 드러나요. 살리는 관계는 위로로, 다잡는 관계는 설렘과 긴장으로 느껴지기 쉬워요." },
  { kind: "친구", text: "함께 노는 방식에서 드러나요. 같은 기운은 편안함으로, 다른 기운은 새로운 자극으로 다가와요." },
  { kind: "가족", text: "역할에서 드러나요. 누가 챙기고 누가 기대는지가 살림 · 다잡음의 방향과 겹치기 쉬워요." },
  { kind: "동료", text: "일하는 방식에서 드러나요. 다잡는 관계는 서로의 실수를 줄여 주는 좋은 견제가 되기도 해요." },
];
function compatRel(me: ElementKey, them: ElementKey) {
  if (me === them) return { relation: "비화 · 같은 기운", text: "말하지 않아도 통하는 부분이 많아요. 둘 다 같은 쪽으로 치우치지 않게 서로의 빈자리를 살펴요." };
  if (GENERATES[them] === me) return { relation: "상생 · 상대가 나를 살림", text: "상대 곁에서 힘이 차오르기 쉬워요. 고마움을 말로 돌려주면 균형이 맞아요." };
  if (GENERATES[me] === them) return { relation: "상생 · 내가 상대를 살림", text: "내가 상대를 키워 주는 흐름이에요. 주는 만큼 나를 채울 시간도 챙겨요." };
  if (CONTROLS[me] === them) return { relation: "상극 · 내가 상대를 다듬음", text: "내가 기준과 방향을 주는 흐름이에요. 다듬는 말이 평가처럼 들리지 않게 해요." };
  return { relation: "상극 · 상대가 나를 다듬음", text: "상대에게서 배우고 단단해지는 흐름이에요. 지나친 긴장은 솔직하게 말해요." };
}
function compat02(s: ProductSource): Part {
  const x = ctx(s);
  return {
    summary: `${x.dmWho} ${elementLabel(x.dm.element)}을 기준으로, 상대 기운에 따라 생겨나는 다섯 관계를 보여드려요. 두 원국의 실제 비교는 계산 연결 후 들어와요.`,
    dataSlot: { status: "unconnected", label: "두 사람 원국 비교 · 미연결", detail: "상대방 원국을 계산하지 않았어요. 아래 표는 ‘상대 일간이 이 기운이라면’의 읽는 법이에요.", needs: ["내 원국 계산", "상대 원국 계산"] },
    sections: [
      { id: "five", title: "다섯 기운, 다섯 관계", body: ["오행에는 서로를 살리는 순환(목→화→토→금→수→목)과 서로를 다듬는 순환(목→토→수→화→금→목)이 있어요. 두 사람의 일간이 이 순환의 어디에 놓이느냐에 따라 관계의 결이 달라져요."] },
      { id: "kind", title: "관계에 따라 다르게 드러나요", body: ["같은 오행 관계라도 어떤 사이냐에 따라 다른 모습으로 나타나요."], list: KIND_READ.map((k) => `${k.kind} — ${k.text}`) },
    ],
    visuals: [
      {
        kind: "element-relations",
        me: { label: `${x.demo ? "샘플 사주" : "나"} · ${elementLabel(x.dm.element)}`, color: ELEMENTS[x.dm.element].color },
        rows: ELEMENT_ORDER.map((el) => ({ element: elementLabel(el), color: ELEMENTS[el].color, ...compatRel(x.dm.element, el) })),
        note: "상대 일간은 계산 연결 후 표시돼요.",
      },
    ],
    insight: { advisor: ["관계의 이름보다, 서로에게 무엇을 주고받는지가 궁합의 핵심이에요."], practice: "그 사람 곁에서 내가 달라지는 점 하나를 적어 보세요.", questions: ["나는 이 관계에서 주로 주는 쪽일까, 받는 쪽일까?"] },
  };
}

/* 재물 01 재성과 관련된 명리 요소 */
function wealth01(s: ProductSource): Part {
  const x = ctx(s);
  const jae = x.god("재성");
  const sik = x.god("식상");
  const bi = x.god("비겁");
  return {
    summary: `${x.demo ? "샘플 사주에서" : "내 사주에서"} 일간이 다스리는 기운, 재성은 ${jae.label}이에요. 원국에서 ${many(jae.n)}.`,
    dataSlot: slot(s, "재물 요소", " 재물의 크기나 시기를 예측하지 않아요."),
    sections: [
      { id: "wealth", title: "재성 — 내가 다스리는 기운", body: [`일간이 ${elementLabel(x.dm.element)}일 때, 내가 다스리는(극하는) ${jae.label}이 재성이에요. 전통적으로 재물 · 현실 감각 · 결과를 만드는 힘으로 읽어요.`, jae.n >= 2 ? "현실을 계산하고 결과를 챙기는 감각이 익숙한 편이에요." : jae.n === 0 ? "돈과 결과를 앞세우기보다 다른 가치를 먼저 보는 편으로 읽어요. 돈 관리는 습관과 도구로 채우면 좋아요." : "현실 감각이 필요할 때 꺼내 쓰는 편이에요."] },
      { id: "flow", title: "재성을 낳는 기운, 다투는 기운", body: ["재성 하나만 보지 않고, 재성으로 이어지는 흐름도 함께 봐요."], list: [`식상(${sik.label}) ${sik.n}글자 — 재성을 낳는 기운. 기술 · 표현 · 활동으로 벌어들이는 힘`, `비겁(${bi.label}) ${bi.n}글자 — 재성을 나누는 기운. 함께 쓰는 돈, 경쟁, 나눔`] },
      { id: "safe", title: "이 챕터가 말하지 않는 것", body: ["재성의 많고 적음은 부자가 될지를 알려 주지 않아요. 투자 · 대출 · 큰 지출처럼 중요한 결정은 운세가 아니라 정보와 전문가 상담으로 정해 주세요."] },
    ],
    visuals: [
      {
        kind: "ten-gods",
        rows: (["식상", "재성", "비겁"] as GodGroup[]).map((g) => {
          const v = x.god(g);
          const text = { 식상: "식상 — 벌어들이는 활동", 재성: "재성 — 재물 · 현실 감각", 비겁: "비겁 — 나눔 · 경쟁" }[g as "식상" | "재성" | "비겁"];
          return { element: v.label, color: ELEMENTS[v.el].color, group: g, text, count: v.n };
        }),
      },
    ],
    insight: { advisor: ["돈을 대하는 태도를 아는 건, 돈에 휘둘리지 않는 첫걸음이에요."], practice: "지난 한 달 지출 중 ‘나를 위한 것’과 ‘남을 위한 것’의 비율을 대략 떠올려 보세요.", questions: ["돈이 넉넉하다고 느끼는 기준은 무엇일까?"] },
    card: "elements",
  };
}

/* 직업 01 업무 기질 */
function career01(s: ProductSource): Part {
  const x = ctx(s);
  const g = (["관성", "식상", "인성", "재성"] as GodGroup[]).map((k) => ({ k, ...x.god(k) }));
  const WORK: Record<string, string> = { 관성: "조직 · 규칙 · 책임을 다루는 힘", 식상: "표현 · 기술 · 만들어 내는 힘", 인성: "배움 · 자격 · 깊이 생각하는 힘", 재성: "성과 · 실무 · 현실을 다루는 힘" };
  const top = [...g].sort((a, z) => z.n - a.n)[0];
  return {
    summary: `${x.demo ? "샘플 사주로 보면, " : ""}일할 때 가장 먼저 꺼내기 쉬운 힘은 ${WORK[top.k]}(${top.k})이에요.`,
    dataSlot: slot(s, "업무 기질", " 특정 직업을 추천하지 않아요."),
    sections: [
      { id: "force", title: "일에서 쓰는 네 가지 힘", body: ["나의 일간을 기준으로, 일과 관련된 네 갈래의 기운이 원국에 얼마나 있는지 봤어요."], list: g.map((v) => `${WORK[v.k]} — ${v.label} ${v.n}글자`) },
      { id: "rhythm", title: "나에게 맞는 일의 리듬", body: [`${x.own ? x.type : `참고유형 ${x.type}`} 기준으로 보면, ${x.L.includes("J") ? "마감과 순서가 분명한 일에서 안정감을" : "변화와 새로운 과제가 있는 일에서 활력을"} 느끼기 쉬워요. ${x.L.includes("I") ? "혼자 집중할 시간이 보장될 때 결과가 좋아요." : "사람과 주고받으며 일할 때 아이디어가 살아나요."}`] },
      { id: "tired", title: "지치기 쉬운 환경", body: [`${x.trait.cautions[1] ?? x.trait.cautions[0]} ${MBTI_TEXT[x.type]?.growth[1] ?? ""}`.trim()] },
    ],
    visuals: [
      {
        kind: "ten-gods",
        rows: g.map((v) => ({ element: v.label, color: ELEMENTS[v.el].color, group: v.k, text: `${v.k} — ${WORK[v.k]}`, count: v.n })),
      },
    ],
    insight: { advisor: ["어떤 일이 맞는지보다, 어떤 방식으로 일할 때 내가 살아나는지가 먼저예요."], practice: "최근 일주일 중 시간이 가장 빨리 갔던 업무 하나를 적어 보세요.", questions: ["일이 끝난 뒤 뿌듯했던 순간에 나는 무엇을 하고 있었나?"] },
    card: "innate",
  };
}

/* 인간관계 04 소통 성향 */
function relation04(s: ProductSource): Part {
  const x = ctx(s);
  const bi = x.god("비겁");
  const insung = x.god("인성");
  const E = x.L.includes("E");
  const F = x.L.includes("F");
  return {
    summary: `${E ? "말하면서 생각을 정리하고" : "듣고 정리한 뒤 말하고"}, ${F ? "분위기와 마음을 먼저 살피는" : "핵심과 사실을 먼저 짚는"} 소통 결로 읽혀요.`,
    dataSlot: slot(s, "소통 성향", " MBTI 부분은 알려주신 유형(또는 참고유형) 기준이에요."),
    sections: [
      { id: "speak", title: "말하는 속도와 듣는 방식", body: [E ? "대화 속에서 생각이 자라는 편이라, 말이 빨리 나오고 반응도 빨라요. 조용한 사람에게는 생각할 틈을 남겨 주세요." : "충분히 듣고 정리한 뒤 말하는 편이라, 한마디의 무게가 커요. 대답이 늦어도 관심이 없는 게 아니라는 걸 가끔 말로 알려 주세요.", F ? "상대의 기분을 먼저 살피고 말을 고르는 편이에요." : "돌려 말하기보다 핵심을 먼저 말하는 편이에요."] },
      { id: "places", title: "편한 자리, 지치는 자리", body: [`나와 같은 기운(비겁)이 ${many(bi.n)}${x.tag}. ${bi.n >= 2 ? "또래 · 동료처럼 대등한 관계에서 편안한 편이에요." : "대등한 경쟁보다 역할이 분명한 관계가 편할 수 있어요."} 나를 돕는 기운(인성)은 ${many(insung.n)}. ${insung.n >= 2 ? "조언을 주고받는 깊은 대화에서 힘을 얻어요." : "조언을 듣는 것보다 스스로 정리하는 시간이 더 필요할 수 있어요."}`] },
      { id: "miss", title: "오해가 생기는 순간", body: [E && !F ? "빠르고 솔직한 말이 날카롭게 들릴 때" : E && F ? "분위기를 맞추느라 내 진짜 생각을 말하지 않을 때" : !E && F ? "서운함을 말하지 않고 거리를 둘 때" : "짧은 대답이 무관심처럼 보일 때"] },
    ],
    visuals: [
      {
        kind: "habit-table",
        title: "자리마다 달라지는 나",
        columns: ["편한 쪽", "지치는 쪽"],
        rows: [
          { label: "가족", a: F ? "마음을 나누는 대화" : "역할이 분명한 관계", b: F ? "감정을 숨겨야 하는 분위기" : "말없이 기대만 쌓이는 분위기" },
          { label: "친구", a: E ? "여럿이 함께하는 자리" : "한두 명과의 깊은 대화", b: E ? "혼자 오래 있어야 할 때" : "약속이 계속 이어질 때" },
          { label: "직장", a: x.L.includes("J") ? "역할과 마감이 정해진 협업" : "자율이 있는 협업", b: x.L.includes("J") ? "계획 없이 바뀌는 지시" : "세세한 보고가 반복될 때" },
        ],
        note: "MBTI 선호 기준의 경향이에요. 사람과 상황에 따라 달라질 수 있어요.",
      },
    ],
    insight: { advisor: ["소통 성향을 알면, 내 말이 어떻게 들리는지 한 번 더 생각할 수 있어요."], practice: "오늘 대화 중 한 번, ‘내가 이해한 게 맞아?’라고 되물어 보세요.", questions: ["나는 어떤 사람 앞에서 가장 편하게 말할까?"] },
  };
}

/* 2027 03 12개월 월운 */
function year03(s: ProductSource): Part {
  const x = ctx(s);
  const rows = Array.from({ length: 12 }, (_, i) => {
    const w = monthWindow(2027, i + 1);
    return { calendar: `${i + 1}월`, term: `${w.term} ${i + 1}월 ${w.termDay}일 무렵`, before: ganjiText(w.before.ganji), after: ganjiText(w.after.ganji) };
  });
  const prev = yearGanJi(2026);
  const groups = [
    { name: "봄 (寅 · 卯 · 辰월)", el: "wood" as ElementKey },
    { name: "여름 (巳 · 午 · 未월)", el: "fire" as ElementKey },
    { name: "가을 (申 · 酉 · 戌월)", el: "metal" as ElementKey },
    { name: "겨울 (亥 · 子 · 丑월)", el: "water" as ElementKey },
  ];
  return {
    summary: "2027년 정미년의 열두 달을 절기 기준으로 정리했어요. 달력의 한 달은 절기를 기준으로 두 달에 걸쳐 있어요.",
    dataSlot: { status: "unconnected", label: "나와의 관계 해석 · 미연결", detail: "달마다의 간지는 달력으로 정해진 값이라 그대로 보여드려요. 그 달이 나에게 어떻게 작용하는지는 원국 계산이 필요해 비워 두었어요.", needs: ["원국 계산", "월운 계산"] },
    sections: [
      { id: "term", title: "절기 기준과 달력 월의 차이", body: [`사주의 한 달은 1일이 아니라 절기(節)에 시작해요. 그래서 달력의 1월은 소한(1월 6일 무렵) 전후로 두 달에 걸쳐 있고, 2월 초 입춘 전까지는 아직 ${2026}년 ${ganjiText(prev)}년의 흐름이에요.`, "아래 표의 ‘절기 전’은 그 달 초, ‘절기 후’는 그 절기부터 다음 달 절기 전까지예요. 절기 날짜는 해마다 하루 안팎 달라져요."] },
      { id: "season", title: "계절로 묶어 보면", body: ["절기 월의 지지는 계절의 기운을 따라요. 아래는 전통적인 계절 오행이에요."], list: groups.map((g) => `${g.name} — ${ELEMENTS[g.el].hangul}(${ELEMENTS[g.el].hanja})의 계절 · ${ELEMENTS[g.el].tendency}`) },
      { id: "me", title: "나에게는 어떻게 작용할까", body: [`${x.dmWho} ${elementLabel(x.dm.element)}과 각 달의 기운이 어떻게 만나는지는 계산이 연결되면 이 자리에 들어와요. 지금은 좋은 달 · 나쁜 달을 정하지 않았어요.`, `참고로 2027년 천간 丁(화)은 ${x.dmWho}에게 ${relationTo(x.dm.element, "fire").name}의 기운이에요.`] },
    ],
    visuals: [{ kind: "term-calendar", year: 2027, rows }],
    insight: { advisor: ["달력보다 절기를 따라가면, 계절이 바뀌는 순간을 조금 더 또렷하게 느낄 수 있어요."], practice: "2027년 입춘(2월 4일 무렵)에 한 해의 바람을 한 줄로 적어 보세요.", questions: ["2027년의 어느 계절이 가장 기다려지나요?"] },
  };
}

const SAMPLE_BUILDERS: Record<Other, { id: string; build: (s: ProductSource) => Part }> = {
  love: { id: "01", build: love01 },
  compat: { id: "02", build: compat02 },
  wealth: { id: "01", build: wealth01 },
  career: { id: "01", build: career01 },
  relation: { id: "04", build: relation04 },
  year2027: { id: "03", build: year03 },
};

const EMPTY: Part = { summary: "", dataSlot: { status: "unconnected", label: "본문 준비 중", detail: "" }, sections: [], visuals: [], insight: { advisor: [], questions: [] } };

export function buildOtherChapters(id: Other, s: ProductSource): ProductChapter[] {
  const sample = SAMPLE_BUILDERS[id];
  return OTHER_CHAPTERS[id].map((m, i) => ({
    ...m,
    no: i + 1,
    ...(m.id === sample.id ? sample.build(s) : EMPTY),
    asks: OTHER_ASKS[id][m.id] ?? [],
  }));
}
