import { TOPIC_IDS, TOPICS, type TopicId } from "@/features/saju/topics";
import { needsPartner, TOPIC_FLOWS } from "./topicFlows";
import { CHAPTER_ASKS, chapterMeta } from "@/content/report/chapters";
import { PRODUCTS } from "@/content/products";
import { OTHER_ASKS } from "@/content/products/others";
import { REUNION_ASKS, REUNION_LABELS } from "@/content/products/reunion";
import { productHref } from "@/features/products/routes";
import { isProductId } from "@/features/products/types";
import { reportHrefFor } from "@/features/report/handoff";
import { isSampleMode } from "@/features/saju/live";
import { isChapterId } from "@/features/report/types";
import type { AutoNext, ChoiceOption, Consult, Line, NextNode, NodeId, Profile, Prompt, ScriptNode } from "./types";

/* ──────────────────────────────────────────────────────────
   첫 상담 대본 (상태 머신)
   각 노드 = 운결이 순서대로 말하는 줄(say) + 그다음 사용자에게 받는 것(then)
   문구 수정은 이 파일만 고치면 됩니다.
   ────────────────────────────────────────────────────────── */

const callName = (p: Profile) => (p.nickname ? `${p.nickname}님` : "");

export const SCRIPT: Record<NodeId, ScriptNode> = {
  welcome: {
    say: [
      "안녕하세요. 운결이에요.",
      "오늘은 조금 특별한 이야기를 해볼까 해요.",
      "혹시 MBTI 검사 결과를 보고 이런 생각 해본 적 있나요?",
      "분명 내 성격이 맞는데,\n가끔은 전혀 다른 사람처럼 행동할 때가 있다는 거요.", // 글자가 커져 둘째 줄은 자동 줄바꿈 (어절 단위)
    ],
    then: {
      type: "choices",
      options: [
        { label: "맞아요, 그런 적 있어요.", next: "explain" },
        { label: "음, 잘 모르겠어요.", next: "explain" },
      ],
    },
  },

  explain: {
    say: [
      "괜찮아요. 사람은 하나의 유형만으로 설명하기 어렵거든요.",
      "그래서 저는 타고난 기질을 살펴보는 사주와, 지금의 성향을 나타내는 MBTI를 함께 살펴보려고 해요.",
      "당신의 두 가지 결도 한번 확인해볼까요?",
    ],
    then: {
      type: "choices",
      options: [
        { label: "좋아요. 시작해볼래요.", next: "@info" },
        { label: "어떤 걸 알 수 있나요?", next: "about" },
      ],
    },
  },

  about: {
    say: [
      "타고난 나와 지금의 나를 나란히 놓고, 어디서 닮았고 어디서 엇갈리는지 볼 수 있어요.",
      "그 두 결로 연애, 재물, 직업, 관계, 신년운세를 하나씩 풀어볼 수도 있고요.",
      "필요한 건 생년월일과 MBTI 정도예요. 시간이나 MBTI를 몰라도 괜찮아요.",
    ],
    then: {
      type: "choices",
      options: [
        { label: "좋아요. 시작해볼래요.", next: "@info" },
        { label: "다음에 할게요.", next: "later" },
      ],
    },
  },

  later: {
    say: ["알겠어요. 언제든 다시 이야기 걸어주세요.", "그동안 결과 화면이 어떤 모습인지 샘플로 먼저 둘러봐도 좋아요."],
    then: {
      type: "choices",
      options: [
        { label: "샘플 결과 둘러보기", href: "/result" },
        { label: "지금 시작할래요.", next: "@info" },
      ],
    },
  },

  askName: {
    // 홈에서 들어온 상담은 바로 앞에서 '기본 정보를 알려주세요'라고 했으므로 짧게
    say: (_p, c) => (c.entry === "intro" && !c.editing ? ["좋아요. 먼저, 어떻게 불러드리면 될까요?"] : ["어떻게 불러드리면 될까요?"]),
    then: { type: "input", field: "nickname", next: "@info" },
  },

  askCalendar: {
    say: [
      (p, c) => (c.editing ? "생년월일을 다시 알려주세요." : c.greeted ? "생년월일부터 여쭤볼게요." : p.nickname ? `${callName(p)}, 반가워요.` : "좋아요, 그럼 바로 시작할게요."),
      "태어난 날은 양력과 음력 중 어느 쪽으로 알고 있나요?",
    ],
    then: {
      type: "choices",
      options: [
        { label: "양력", reply: "양력으로 알고 있어요.", next: "@info", patch: { calendar: "solar", leap: undefined } },
        { label: "음력", reply: "음력으로 알고 있어요.", next: "@info", patch: { calendar: "lunar" } },
      ],
    },
  },

  askLeap: {
    say: ["음력이라면, 혹시 윤달에 태어나셨나요?"],
    then: {
      type: "choices",
      options: [
        { label: "윤달 아니에요", reply: "윤달은 아니에요.", next: "@info", patch: { leap: false } },
        { label: "윤달이에요", reply: "윤달이에요.", next: "@info", patch: { leap: true } },
        { label: "잘 모르겠어요", reply: "윤달인지는 잘 모르겠어요.", next: "@info", patch: { leap: null } },
      ],
    },
  },

  askDate: {
    say: ["생년월일을 알려주세요."],
    then: { type: "input", field: "birthdate", next: "@info" },
  },

  askTime: {
    say: ["태어난 시간도 알고 있나요?", "정확히 모르면 ‘모름’으로 두어도 괜찮아요.", "시간 없이도 볼 수 있는 부분이 많아요."],
    then: { type: "input", field: "birthtime", next: "@info" },
  },

  askGender: {
    say: ["성별을 알려주세요.", "사주에서는 대운이 흐르는 방향을 정할 때 쓰여요."],
    then: {
      type: "choices",
      options: [
        { label: "여성", next: "@info", patch: { gender: "female" } },
        { label: "남성", next: "@info", patch: { gender: "male" } },
      ],
    },
  },

  askMbti: {
    say: (_p, c) => [c.editing || needsPartner(c.topic) ? "MBTI를 알고 있나요?" : "마지막으로, MBTI를 알고 있나요?"],
    then: { type: "input", field: "mbti", next: "@info" },
  },

  confirm: {
    say: (_p, c) =>
      c.editing
        ? ["고친 내용으로 다시 정리했어요.", { card: "summary" }]
        : [
            "이렇게 입력해주셨어요.",
            { card: "summary" },
            "입력하신 정보는 서버로 보내거나 기기에 저장하지 않아요.",
            "새로고침하거나 메뉴에서 ‘처음부터 다시’를 누르면 바로 지워져요.",
          ],
    then: {
      type: "choices",
      options: [
        { label: "맞아요", reply: "네, 맞아요.", next: "analyze" },
        { label: "고칠 부분이 있어요", reply: "고칠 부분이 있어요.", next: "editPick" },
      ],
    },
  },

  /* 고칠 항목 고르기 — 고른 항목만 비우고, 비어 있는 정보만 다시 물은 뒤 확인으로 돌아옴 */
  editPick: {
    say: ["어떤 부분을 고칠까요?"],
    then: (_p, c) => ({ type: "choices", options: editOptions(c) }),
  },

  /*
    분석 결과 — 모두 채팅 안에서 차례로 도착
    실제 만세력 엔진이 연결되기 전이라 사주 카드는 모두 '샘플'로 표시하고, 그 사실을 먼저 말함
  */
  analyze: {
    say: (p: Profile, c: Consult): Line[] => {
      const tid = topicOf(c);
      const lead = leadLine(c);
      return [
        c.entry === "home" ? "고마워요. 이제 결과를 준비할게요." : "고마워요. 시작하기 전에 한 가지만 말씀드릴게요.",
        isSampleMode()
          ? "아직 실제 만세력 계산이 연결되지 않아서, 오늘 보여드리는 사주 내용은 샘플이에요."
          : "입력하신 생년월일로 만세력을 계산해 볼게요. 계산이 안 되면 샘플로 보여드리고 그렇다고 알려 드릴게요.",
        "결과는 카드로 하나씩 보내드릴게요. 카드를 누르면 크게 펼쳐서 자세한 풀이를 볼 수 있어요.",
        isSampleMode() ? "먼저 샘플 사주로 원국이 어떻게 보이는지 보여드릴게요." : "먼저 사주 원국부터 살펴볼게요.",
        { card: "manse" },
        "사주에는 서로 다른 다섯 가지 기운이 담겨 있어요.",
        { card: "elements" },
        isSampleMode() ? "이 샘플 사주의 기운으로 읽은 예시 기질이에요. 내 사주의 해석은 아니에요." : "원국의 일간으로 읽은 기질이에요. 카드 아래에 근거를 적어 두었어요.",
        { card: "innate" },
        p.mbti ? "그럼 지금의 당신을 나타내는 MBTI를 볼게요." : "MBTI를 모르셔도 괜찮아요. 스스로 살펴볼 수 있게 정리해 둘게요.",
        { card: "current" },
        p.mbti ? "두 가지 관점을 나란히 놓으면 닮은 부분도, 다른 부분도 보여요." : "타고난 결을 MBTI의 말로 옮겨 보면 이렇게 비교해 볼 수 있어요.",
        { card: "compare" },
        "마지막으로 지금까지를 한데 모아 볼게요.",
        { card: "insight" },
        ...(p.partner && (p.partner.birth || p.partner.mbti)
          ? ["상대방 정보도 받아 두었어요. 두 사람의 사주를 나란히 비교하는 계산은 아직 연결 전이에요."]
          : needsPartner(c.topic) && p.partner === null
            ? ["상대방 정보는 입력하지 않으셨어요. 두 사람 비교는 ‘미확정’으로 남겨 둘게요."]
            : []),
        // 주제별 리포트 무료 요약 → 리포트 미리보기 (홈에서 상품 주제를 골라 들어온 상담)
        ...(c.entry === "home" && isProductId(c.topic)
          ? [`${PRODUCTS[c.topic].title}의 무료 요약이에요.`, { card: "product" as const, arg: c.topic }]
          : []),
        // 9 운세 주제 선택 — 홈에서 고른 주제가 있으면 맨 앞에 (상담 주제는 그대로 유지)
        ...(lead ? [lead] : []),
        tid ? `${TOPICS[tid].label} 이야기부터 볼까요? 다른 운세를 골라도 괜찮아요.` : "이제 어떤 이야기가 가장 궁금하세요?",
      ];
    },
    then: (_p, c) => ({ type: "choices", options: topicOptions(c) }),
  },

  topics: {
    say: ["또 어떤 이야기가 궁금하세요?"],
    then: (_p, c) => ({ type: "choices", options: topicOptions(c) }),
  },

  ...topicNodes(),

  /* ── 홈에서 주제를 골라 들어온 상담 ── */

  // 1·2 주제별 첫 인사 + 지금의 고민
  greet: {
    say: (_p, c) => [...TOPIC_FLOWS[c.topic].greet, TOPIC_FLOWS[c.topic].concern.ask],
    then: (_p, c) => ({ type: "choices", options: concernOptions(c) }),
  },
  concernAgain: {
    say: (_p, c) => ["지금 마음에 더 가까운 걸 다시 골라 주세요.", TOPIC_FLOWS[c.topic].concern.ask],
    then: (_p, c) => ({ type: "choices", options: concernOptions(c) }),
  },
  // 3 고민에 따라 갈라지는 후속 질문
  detail: {
    say: (_p, c) => {
      const q = detailQuestion(c);
      return [c.answers.concern?.react ?? "", q?.ask ?? ""].filter(Boolean);
    },
    then: (_p, c) => ({
      type: "choices",
      options: (detailQuestion(c)?.options ?? []).map((o) => ({
        label: o.label,
        reply: o.reply,
        record: { key: "detail" as const, value: o.value, react: o.react },
        next: "bridge" as const,
      })),
    }),
  },
  // 반응 한마디 → 기본 정보 (질문이 아니므로 자동으로 이어짐)
  bridge: {
    say: (p, c) => {
      const react = (c.answers.detail ?? c.answers.concern)?.react;
      const known = nextInfoNode(p, c) === "confirm";
      return [react ?? "", c.editing ? "" : known ? "알려주신 정보는 그대로 쓸게요." : TOPIC_FLOWS[c.topic].bridge].filter(Boolean);
    },
    then: { type: "auto", next: "@info" },
  },
  // 6 상대방 정보 (재회 · 궁합, 모두 선택)
  extra: {
    say: (_p, c) =>
      TOPIC_FLOWS[c.topic].partner === "encouraged"
        ? ["이제 상대방 정보를 여쭤볼게요.", "생년월일이나 MBTI를 알면 두 사람의 결을 나란히 볼 수 있어요.", "모르는 건 건너뛰어도 괜찮아요."]
        : ["혹시 상대방 정보도 알고 있나요?", "알면 두 사람의 결을 나란히 볼 수 있어요. 몰라도 괜찮아요.", "상대방 정보도 저장하지 않고, 이 탭을 닫으면 사라져요."],
    then: {
      type: "choices",
      options: [
        { label: "양력 생일을 알아요", reply: "상대방 양력 생일을 알아요.", next: "partnerDate", patch: { partner: { calendar: "solar" } } },
        { label: "음력 생일을 알아요", reply: "상대방 음력 생일을 알아요.", next: "partnerDate", patch: { partner: { calendar: "lunar" } } },
        { label: "MBTI만 알아요", reply: "상대방 MBTI만 알아요.", next: "partnerMbti", patch: { partner: {} } },
        { label: "몰라요, 건너뛸게요", reply: "상대방 정보는 몰라요.", next: "@info", patch: { partner: null } },
      ],
    },
  },
  partnerDate: {
    say: (p) => ["상대방 생년월일을 알려주세요.", ...(p.partner?.calendar === "lunar" ? ["윤달 여부는 ‘모름’으로 둘게요."] : [])],
    then: { type: "input", field: "partnerDate", next: "partnerMbti" },
  },
  partnerMbti: {
    say: ["상대방 MBTI도 알고 있나요?"],
    then: { type: "input", field: "partnerMbti", next: "@info" },
  },

  /* ── 재회 상담: 이별 정보 (모두 선택형 · 건너뛸 수 있음) ── */
  reBreakup: {
    say: (_p, c) =>
      c.editing
        ? ["헤어진 때를 다시 알려주세요. 연도와 월만이면 돼요."]
        : ["이제 이별에 대해 몇 가지만 여쭤볼게요.", "답하기 어려운 건 넘어가도 괜찮아요. 이 내용도 저장하지 않아요.", "헤어진 때는 언제쯤이에요? 연도와 월만 알려주세요."],
    then: { type: "input", field: "breakup", next: "@info" },
  },
  reContact: {
    say: ["헤어진 뒤 연락은 어땠어요?"],
    then: {
      type: "choices",
      options: (["none", "some", "recent", "ended", "private"] as const).map((v) => ({
        label: v === "private" ? "말하고 싶지 않아요" : REUNION_LABELS.contact[v],
        reply: v === "private" ? "연락 이야기는 하고 싶지 않아요." : `${REUNION_LABELS.contact[v]}.`.replace("요..", "요."),
        reunion: { contact: v },
        next: "@info" as const,
      })),
    },
  },
  reReason: {
    say: ["헤어진 이유는 어떻게 느끼고 있어요?", "누가 옳았는지 정하려는 게 아니에요. 지금 내 마음에 가까운 걸 골라 주세요."],
    then: {
      type: "choices",
      options: (["talk", "time", "future", "cooled", "conflict", "unsure"] as const).map((v) => ({
        label: REUNION_LABELS.reason[v],
        reply: `${REUNION_LABELS.reason[v]}.`,
        reunion: { reason: v },
        next: "@info" as const,
      })),
    },
  },
  reQuestion: {
    say: ["마지막으로, 가장 궁금한 건 무엇이에요?"],
    then: {
      type: "choices",
      options: (["chance", "mind", "missed", "contact", "closure"] as const).map((v) => ({
        label: REUNION_LABELS.question[v],
        reply: v === "closure" || v === "mind" ? `${REUNION_LABELS.question[v]}.` : `${REUNION_LABELS.question[v]}?`,
        reunion: { question: v },
        next: "reNote" as const,
      })),
    },
  },
  // 궁금한 점에 대한 정직한 한마디 — 알 수 없는 것은 알 수 없다고 (질문 아님 → 자동 진행)
  reNote: {
    say: (p) => [REUNION_NOTE[p.reunion?.question ?? "chance"]],
    then: { type: "auto", next: "@info" },
  },

  /* ── 리포트에서 '운결에게 더 물어보기' — 미리 작성된 설명만 (실시간 AI 답변 아님) ── */
  askChapter: {
    say: (_p, c) => {
      const m = askMeta(c);
      return [
        m ? `${m.product ? `${m.product} ` : "리포트 "}‘${m.id} ${m.title}’ 챕터를 읽다가 오셨군요.` : "리포트를 읽다가 오셨군요.",
        "궁금한 걸 골라 주세요.",
        "지금은 미리 준비해 둔 설명으로 답해 드려요. 실시간 AI 답변이 아니에요.",
      ];
    },
    then: (_p, c) => ({ type: "choices", options: askOptions(c, null) }),
  },
  askAnswer: {
    say: (_p, c) => {
      const a = askList(c)[c.ask?.q ?? -1];
      return [...(a?.answer ?? []), "더 궁금한 게 있나요?"];
    },
    then: (_p, c) => ({ type: "choices", options: askOptions(c, c.ask?.q ?? null) }),
  },

  // 다른 주제로 바꿀지 확인 (홈에서 다른 주제를 골라 돌아왔을 때)
  switchTopic: {
    say: (_p, c) => [
      `지금은 ‘${TOPIC_FLOWS[c.topic].name}’ 이야기를 나누고 있었어요.`,
      `‘${TOPIC_FLOWS[c.pendingTopic ?? c.topic].name}’ 상담으로 바꿀까요? 입력하신 정보는 그대로 쓸게요.`,
    ],
    then: (_p, c) => ({
      type: "choices",
      options: [
        { label: "바꿀게요", reply: `‘${TOPIC_FLOWS[c.pendingTopic ?? c.topic].name}’ 상담으로 바꿀게요.`, switchTopic: "accept" },
        { label: "지금 상담 이어서", reply: "지금 상담을 이어서 할게요.", switchTopic: "keep" },
      ],
    }),
  },
};

