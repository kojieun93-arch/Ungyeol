import {
  AXIS_KEYS,
  AXIS_TALK,
  CONTACT_NOTES,
  QUESTION_ANSWERS,
  REASON_PATTERN,
  REUNION_ASKS,
  REUNION_CHAPTERS,
  REUNION_LABELS,
  YEAR_GOD_READING,
  elapsedNote,
} from "@/content/products/reunion";
import type { DataSlot, ReportSection } from "@/features/report/types";
import { ELEMENTS, ELEMENT_ORDER, elementLabel } from "@/features/saju/elements";
import { AXIS, MBTI_TEXT, isLetter } from "@/features/saju/mbti";
import { DAY_MASTER_TRAITS } from "@/features/saju/personality";
import { CONTROLS, GENERATES, elementOf, relationTo, type GodGroup } from "@/features/saju/relations";
import { isDemo, type ElementKey, type MbtiLetter } from "@/features/saju/types";
import { ganjiReading, ganjiText, monthWindow, monthsBetween, yearGanJi } from "./calendar";
import type { ProductSource } from "./source";
import type { ProductChapter, ProductVisual } from "./types";

/* ──────────────────────────────────────────────────────────
   재회운 리포트 10챕터 — 상담 입력에 따라 문장이 바뀜
   - 사주: 지금은 데모 원국(입력과 무관) → 모든 사주 문장에 '샘플' 표시
   - 상대 사주: 계산 미연결 → '미확정' (생년월일을 받아도 계산하지 않고, 리포트에 표시하지 않음)
   - MBTI 비교 · 이별 시기의 연 · 월 간지(달력으로 정해진 값)는 입력값을 그대로 사용
   ────────────────────────────────────────────────────────── */

type Part = Omit<ProductChapter, "id" | "no" | "title" | "question" | "includes" | "access" | "status" | "asks">;

const WORD: Record<MbtiLetter, string> = { E: "외향", I: "내향", S: "감각", N: "직관", T: "사고", F: "감정", J: "판단", P: "인식" };
const letters = (t: string | null) => (t ? (t.split("").filter(isLetter) as MbtiLetter[]) : null);

function base(s: ProductSource) {
  const r = s.payload;
  const dm = r.sajuPersonality.dayMaster;
  const trait = DAY_MASTER_TRAITS[dm.hanja];
  const count = (k: ElementKey) => r.fiveElements.counts.find((c) => c.key === k)?.count ?? 0;
  const god = (g: GodGroup) => {
    const el = elementOf(dm.element, g);
    return { el, n: count(el) };
  };
  const ref = r.sajuMBTIReference.type;
  const myType = s.mbti ?? null;
  const usedType = myType ?? ref; // MBTI 를 모르면 운결 참고유형으로 대신 읽음
  const pm = s.partner?.mbti ?? null;
  const demo = isDemo(r);
  const sampleTag = demo ? " (샘플)" : "";
  return { r, dm, trait, count, god, ref, myType, usedType, pm, demo, sampleTag, my: letters(usedType)!, their: letters(pm) };
}

const demoSlot = (s: ProductSource, what: string, extra = ""): DataSlot =>
  isDemo(s.payload)
    ? { status: "demo", label: "샘플 사주 · 계산 미연결", detail: `${s.payload.demo?.label ?? "샘플 사주"} 기준의 예시예요. 입력하신 생년월일로 계산한 ${what}가 아니에요.${extra}` }
    : { status: "demo", label: "계산 결과", detail: extra.trim() };

const partnerState = (s: ProductSource) => (!s.partner ? "none" : s.partner.birth ? "birth" : "partial");

