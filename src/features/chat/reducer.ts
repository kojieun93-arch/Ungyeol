import { FIRST_NODE, resolveNext, resolveThen, SCRIPT } from "./script";
import {
  RESULT_CARDS,
  RESULT_KEYS,
  type ChoiceOption,
  type Consult,
  type ConsultTopic,
  type Message,
  type NextNode,
  type NodeId,
  type Pending,
  type Profile,
  type Prompt,
} from "./types";

/* ──────────────────────────────────────────────────────────
   대화 상태 머신 (순수 함수)

   queue    : 아직 보이지 않은 상담자 메시지. DOM에 렌더링하지 않음
   typingId : 지금 '입력 중'으로 표시되는 queue 머리의 id
   prompt   : queue가 비면 사용자에게 보여줄 답변 방식. 그 전까지는 null(자동 진행 중)
   consult  : 상담 주제 · 고민 답변 · 정보 고치는 중 여부 (PHASE 2)
   resultEpoch : 결과 카드의 세대. 결과에 쓰인 정보를 고치면 +1 → 이전 카드는 '이전 정보 기준'

   모든 진행 액션은 대상 id를 함께 보내고, 현재 상태와 맞지 않으면 무시합니다.
   → StrictMode의 이중 effect, 늦게 도착한 타이머, 버튼 연타가 순서를 꼬지 못함
   질문(prompt) 뒤에는 사용자가 답하기 전까지 진행하지 않음. 자동 진행(auto)은 반응 대사 뒤에만.
   ────────────────────────────────────────────────────────── */

export type ChatState = {
  session: number;
  seq: number;
  node: NodeId;
  messages: Message[];
  queue: Pending[];
  typingId: string | null;
  prompt: Prompt | null;
  profile: Profile;
  consult: Consult;
  resultEpoch: number;
};

export type ChatAction =
  | { type: "typing"; id: string }
  | { type: "flush"; at: number }
  | { type: "deliver"; id: string; at: number }
  | {
      type: "answer";
      text: string;
      at: number;
      next?: NextNode;
      patch?: Partial<Profile>;
      restart?: boolean;
      record?: ChoiceOption["record"];
      edit?: boolean;
      switchTopic?: ChoiceOption["switchTopic"];
    }
  | { type: "requestTopic"; topic: ConsultTopic; at: number }
  | { type: "restart" };

export function newConsult(topic: ConsultTopic | null): Consult {
  return { topic: topic ?? "integrated", entry: topic ? "home" : "intro", answers: {}, editing: false, pendingTopic: null, resumeNode: null };
}

/** 노드의 대사를 queue 로 (아직 화면에 나오지 않음) */
function enqueue(
  state: ChatState,
  next: NextNode,
  profile: Profile,
  consult: Consult,
  epoch = state.resultEpoch,
  extraLead: string[] = [],
): Pick<ChatState, "node" | "queue" | "seq" | "prompt" | "consult"> {
  const node = resolveNext(next, profile, consult);
  let seq = state.seq;
  const say = SCRIPT[node].say;
  const lines = [...extraLead, ...(typeof say === "function" ? say(profile, consult) : say)];
  const context = { topic: consult.topic, answers: { ...consult.answers }, entry: consult.entry };
  const queue: Pending[] = lines.map((line, i) => {
    const id = `${state.session}-${++seq}`;
    const lead = i === 0;
    if (typeof line === "object") return { id, kind: "card", card: line.card, arg: line.arg, profile: { ...profile }, context, epoch, lead };
    return { id, kind: "text", text: typeof line === "function" ? line(profile, consult) : line, lead };
  });
  // 결과 단계에 들어가면 '고치는 중' 해제
  let nextConsult = node === "analyze" ? { ...consult, editing: false } : consult;
  if (node === "askCalendar") nextConsult = { ...nextConsult, greeted: true };
  return { node, queue, seq, prompt: null, consult: nextConsult };
}

/** queue 가 비었을 때: 질문이면 기다리고, 반응 대사 뒤의 auto 면 다음 노드로 이어감 */
function settle(state: ChatState): ChatState {
  if (state.queue.length) return { ...state, prompt: null };
  const then = resolveThen(state.node, state.profile, state.consult);
  if (then.type === "auto") return { ...state, ...enqueue(state, then.next, state.profile, state.consult) };
  return { ...state, prompt: then };
}

const toMessage = (p: Pending, at: number): Message =>
  p.kind === "text"
    ? { id: p.id, from: "advisor", kind: "text", text: p.text, at }
    : { id: p.id, from: "advisor", kind: "card", card: p.card, arg: p.arg, profile: p.profile, context: p.context, epoch: p.epoch, at };

/** 남은 메시지를 모두 표시 (auto 로 이어지는 묶음까지) */
function flushAll(state: ChatState, at: number): ChatState {
  let s = state;
  for (let i = 0; i < 6 && s.queue.length; i++) {
    s = settle({ ...s, messages: [...s.messages, ...s.queue.map((p) => toMessage(p, at))], queue: [], typingId: null });
  }
  return s;
}