const REUNION_NOTE: Record<string, string> = {
  chance: "다시 이어질지는 운세로 정해지지 않아요. 대신 두 사람의 결이 어디서 엇갈렸는지 함께 볼게요.",
  mind: "상대방의 지금 마음은 사주나 MBTI로 알 수 없어요. 대신 두 사람이 어떻게 소통했는지, 내 마음은 무엇을 바라는지 볼게요.",
  missed: "좋은 질문이에요. 나를 탓하지 않고, 다음에 알아차릴 신호를 찾는 쪽으로 볼게요.",
  contact: "연락은 결국 당신이 정할 일이에요. 정할 때 살펴볼 점을 정리해 드릴게요.",
  closure: "정리하는 마음도 소중해요. 차분히 함께 볼게요.",
};

/** 운세 주제 선택지 (8개) — 지금 상담 주제가 있으면 맨 앞에. 상품 주제면 그 리포트 미리보기도 */
function topicOptions(c?: Consult): ChoiceOption[] {
  const tid = c ? topicOf(c) : null;
  const ids = tid ? [tid, ...TOPIC_IDS.filter((x) => x !== tid)] : [...TOPIC_IDS];
  const product = c && c.entry === "home" && isProductId(c.topic) ? c.topic : null;
  return [
    ...(product ? [{ label: `${PRODUCTS[product].title} 미리보기`, href: productHref(product, "my") }] : []),
    ...ids.map((id) => ({ label: TOPICS[id].label, reply: TOPICS[id].ask, next: `topic-${id}` as NodeId })),
    { label: "12챕터 종합 리포트", href: "/report/my" },
  ];
}