/* ── 01 두 사람의 기질 소개 ── */
function ch01(s: ProductSource): Part {
  const b = base(s);
  const pState = partnerState(s);
  const pBirthLine =
    pState === "birth"
      ? "상대방 생년월일은 받아 두었지만, 만세력 계산이 연결되지 않아 사주는 미확정이에요. 생년월일은 리포트 어디에도 표시하지 않아요."
      : "상대방 생년월일이 없어 사주는 미확정이에요. 몰라도 MBTI와 두 사람의 경험으로 볼 수 있는 부분이 많아요.";
  return {
    summary: `나는 ‘${b.trait.image}’의 결${b.sampleTag}, 지금의 선호는 ${b.myType ?? "미확정"}이에요. 상대방은 ${b.pm ? `${b.pm}로 알고 계세요` : "MBTI도 사주도 미확정이에요"}.`,
    dataSlot: demoSlot(s, "기질", pState === "birth" ? " 상대방 사주도 계산 연결 후 들어와요." : ""),
    sections: [
      { id: "me", title: "나의 타고난 결", body: [b.r.sajuPersonality.summary, b.trait.core], more: [`강점 · ${b.trait.strengths.join(" / ")}`, `조심할 점 · ${b.trait.cautions.join(" ")}`] },
      {
        id: "now",
        title: "지금의 나 (MBTI)",
        body: b.myType
          ? [`${b.myType} — ${MBTI_TEXT[b.myType]?.summary ?? ""}`, "직접 고른 유형이라 검사 결과나 진단이 아니에요. 관계 안에서의 ‘지금의 선호’로 읽어 주세요."]
          : [`MBTI를 모르셔서 이 부분은 미확정이에요. 뒤 챕터에서는 사주 기반 참고유형 ${b.ref}(운결 자체 분류 · 진단 아님)로 대신 읽어요.`],
      },
      {
        id: "partner",
        title: "상대방",
        body: [b.pm ? `${b.pm} — ${MBTI_TEXT[b.pm]?.summary ?? ""} 상대가 직접 알려 준 유형인지, 내가 짐작한 유형인지에 따라 정확도가 달라져요.` : "상대방 MBTI는 미확정이에요. 추측해서 넣지 않아도 괜찮아요.", pBirthLine],
      },
    ],
    visuals: [
      {
        kind: "pair-table",
        title: "두 사람 정보 한눈에",
        note: "미확정 칸은 정보가 없거나 계산이 연결되지 않은 부분이에요.",
        rows: [
          { label: "일간 (사주)", me: `${b.dm.hanja}${ELEMENTS[b.dm.element].hanja} ${b.dm.hangul}${ELEMENTS[b.dm.element].hangul}`, partner: null, meSample: b.demo },
          { label: "일간 이미지", me: b.trait.image, partner: null, meSample: b.demo },
          { label: "MBTI", me: b.myType ?? "미확정", partner: b.pm },
          { label: "사주 기반 참고유형", me: `${b.ref} · 운결 자체 분류`, partner: null, meSample: b.demo },
        ],
      },
    ],
    insight: {
      advisor: ["두 사람을 이해하는 일은 누가 옳았는지 가리는 일이 아니에요.", "각자 어떤 결로 그 관계에 서 있었는지부터 볼게요."],
      practice: "그 사람을 떠올리면 가장 먼저 생각나는 장면 하나를 적어 보세요.",
      questions: ["그 사람의 어떤 결이 처음 나를 끌었을까?"],
    },
    card: "innate",
  };
}

/* ── 02 나의 연애 성향 ── */
const LOVE_GOD: Record<GodGroup, { name: string; love: string }> = {
  비겁: { name: "나와 같은 기운", love: "연애에서도 나다움과 자존심을 지키려는 힘" },
  식상: { name: "표현하는 기운", love: "마음을 말과 행동으로 드러내는 힘" },
  재성: { name: "현실을 다루는 기운", love: "함께하는 생활을 챙기고 꾸리는 힘" },
  관성: { name: "책임 · 약속의 기운", love: "관계의 약속을 지키고 책임지려는 힘" },
  인성: { name: "기대고 배우는 기운", love: "이해받고 싶고, 상대를 이해하려는 힘" },
};
const GROUPS: GodGroup[] = ["비겁", "식상", "재성", "관성", "인성"];

function ch02(s: ProductSource): Part {
  const b = base(s);
  const rows = GROUPS.map((g) => ({ g, ...b.god(g) }));
  const top = [...rows].sort((a, z) => z.n - a.n)[0];
  const low = rows.filter((x) => x.n === 0);
  const L = b.my;
  const show = `${L.includes("E") ? "자주 말로 확인하며" : "조용히 곁에 있으며"} ${L.includes("F") ? "마음을 알아주는 말로" : "문제를 함께 풀어 주는 행동으로"} 애정을 보여 주기 쉬워요. ${L.includes("J") ? "약속과 계획에서 안정감을 느끼는 편이에요." : "즉흥적인 즐거움에서 설렘을 느끼는 편이에요."}`;
  return {
    summary: `가장 두드러진 건 ${LOVE_GOD[top.g].name}(${top.g})이에요${b.sampleTag}. 사랑할 때 ‘${LOVE_GOD[top.g].love}’이 먼저 나오기 쉬워요.`,
    dataSlot: demoSlot(s, "오행 분포"),
    sections: [
      {
        id: "gods",
        title: "사랑할 때 드러나는 기운",
        body: ["나의 일간(나 자신)을 기준으로, 원국의 글자들이 어떤 역할을 하는지 다섯 갈래로 나눠 봤어요."],
        list: rows.map((x) => `${LOVE_GOD[x.g].name}(${x.g}) ${x.n}글자 — ${LOVE_GOD[x.g].love}`),
        more: low.length ? [`${low.map((x) => LOVE_GOD[x.g].name).join(" · ")}은 원국에 보이지 않아요. 없다는 건 못 한다는 뜻이 아니라, 덜 익숙해서 의식적으로 연습하면 좋은 부분이라는 뜻이에요.`] : undefined,
      },
      { id: "show", title: `애정 표현 방식 (${b.usedType}${b.myType ? "" : " · 참고유형"})`, body: [show] },
      { id: "tired", title: "연애에서 지치는 지점", body: [b.trait.cautions[0], MBTI_TEXT[b.usedType]?.growth[0] ?? ""].filter(Boolean) },
    ],
    visuals: [
      {
        kind: "ten-gods",
        rows: rows.map((x) => ({ element: elementLabel(x.el), color: ELEMENTS[x.el].color, group: x.g, text: `${x.g} — ${LOVE_GOD[x.g].love}`, count: x.n })),
      },
    ],
    insight: {
      advisor: ["연애 성향은 고쳐야 할 결점이 아니라, 내가 사랑을 건네는 언어예요."],
      practice: "이번 주, 평소와 다른 방식으로 고마움을 한 번 표현해 보세요.",
      questions: ["사랑받는다고 느낀 순간, 상대는 무엇을 하고 있었나요?"],
    },
    card: "elements",
  };
}