export function initChat(session = 1, topic: ConsultTopic | null = null): ChatState {
  const consult = newConsult(topic);
  const base: ChatState = {
    session,
    seq: 0,
    node: FIRST_NODE,
    messages: [],
    queue: [],
    typingId: null,
    prompt: null,
    profile: {},
    consult,
    resultEpoch: 0,
  };
  return { ...base, ...enqueue(base, topic ? "greet" : FIRST_NODE, {}, consult) };
}

const hasCurrentResults = (s: ChatState) =>
  s.messages.some((m) => m.kind === "card" && (RESULT_CARDS as readonly string[]).includes(m.card) && (m.epoch ?? 0) === s.resultEpoch);

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "typing": {
      const head = state.queue[0];
      if (!head || head.id !== action.id || state.typingId === action.id) return state;
      return { ...state, typingId: action.id };
    }

    case "deliver": {
      const head = state.queue[0];
      if (!head || head.id !== action.id) return state; // 중복·지연 타이머 무시
      return settle({ ...state, messages: [...state.messages, toMessage(head, action.at)], queue: state.queue.slice(1), typingId: null });
    }

    case "answer": {
      if (!state.prompt) return state; // 응답 받을 때가 아니면 무시 (연타 · 중복 제출 방지)
      if (action.restart) return initChat(state.session + 1, state.consult.entry === "home" ? state.consult.topic : null);

      const id = `${state.session}-${state.seq + 1}`;
      const userMsg: Message = { id, from: "user", kind: "text", text: action.text, at: action.at };
      const profile = action.patch ? { ...state.profile, ...action.patch } : state.profile;

      // 결과에 쓰인 정보를 바꾸면 이전 결과 카드는 무효 (새 세대)
      const touchesResult = !!action.patch && RESULT_KEYS.some((k) => k in action.patch!);
      const resultEpoch = touchesResult && hasCurrentResults(state) ? state.resultEpoch + 1 : state.resultEpoch;

      let consult: Consult = state.consult;
      if (action.record) {
        const { key, value, react } = action.record;
        consult = { ...consult, answers: { ...consult.answers, [key]: { value, label: labelOf(state.prompt, value, key) ?? action.text, react } } };
        // 고민을 다시 고르면 이전 세부 답은 버림
        if (key === "concern") consult = { ...consult, answers: { concern: consult.answers.concern } };
      }
      if (action.edit) consult = { ...consult, editing: true };

      const withUser: ChatState = { ...state, seq: state.seq + 1, messages: [...state.messages, userMsg], profile, prompt: null, resultEpoch, consult };

      // 주제 전환 확인
      if (action.switchTopic === "accept" && consult.pendingTopic) {
        const switched: Consult = { ...newConsult(consult.pendingTopic), greeted: consult.greeted };
        return { ...withUser, ...enqueue(withUser, "greet", profile, switched) };
      }
      if (action.switchTopic === "keep") {
        // 원래 노드의 대사는 다시 말하지 않고 (결과 카드 재생 방지) 한마디 뒤 그 노드의 질문으로 복귀
        const back = consult.resumeNode ?? "confirm";
        const kept: Consult = { ...consult, pendingTopic: null, resumeNode: null };
        const line: Pending = { id: `${state.session}-${withUser.seq + 1}`, kind: "text", text: "좋아요. 하던 이야기를 이어서 할게요.", lead: true };
        return { ...withUser, seq: withUser.seq + 1, node: back, queue: [line], consult: kept };
      }

      if (!action.next) return withUser;
      return { ...withUser, ...enqueue(withUser, action.next, profile, consult, resultEpoch) };
    }

    case "requestTopic": {
      // 홈에서 고른 주제로 들어옴. 같은 주제면 그대로 이어서
      const c = state.consult;
      if (c.topic === action.topic || c.pendingTopic === action.topic) return state;
      const answered = state.messages.some((m) => m.from === "user");
      if (!answered) return initChat(state.session + 1, action.topic); // 아직 아무 답도 안 했으면 바로 새 주제로
      // 이미 상담 중이면 확인 후 전환 — 진행 중이던 메시지는 먼저 모두 표시
      const s = flushAll(state, action.at);
      const resumeNode = s.node === "switchTopic" ? (s.consult.resumeNode ?? null) : s.node;
      const consult: Consult = { ...s.consult, pendingTopic: action.topic, resumeNode };
      return { ...s, ...enqueue(s, "switchTopic", s.profile, consult) };
    }

    case "flush":
      // '빠르게 보기': 지금 묶음의 남은 메시지를 한 번에 표시 (질문 단계에서는 아무것도 하지 않음)
      if (!state.queue.length) return state;
      return flushAll(state, action.at);

    case "restart":
      return initChat(state.session + 1, state.consult.entry === "home" ? state.consult.topic : null);
  }
}

/** 선택지 값 → 버튼 글자 (확인 카드에 짧게 표시) */
function labelOf(prompt: Prompt | null, value: string, key: string): string | null {
  if (prompt?.type !== "choices") return null;
  return prompt.options.find((o) => o.record?.key === key && o.record.value === value)?.label ?? null;
}