/** 주제별 짧은 응답 + 샘플 풀이 카드 → 다른 주제 / 리포트 미리보기 */
function topicNodes() {
  const out = {} as Record<`topic-${TopicId}`, ScriptNode>;
  for (const id of TOPIC_IDS) {
    out[`topic-${id}`] = {
      say: [TOPICS[id].intro, { card: "topic", arg: id }, "더 깊은 풀이는 심층 리포트로 준비하고 있어요."],
      then: (_p, c) => ({ type: "choices", options: afterTopicOptions(c) }),
    };
  }
  return out;
}

export const FIRST_NODE: NodeId = "welcome";

/* ── 주제 상담 도우미 ── */

/** 홈 주제 → 채팅의 운세 풀이 주제 (통합 분석은 주제 목록을 보여줌) */
export function topicOf(c: Consult): TopicId | null {
  return c.topic === "integrated" ? null : c.topic;
}

function concernOptions(c: Consult): ChoiceOption[] {
  const f = TOPIC_FLOWS[c.topic];
  return f.concern.options.map((o) => ({
    label: o.label,
    reply: o.reply,
    record: { key: "concern" as const, value: o.value, react: o.react },
    next: f.detail(o.value) ? "detail" : "bridge",
  }));
}

function detailQuestion(c: Consult) {
  const v = c.answers.concern?.value;
  return v ? TOPIC_FLOWS[c.topic].detail(v) : null;
}