/* ── 03 상대방과의 성향 비교 ── */
const SELF_CHECK: Record<string, string> = {
  EI: "갈등 뒤, 그 사람은 바로 이야기하려 했나요, 시간을 가지려 했나요?",
  SN: "그 사람은 있었던 일을 자세히 말했나요, 그 일이 무슨 뜻인지를 말했나요?",
  TF: "내가 힘들 때, 그 사람은 해결책을 줬나요, 먼저 들어 줬나요?",
  JP: "약속이나 계획을 그 사람은 미리 정했나요, 그때그때 정했나요?",
};

function ch03(s: ProductSource): Part {
  const b = base(s);
  const pairs = AXIS_KEYS.map((ax, i) => ({ ax, me: b.my[i], them: b.their?.[i] ?? null }));
  const same = pairs.filter((p) => p.them && p.me === p.them);
  const diff = pairs.filter((p) => p.them && p.me !== p.them);
  const sections: ReportSection[] = b.their
    ? [
        { id: "same", title: `닮은 점 · ${same.length}가지`, body: same.length ? same.map((p) => AXIS_TALK[p.ax].same[p.me]) : ["네 글자가 모두 달라요. 서로에게서 내게 없는 것을 발견하기 쉬운 조합이에요."] },
        { id: "diff", title: `다른 점 · ${diff.length}가지`, body: diff.length ? diff.map((p) => AXIS_TALK[p.ax].diff) : ["네 글자가 모두 같아요. 서로를 쉽게 이해하는 대신, 같은 약점도 함께 갖기 쉬워요."] },
      ]
    : [
        { id: "limit", title: "상대 정보가 없어 비교는 제한적이에요", body: ["상대방 MBTI가 미확정이라 닮은 점과 다른 점을 정하지 않았어요. 대신 아래 질문으로 그 사람의 모습을 떠올려 보세요."], list: AXIS_KEYS.map((ax) => SELF_CHECK[ax]) },
      ];
  sections.push({
    id: "saju",
    title: "사주 쪽 비교는 미확정",
    body: [`상대 사주가 미확정이라 MBTI만 비교했어요. 내 쪽의 사주 기반 참고유형은 ${b.ref}예요${b.sampleTag}. 이건 운결의 자체 참고 분류이고, 과학적으로 확정된 진단이 아니에요.`],
  });
  return {
    summary: b.their ? `MBTI 네 글자 중 ${same.length}가지가 닮고 ${diff.length}가지가 달라요. 다른 글자가 곧 엇갈림의 원인은 아니지만, 오해가 시작되기 쉬운 자리예요.` : "상대방 MBTI가 미확정이라, 이 챕터는 내 쪽의 선호와 스스로 확인할 질문으로 이뤄져 있어요.",
    dataSlot: b.their ? { status: "demo", label: "입력한 MBTI 비교", detail: `두 사람의 MBTI는 알려주신 그대로예요${b.myType ? "" : " (내 쪽은 참고유형)"}. 사주 비교는 계산 연결 후 들어와요.` } : { status: "needs-input", label: "상대 MBTI 미확정", detail: "상담에서 상대 MBTI를 알려주시면 네 글자를 나란히 비교해 드려요.", needs: ["상대 MBTI (선택)"] },
    sections,
    visuals: [
      {
        kind: "letter-compare",
        left: { label: b.myType ? "나" : "나 · 참고유형", type: b.usedType },
        right: { label: "상대방", type: b.pm },
        rows: pairs.map((p) => ({ axis: AXIS[p.me].title, left: `${p.me} · ${WORD[p.me]}`, right: p.them ? `${p.them} · ${WORD[p.them]}` : null, same: p.them ? p.me === p.them : null })),
      },
    ],
    insight: {
      advisor: ["다른 글자는 맞지 않는다는 뜻이 아니라, 다른 언어를 쓴다는 뜻이에요."],
      practice: "다른 점 하나를 골라, 그 사람이 그렇게 행동했던 장면을 떠올려 보세요.",
      questions: ["그 사람의 방식 중, 지금은 이해되는 것이 있나요?"],
    },
    card: "compare",
  };
}

/* ── 04 두 사람의 사주 궁합 ── */
function relationText(me: ElementKey, them: ElementKey): { relation: string; text: string } {
  if (me === them) return { relation: "같은 기운", text: "서로를 잘 이해하지만, 고집이 부딪히면 둘 다 물러서지 않기 쉬워요." };
  if (GENERATES[them] === me) return { relation: "상대가 나를 살림", text: "상대에게 기대고 위로받기 쉬운 관계예요. 받기만 하는 흐름이 되지 않게 살펴요." };
  if (GENERATES[me] === them) return { relation: "내가 상대를 살림", text: "챙겨 주는 기쁨이 큰 관계예요. 내가 지치지 않게 살펴요." };
  if (CONTROLS[me] === them) return { relation: "내가 상대를 다잡음", text: "방향을 잡아 주는 관계예요. 다잡음이 잔소리로 들리지 않게 살펴요." };
  return { relation: "상대가 나를 다잡음", text: "긴장과 자극을 주는 관계예요. 내가 위축되지 않게 살펴요." };
}