/** 결과 앞에서 사용자가 고른 고민을 한 번 짚어 줌 */
function leadLine(c: Consult): string | null {
  const a = c.answers.detail ?? c.answers.concern;
  return c.entry === "home" && a ? `앞에서 고르신 ‘${a.label}’, 그 마음을 떠올리며 읽어 보세요.` : null;
}

/** 리포트 질문의 챕터 — 종합 리포트(01~12) 또는 주제별 리포트(상품 id + 챕터 id) */
function askMeta(c: Consult): { id: string; title: string; product: string | null } | null {
  const id = c.ask?.chapterId;
  const pid = c.ask?.productId;
  if (!id) return null;
  if (isProductId(pid)) {
    const ch = PRODUCTS[pid].chapters.find((x) => x.id === id);
    return ch ? { id, title: ch.title, product: PRODUCTS[pid].title } : null;
  }
  return isChapterId(id) ? { id, title: chapterMeta(id).title, product: null } : null;
}
function askList(c: Consult) {
  const id = c.ask?.chapterId;
  const pid = c.ask?.productId;
  if (!id) return [];
  if (isProductId(pid)) return (pid === "reunion" ? REUNION_ASKS[id] : OTHER_ASKS[pid]?.[id]) ?? [];
  return isChapterId(id) ? CHAPTER_ASKS[id] : [];
}
/** 리포트 질문 선택지 — 아직 안 고른 질문 · 리포트로 돌아가기 · 하던 상담 이어서 / 상담 시작 */
function askOptions(c: Consult, picked: number | null): ChoiceOption[] {
  const qs = askList(c)
    .map((a, i) => ({ a, i }))
    .filter(({ i }) => i !== picked)
    .map(({ a, i }) => ({ label: a.q, reply: a.q, askPick: i, next: "askAnswer" as const }));
  const pid = c.ask?.productId;
  const rid = c.ask?.reportId === "my" ? "my" : "sample";
  const back: ChoiceOption = { label: "리포트로 돌아가기", href: isProductId(pid) ? productHref(pid, rid, c.ask?.chapterId) : reportHrefFor(c.ask?.reportId ?? "sample", c.ask?.chapterId) };
  const cont: ChoiceOption = c.resumeNode
    ? { label: "하던 상담 이어서", reply: "하던 상담을 이어서 할게요.", resumeConsult: true }
    : { label: "운결과 상담 시작하기", reply: "상담을 시작해 볼게요.", next: c.entry === "home" ? "greet" : "welcome" };
  return [...qs, back, cont];
}