function ch04(s: ProductSource): Part {
  const b = base(s);
  const pState = partnerState(s);
  return {
    summary: `두 원국은 아직 비교하지 않았어요. 대신 나의 일간 ${elementLabel(b.dm.element)}${b.sampleTag}에서 출발해, 상대 일간이 무엇이냐에 따라 관계가 어떻게 달라지는지 보여드려요.`,
    dataSlot:
      pState === "birth"
        ? { status: "unconnected", label: "두 사람 사주 비교 · 미연결", detail: "상대방 생년월일은 받았지만 만세력 계산이 연결되지 않아 두 원국을 계산하지 않았어요.", needs: ["내 원국 계산", "상대 원국 계산"] }
        : { status: "needs-input", label: "상대 생년월일 미확정", detail: "상대방 생년월일이 없어 두 사람의 사주를 비교할 수 없어요. 아래는 읽는 법만 보여드려요.", needs: ["상대 생년월일 (선택)", "만세력 계산 연결"] },
    sections: [
      {
        id: "frame",
        title: "궁합을 읽는 틀",
        body: ["사주 궁합은 점수가 아니에요. 다섯 기운이 서로를 살리고(생) 다잡는(극) 관계로, 두 사람이 어떤 방식으로 영향을 주고받는지를 읽어요.", "다잡는 관계도 나쁜 게 아니에요. 전통적으로 서로를 다듬고 긴장을 주는 관계로 봐요."],
      },
      { id: "start", title: "나의 일간에서 출발하면", body: [`나의 일간은 ${elementLabel(b.dm.element)}이에요${b.sampleTag}. ${ELEMENTS[b.dm.element].tendency}의 기운이에요. 상대 일간이 다섯 기운 중 무엇이냐에 따라 아래 표처럼 읽을 수 있어요.`] },
      {
        id: "later",
        title: "아직 비교하지 않은 것",
        body: ["다음 부분은 두 사람의 원국을 실제로 계산해야 볼 수 있어서 비워 두었어요."],
        list: ["두 일간이 실제로 맺는 관계", "서로의 부족한 오행을 채워 주는지", "지지끼리의 합(合) · 충(沖)"],
      },
    ],
    visuals: [
      {
        kind: "element-relations",
        me: { label: `나 · ${elementLabel(b.dm.element)}${b.sampleTag}`, color: ELEMENTS[b.dm.element].color },
        rows: ELEMENT_ORDER.map((el) => ({ element: elementLabel(el), color: ELEMENTS[el].color, ...relationText(b.dm.element, el) })),
        note: "상대 일간이 이 중 어디에 해당하는지는 계산 연결 후 표시돼요.",
      },
    ],
    insight: {
      advisor: ["궁합이 좋다, 나쁘다보다 ‘우리는 이런 식으로 영향을 주고받는다’를 아는 게 더 쓸모 있어요."],
      practice: "그 사람이 곁에 있을 때 내가 편해졌는지, 긴장됐는지 떠올려 보세요.",
      questions: ["그 관계에서 나는 주로 기댔나요, 챙겼나요?"],
    },
  };
}