/** 결과 뒤 선택지 */
function afterTopicOptions(c: Consult): ChoiceOption[] {
  const product = c.entry === "home" && isProductId(c.topic) ? c.topic : null;
  return [
    ...(product ? [{ label: `${PRODUCTS[product].title} 미리보기`, href: productHref(product, "my") }] : []),
    { label: "다른 주제도 볼래요", reply: "다른 주제도 볼래요.", next: "topics" },
    { label: "입력 정보 고치기", reply: "입력한 정보를 고칠게요.", next: "editPick" },
    { label: "종합 리포트 보기", href: "/report/my" },
    { label: "처음부터 다시", reply: "처음부터 다시 할게요.", restart: true },
  ];
}

/** 고칠 항목 — 고른 항목만 비우면 @info 가 그 항목만 다시 물음 */
function editOptions(c: Consult): ChoiceOption[] {
  const e = (label: string, reply: string, patch: Partial<Profile>): ChoiceOption => ({ label, reply, patch, edit: true, next: "@info" });
  return [
    e("생년월일", "생년월일을 고칠게요.", { calendar: undefined, leap: undefined, birth: undefined }),
    e("태어난 시간", "태어난 시간을 고칠게요.", { time: undefined }),
    e("성별", "성별을 고칠게요.", { gender: undefined }),
    e("MBTI", "MBTI를 고칠게요.", { mbti: undefined }),
    e("이름", "이름을 고칠게요.", { nickname: undefined }),
    ...(needsPartner(c.topic) ? [e("상대방 정보", "상대방 정보를 고칠게요.", { partner: undefined })] : []),
    ...(c.topic === "reunion" ? [e("이별 정보", "이별 정보를 고칠게요.", { reunion: undefined })] : []),
    ...(c.entry === "home" ? [{ label: "고민 다시 고르기", reply: "고민을 다시 고를게요.", edit: true, next: "concernAgain" as const }] : []),
    { label: "고칠 게 없어요", reply: "고칠 건 없어요.", next: "confirm" },
  ];
}