/* ── 05 MBTI 소통 방식 비교 ── */
function ch05(s: ProductSource): Part {
  const b = base(s);
  const pairs = AXIS_KEYS.map((ax, i) => ({ ax, me: b.my[i], them: b.their?.[i] ?? null }));
  const diff = pairs.filter((p) => p.them && p.me !== p.them);
  const same = pairs.filter((p) => p.them && p.me === p.them);
  const need = (l: MbtiLetter) =>
    ({ E: "바로 이야기할 기회", I: "혼자 정리할 시간", S: "구체적인 사실 확인", N: "이 일이 우리에게 갖는 의미", T: "문제를 풀 방법", F: "마음을 알아주는 말", J: "언제까지 정할지에 대한 약속", P: "서두르지 않을 여유" })[l];
  const sections: ReportSection[] = b.their
    ? [
        { id: "diff", title: "가장 엇갈리기 쉬운 곳", body: diff.length ? diff.map((p) => `${AXIS_TALK[p.ax].name} — ${AXIS_TALK[p.ax].diff}`) : ["네 가지 선호가 모두 같아요. 엇갈림은 선호의 차이보다 상황과 시기에서 왔을 가능성이 커요."] },
        ...(same.length ? [{ id: "same", title: "닮아서 생기는 일", body: same.map((p) => AXIS_TALK[p.ax].same[p.me]) }] : []),
        { id: "need", title: "갈등할 때 각자 필요한 것", body: ["다툼이 시작될 때, 두 사람은 서로 다른 것을 먼저 원했을 수 있어요."], list: [`나 — ${b.my.map(need).slice(0, 3).join(" · ")}`, `상대 — ${b.their.map(need).slice(0, 3).join(" · ")}`] },
      ]
    : [
        { id: "mine", title: "나의 소통 습관", body: b.my.map((l, i) => `${AXIS_TALK[AXIS_KEYS[i]].name} — ${AXIS_TALK[AXIS_KEYS[i]].habit[["E", "S", "T", "J"].includes(l) ? 0 : 1]}`) },
        { id: "check", title: "상대를 떠올리며 확인하기", body: ["상대 MBTI가 미확정이라 비교하지 않았어요. 아래 표의 두 칸 중 그 사람이 어느 쪽이었는지 떠올려 보세요."] },
      ];
  return {
    summary: b.their ? `소통에서 엇갈리기 쉬운 곳은 ${diff.length ? diff.map((p) => AXIS_TALK[p.ax].name.split(" · ")[0]).join(" · ") : "없어요 — 선호가 모두 같아요"}${diff.length ? "이에요" : ""}.` : "상대 MBTI가 미확정이라, 나의 소통 습관과 상대를 떠올려 볼 표로 구성했어요.",
    dataSlot: b.their ? { status: "demo", label: "입력한 MBTI 기준", detail: "MBTI는 선호를 보여 줄 뿐, 그 사람의 실제 말과 행동을 대신하지 않아요." } : { status: "needs-input", label: "상대 MBTI 미확정", detail: "상대 MBTI를 알면 두 사람의 습관을 나란히 볼 수 있어요.", needs: ["상대 MBTI (선택)"] },
    sections,
    visuals: [
      {
        kind: "habit-table",
        title: "소통 습관 나란히 보기",
        columns: [`나 · ${b.usedType}`, b.pm ? `상대 · ${b.pm}` : "상대 · 미확정"],
        rows: pairs.map((p) => {
          const i = (l: MbtiLetter) => (["E", "S", "T", "J"].includes(l) ? 0 : 1);
          return { label: AXIS_TALK[p.ax].name, a: AXIS_TALK[p.ax].habit[i(p.me)], b: p.them ? AXIS_TALK[p.ax].habit[i(p.them)] : AXIS_TALK[p.ax].habit.join(" / ") + " ?" };
        }),
        note: b.their ? undefined : "상대 칸은 두 가지 중 어느 쪽이었는지 스스로 떠올려 보는 칸이에요.",
      },
    ],
    insight: {
      advisor: ["같은 말을 다르게 들었다면, 둘 중 누가 틀린 게 아니라 다른 귀로 들은 거예요."],
      practice: "다음 대화에서 ‘지금 해결이 필요해, 들어 주는 게 필요해?’를 한 번 물어보세요.",
      questions: ["그 사람과 가장 잘 통했던 대화는 어떤 대화였나요?"],
    },
  };
}

/* ── 06 반복되었던 관계 패턴 ── */
function ch06(s: ProductSource): Part {
  const b = base(s);
  const reason = s.reunion?.reason;
  const P = REASON_PATTERN[reason ?? "none"];
  const diffAx = b.their ? AXIS_KEYS.filter((ax, i) => b.my[i] !== b.their![i]) : [];
  return {
    summary: `내가 느낀 이별 이유로 보면, 두 사람 사이에서 되풀이된 건 ‘${P.key}’일 수 있어요.`,
    dataSlot: reason
      ? { status: "demo", label: "내가 고른 이유 기준", detail: `‘${REUNION_LABELS.reason[reason]}’를 바탕으로 한 해석이에요. 실제로 무슨 일이 있었는지 판정하지 않아요.` }
      : { status: "needs-input", label: "이별 이유 미확정", detail: "이유를 고르지 않으셔서 일반적인 고리로 보여드려요.", needs: ["내가 느낀 이별 이유 (선택)"] },
    sections: [
      { id: "loop", title: "되풀이된 고리", body: [P.body] },
      { id: "turn", title: "고리를 끊을 수 있었던 곳", body: [P.turn, ...(diffAx.length ? [`특히 ${diffAx.map((ax) => AXIS_TALK[ax].name.split(" · ")[1]).join(" · ")}의 차이가 이 고리를 더 빨리 돌렸을 수 있어요.`] : [])] },
      { id: "signal", title: "다음에 알아차릴 신호", body: [`${P.signal}, 잠깐 멈추고 지금 이 고리의 어디쯤인지 떠올려 보세요.`] },
    ],
    visuals: [{ kind: "pattern-loop", steps: P.steps, center: P.center, note: "사용자가 고른 이유를 바탕으로 한 예시 고리예요." }],
    insight: {
      advisor: ["반복된 장면을 찾는 건 누구의 잘못을 가리려는 게 아니에요.", "다음에 같은 장면이 오면 알아차리기 위해서예요."],
      practice: "고리의 네 칸 중 내가 바꿀 수 있었던 한 칸에 표시해 보세요.",
      questions: ["그 장면에서 내가 정말 하고 싶었던 말은 무엇이었을까?"],
    },
  };
}

/* ── 07 이별 시점의 운세 해석 ── */
function ch07(s: ProductSource): Part {
  const b = base(s);
  const br = s.reunion?.breakup;
  if (!br || br === "private") {
    const priv = br === "private";
    return {
      summary: priv ? "이별 시기는 말하지 않기로 하셔서, 그해의 기운은 비워 두었어요." : "이별 시기가 미확정이라, 그해의 기운과 나의 결을 겹쳐 보지 않았어요.",
      dataSlot: { status: "needs-input", label: "이별 시기 미확정", detail: "헤어진 연도와 월을 알려주시면 그해 · 그달의 간지를 보여드려요. 날짜(일)는 필요 없어요.", needs: ["헤어진 연 · 월 (선택)"] },
      sections: [
        { id: "limit", title: "제한적인 해석", body: ["시기를 몰라도 괜찮아요. 운세보다 중요한 건 그 무렵 내 생활이 어땠는지예요."], list: ["그 무렵 가장 바빴던 일은 무엇이었나요?", "그 무렵 내가 가장 지쳐 있던 부분은 어디였나요?", "그 무렵 우리 사이의 연락은 어땠나요?"] },
        { id: "term", title: "시기를 알게 된다면", body: ["사주에서 해는 입춘(2월 4일 무렵)에, 달은 절기에 바뀌어요. 그래서 달력과 한두 주 어긋날 수 있다는 점까지 함께 보여드려요."] },
      ],
      visuals: [{ kind: "breakup-timing", status: priv ? "private" : "unknown" }],
      insight: { advisor: ["시기를 몰라도, 그때의 마음은 기억 속에 남아 있어요."], practice: "그 무렵의 일상 한 장면을 떠올려 적어 보세요.", questions: ["그 무렵의 나에게 지금 해 주고 싶은 말은?"] },
    };
  }
  const yg = yearGanJi(br.y);
  const prev = yearGanJi(br.y - 1);
  const rel = relationTo(b.dm.element, yg.stem.element).name;
  const w = monthWindow(br.y, br.m);
  const months = monthsBetween(br, s.now);
  const elapsed = months >= 0 ? `약 ${months}개월 전 (${s.reportId === "sample" ? `예시 기준일 ${s.now.getFullYear()}년 ${s.now.getMonth() + 1}월 · ` : ""}달 단위 계산)` : "";
  return {
    summary: `헤어진 ${br.y}년은 ${ganjiText(yg)}년이에요. 나의 일간${b.sampleTag}에게는 ‘${LOVE_GOD[rel].name}(${rel})’이 들어온 해로 읽어요.`,
    dataSlot: demoSlot(s, "원국", " 연 · 월 간지는 달력으로 정해진 값이고, 나와의 관계 해석은 샘플 원국 기준이에요."),
    sections: [
      { id: "year", title: `${br.y}년 ${ganjiText(yg)}년`, body: [`천간 ${yg.stem.hanja}은 ${ELEMENTS[yg.stem.element].hangul}, 지지 ${yg.branch.hanja}는 ${ELEMENTS[yg.branch.element].hangul}의 기운이에요.`, YEAR_GOD_READING[rel]], more: br.m <= 2 ? [`${br.m}월이 입춘(2월 4일 무렵) 전이었다면, 절기로는 아직 ${br.y - 1}년 ${ganjiText(prev)}년이에요. 날짜를 모르면 두 해가 모두 가능해요.`] : undefined },
      { id: "month", title: "달력 월과 절기 월", body: [`달력의 ${br.m}월은 ${w.term}(${br.m}월 ${w.termDay}일 무렵)을 기준으로 두 달에 걸쳐 있어요. ${w.term} 전이면 ${ganjiText(w.before.ganji)}월, 그 뒤면 ${ganjiText(w.after.ganji)}월이에요.`, "헤어진 날짜(일)는 묻지 않았으니, 두 달 중 그때 마음에 더 가까운 쪽으로 읽어 주세요. 절기 날짜는 해마다 하루 안팎 달라져요."] },
      ...(elapsed ? [{ id: "since", title: "그 뒤로 흐른 시간", body: [`${elapsed}예요.`, elapsedNote(months)] }] : []),
    ],
    visuals: [
      {
        kind: "breakup-timing",
        status: "known",
        year: { label: `${br.y}년`, pillar: ganjiText(yg), reading: ganjiReading(yg), color: ELEMENTS[yg.stem.element].color, relation: `나${b.sampleTag}에게 ${rel}` },
        window: { calendar: `${br.y}년 ${br.m}월`, before: { label: w.before.label, pillar: ganjiText(w.before.ganji) }, after: { label: w.after.label, pillar: ganjiText(w.after.ganji) }, term: w.term },
        elapsed,
      } satisfies ProductVisual,
    ],
    insight: {
      advisor: ["그해의 기운은 이별의 이유가 아니에요.", "그때 내 마음이 어디로 쏠리기 쉬웠는지 비춰 보는 거울이에요."],
      practice: "그 무렵의 나에게 짧은 편지를 써 보세요. 보내지 않아도 괜찮아요.",
      questions: ["그해의 나는 무엇을 가장 지키고 싶었을까?"],
    },
  };
}