/**
 * 아직 받지 않은 정보 중 첫 번째 질문 노드 (모두 있으면 확인)
 * 같은 세션에서 이미 받은 정보는 다시 묻지 않음 — 주제를 바꾸거나 일부만 고칠 때도 같은 규칙
 */
export function nextInfoNode(p: Profile, c: Consult): NodeId {
  if (p.nickname === undefined) return "askName";
  if (p.calendar === undefined) return "askCalendar";
  if (p.calendar === "lunar" && p.leap === undefined) return "askLeap";
  if (p.birth === undefined) return "askDate";
  if (p.time === undefined) return "askTime";
  if (p.gender === undefined) return "askGender";
  if (p.mbti === undefined) return "askMbti";
  if (needsPartner(c.topic) && p.partner === undefined) return "extra";
  if (c.topic === "reunion") {
    const r = p.reunion ?? {};
    if (r.breakup === undefined) return "reBreakup";
    if (r.contact === undefined) return "reContact";
    if (r.reason === undefined) return "reReason";
    if (r.question === undefined) return "reQuestion";
  }
  return "confirm";
}

export const resolveNext = (n: NextNode, p: Profile, c: Consult): NodeId => (n === "@info" ? nextInfoNode(p, c) : n);

export function resolveThen(node: NodeId, p: Profile, c: Consult): Prompt | AutoNext {
  const t = SCRIPT[node].then;
  return typeof t === "function" ? t(p, c) : t;
}