/* ── 08 재회를 생각할 때 고려할 점 ── */
function ch08(s: ProductSource): Part {
  const c = s.reunion?.contact;
  const N = CONTACT_NOTES[c ?? "none-given"];
  const br = s.reunion?.breakup;
  const months = br && br !== "private" ? monthsBetween(br, s.now) : null;
  return {
    summary: c === "ended" ? "연락하지 않기로 한 약속이 있어요. 이 챕터는 재회보다 나를 돌보는 쪽으로 정리했어요." : `${N.title} — 다시 시작을 생각하기 전에, 먼저 살펴볼 것들이 있어요.`,
    dataSlot: c ? { status: "demo", label: "알려주신 연락 상태 기준", detail: `‘${REUNION_LABELS.contact[c]}’ 상황에서 살펴볼 점이에요. 결정을 대신하지 않아요.` } : { status: "needs-input", label: "연락 상태 미확정", detail: "연락 상태를 알려주시면 그 상황에 맞춰 바뀌어요.", needs: ["이별 이후 연락 여부 (선택)"] },
    sections: [
      { id: "contact", title: N.title, body: [...N.body, ...(months !== null && months >= 0 ? [elapsedNote(months)] : [])] },
      {
        id: "self",
        title: "재회보다 나를 먼저 챙겨야 할 때",
        body: ["이런 경우라면 재회 여부보다 나의 안전과 마음이 먼저예요. 가까운 사람이나 상담 전문가와 이야기해 보세요."],
        list: ["상대가 연락을 원하지 않는다고 분명히 말했을 때", "관계 안에서 두렵거나 위축됐던 기억이 있을 때", "같은 이유로 여러 번 헤어지고 다시 만났을 때", "재회만이 지금의 외로움을 달랠 방법처럼 느껴질 때"],
      },
      { id: "ask", title: "결정 전에 스스로 묻는 질문", body: ["중요한 결정은 운세 하나로 내리지 않는 게 좋아요. 아래 질문에 솔직하게 답해 보세요."], list: [...N.checks, "다시 만난다면, 헤어진 이유는 어떻게 달라져 있을까?"] },
    ],
    visuals: [],
    insight: {
      advisor: ["다시 시작할지, 잘 마무리할지는 운결이 정해 드릴 수 없어요.", "대신 정하는 데 필요한 질문은 함께 찾을 수 있어요."],
      practice: "질문 중 하나를 골라 오늘 밤 세 줄로 답해 보세요.",
      questions: ["이 관계에서 내가 꼭 지키고 싶은 나의 모습은?"],
    },
  };
}

/* ── 09 관계 회복과 소통에 대한 조언 ── */
function ch09(s: ProductSource): Part {
  const b = base(s);
  const ended = s.reunion?.contact === "ended";
  const tips = b.their ? AXIS_KEYS.filter((ax, i) => b.my[i] !== b.their![i]).map((ax) => AXIS_TALK[ax].tip) : [];
  return {
    summary: ended ? "연락하지 않기로 하셨으니, 이 조언은 다음 관계와 나 자신과의 대화에 쓰도록 정리했어요." : b.their ? `두 사람 조합에서는 ${tips.length ? "다른 선호를 미리 말로 맞추는 것" : "같은 선호가 한쪽으로 치우치지 않게 하는 것"}이 대화의 열쇠예요.` : "상대 MBTI가 미확정이라, 어느 조합에서나 통하는 대화법을 중심으로 정리했어요.",
    dataSlot: { status: "demo", label: "MBTI · 연락 상태 기준", detail: "대화법 제안이에요. 상대의 반응을 예측하거나 보장하지 않아요." },
    sections: [
      { id: "pair", title: ended ? "다음 관계에서 쓸 대화법" : "두 사람 조합의 대화법", body: tips.length ? ["두 사람의 다른 선호마다 하나씩, 미리 맞춰 두면 좋은 말이에요."] : ["어느 조합에서나 갈등을 줄이는 기본 약속이에요."], list: tips.length ? tips : ["대화의 시점을 먼저 정하기", "해결이 필요한지, 들어 주길 원하는지 묻기", "‘항상 · 한 번도’ 대신 오늘 일만 이야기하기"] },
      ...(ended
        ? [{ id: "self", title: "나와의 대화", body: ["연락하지 않는 동안에도 마음속 대화는 계속돼요. 하고 싶은 말을 적어 두면, 보내지 않아도 마음이 조금 가벼워져요."] }]
        : [
            { id: "keep", title: "연락한다면 지킬 것", body: ["연락할지는 당신이 정할 일이에요. 정했다면, 이것만은 지켜 주세요."], list: ["답을 재촉하지 않기", "예전 다툼을 첫 대화에 꺼내지 않기", "한 번에 한 가지 이야기만", "상대의 답 — 답이 없는 것까지 — 존중하기"] },
            { id: "plan", title: "답이 없을 때의 내 계획", body: ["연락하기 전에 ‘답이 없으면 나는 무엇을 할지’를 먼저 정해 두세요. 산책, 친구와의 약속, 일기처럼 나를 돌볼 일 하나면 충분해요."] },
          ]),
    ],
    visuals: [],
    insight: {
      advisor: ["좋은 대화는 상대를 바꾸는 말이 아니라, 서로가 안전하다고 느끼는 말이에요."],
      practice: "하고 싶은 말을 세 문장으로 적고, 그중 재촉하는 문장이 있으면 지워 보세요.",
      questions: ["그 사람에게 가장 듣고 싶었던 말은 무엇이었을까?"],
    },
  };
}

/* ── 10 나를 위한 종합 결론 ── */
const CONCERN_LINE: Record<string, string> = {
  again: "다시 만나고 싶은 마음으로 이 리포트를 펼치셨어요.",
  unsure: "아직 마음을 정하지 못한 채 이 리포트를 펼치셨어요.",
  close: "마음을 정리하고 싶어서 이 리포트를 펼치셨어요.",
};

function ch10(s: ProductSource, parts: Record<string, Part>): Part {
  const q = s.reunion?.question;
  const A = q ? QUESTION_ANSWERS[q] : null;
  const br = s.reunion?.breakup;
  const practices = ["01", "02", "03", "05", "06", "07", "08", "09"].map((id) => parts[id]?.insight.practice).filter((x): x is string => !!x);
  const info = s.reunion ?? {};
  const pState = partnerState(s);
  return {
    summary: A ? `가장 궁금했던 ‘${A.title}’에 대해, 운결이 정직하게 말할 수 있는 것을 정리했어요.` : "앞의 아홉 챕터에서 찾은 것을 한곳에 모았어요.",
    dataSlot: demoSlot(s, "풀이", " 상담 입력 중 무엇이 쓰였고 무엇이 미확정인지 아래 표에 정리했어요."),
    sections: [
      { id: "sum", title: "지금까지의 정리", body: [CONCERN_LINE[s.concern ?? ""] ?? "어떤 마음으로 펼쳤든, 여기까지 읽은 것만으로도 충분해요."], list: [parts["02"].summary, parts["06"].summary, parts["07"].summary].filter(Boolean) },
      ...(A ? [{ id: "answer", title: A.title, body: A.body }] : [{ id: "answer", title: "가장 궁금한 질문", body: ["상담에서 가장 궁금한 질문을 고르시면, 그 질문에 대한 정직한 답이 이 자리에 들어와요."] }]),
      { id: "practice", title: "나를 위한 실천 모음", body: ["앞 챕터의 실천을 모은 거예요. 하나만 골라 일주일 해 보세요."], list: practices.slice(0, 5) },
    ],
    visuals: [
      {
        kind: "input-status",
        rows: [
          { label: "내 사주", state: isDemo(s.payload) ? "샘플" : "계산됨", known: !isDemo(s.payload), use: "01 · 02 · 04 · 07" },
          { label: "내 MBTI", state: s.mbti ? s.mbti : "미확정 (참고유형)", known: !!s.mbti, use: "01 · 02 · 03 · 05 · 09" },
          { label: "상대 생년월일", state: pState === "birth" ? "받음 · 계산 미연결" : "미확정", known: false, use: "04 (연결 후)" },
          { label: "상대 MBTI", state: s.partner?.mbti ? "있음" : "미확정", known: !!s.partner?.mbti, use: "03 · 05 · 09" },
          { label: "헤어진 연 · 월", state: br && br !== "private" ? "있음" : br === "private" ? "말하지 않음" : "미확정", known: !!br && br !== "private", use: "07 · 08" },
          { label: "이별 이후 연락", state: info.contact ? REUNION_LABELS.contact[info.contact] : "미확정", known: !!info.contact && info.contact !== "private", use: "08 · 09" },
          { label: "내가 느낀 이유", state: info.reason ? REUNION_LABELS.reason[info.reason] : "미확정", known: !!info.reason, use: "06" },
          { label: "가장 궁금한 질문", state: info.question ? REUNION_LABELS.question[info.question] : "미확정", known: !!info.question, use: "10" },
        ],
      },
    ],
    insight: {
      advisor: ["여기까지 읽어 주셔서 고마워요.", "어떤 결정을 하든, 그 결정의 주인은 당신이에요."],
      questions: ["이 관계에서 내가 가져가고 싶은 한 가지는 무엇일까?"],
    },
  };
}

export function buildReunionChapters(s: ProductSource): ProductChapter[] {
  const parts: Record<string, Part> = { "01": ch01(s), "02": ch02(s), "03": ch03(s), "04": ch04(s), "05": ch05(s), "06": ch06(s), "07": ch07(s), "08": ch08(s), "09": ch09(s) };
  parts["10"] = ch10(s, parts);
  return REUNION_CHAPTERS.map((m, i) => ({ ...m, no: i + 1, ...parts[m.id], asks: REUNION_ASKS[m.id] ?? [] }));
}

/** 채팅의 무료 요약 카드 — 개인정보 없이 핵심 세 줄 */
export function reunionFreeSummary(s: ProductSource): string[] {
  const b = base(s);
  const P = REASON_PATTERN[s.reunion?.reason ?? "none"];
  const br = s.reunion?.breakup;
  const yearLine =
    br && br !== "private"
      ? `이별한 ${br.y}년은 ${ganjiText(yearGanJi(br.y))}년 — 나${b.sampleTag}에게는 ${relationTo(b.dm.element, yearGanJi(br.y).stem.element).name}의 해였어요.`
      : "이별 시기는 미확정이라 그해의 기운은 비워 두었어요.";
  return [
    `나의 결 · ${b.trait.image}${b.sampleTag}, 지금의 선호 ${b.myType ?? "미확정"}`,
    `되풀이된 고리 · ${P.key}`,
    yearLine,
    b.pm ? `상대 MBTI ${b.pm}와 비교 · 사주 비교는 미확정` : "상대 정보 미확정 · 내 쪽 중심으로 풀이",
  ];
}
