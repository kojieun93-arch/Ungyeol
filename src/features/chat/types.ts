/* ──────────────────────────────────────────────────────────
   운결 상담 채팅 — 데이터 타입
   UI와 분리된 순수 데이터. 대화 흐름은 script.ts, 진행은 reducer.ts
   ────────────────────────────────────────────────────────── */

import type { FortuneId } from "@/content/fortunes";
import type { TopicId } from "@/features/saju/topics";

export type CalendarType = "solar" | "lunar";
export type Gender = "female" | "male";

export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;
export type MbtiType = (typeof MBTI_TYPES)[number];

/** 사용자가 대화 중 입력한 정보. 메모리에만 존재하며 저장·전송하지 않는다 */
export type Profile = {
  nickname?: string | null; // null = 건너뜀
  calendar?: CalendarType;
  /** 음력일 때만 의미. null = 잘 모름 */
  leap?: boolean | null;
  birth?: { y: number; m: number; d: number };
  /** null = 출생 시간 모름 */
  time?: { h: number; m: number } | null;
  gender?: Gender;
  /** null = MBTI 모름 */
  mbti?: MbtiType | null;
  /**
   * 상대방 정보 (재회 · 궁합에서만, 모두 선택)
   * undefined = 아직 묻지 않음 / null = 건너뜀(모름)
   */
  partner?: PartnerInfo | null;
};

export type PartnerInfo = {
  calendar?: CalendarType;
  birth?: { y: number; m: number; d: number };
  /** undefined = 아직 묻지 않음 / null = 모름 */
  mbti?: MbtiType | null;
};

/* ── 상담 맥락: 주제 · 고민 답변 ── */
export type ConsultTopic = FortuneId;

/** 선택형 답변 기록 (고민 · 세부 질문). URL · 저장소에 넣지 않고 메모리에만 */
export type AnswerRecord = { value: string; label: string; react?: string };

export type Consult = {
  topic: ConsultTopic;
  /** intro: 인트로에서 바로 들어온 기본 상담(기존 흐름 그대로) / home: 홈에서 주제를 골라 들어옴 */
  entry: "intro" | "home";
  answers: Partial<Record<"concern" | "detail", AnswerRecord>>;
  /** '고칠 부분이 있어요'로 정보를 고치는 중 */
  editing: boolean;
  /** 이름으로 인사를 이미 했는지 (주제를 바꿔도 다시 '반가워요' 하지 않음) */
  greeted?: boolean;
  /** 다른 주제로 바꿀지 묻는 중이면 그 주제, 그리고 '이어서'를 고르면 돌아갈 노드 */
  pendingTopic?: ConsultTopic | null;
  resumeNode?: NodeId | null;
};

/** 결과 계산에 쓰이는 정보 — 이 값이 바뀌면 이전 결과 카드는 무효 */
export const RESULT_KEYS = ["calendar", "leap", "birth", "time", "gender", "mbti", "partner"] as const;
export const RESULT_CARDS = ["manse", "elements", "innate", "current", "compare", "insight"] as const;


export type CardKind =
  | "summary" // 입력 확인
  | "sample-result" // (이전 버전) 샘플 분석 요약 — 이어보기 호환용
  // 결과 카드 6종 (components/reading)
  | "manse" // ① 사주 원국
  | "elements" // ② 오행 분석
  | "innate" // ③ 타고난 나
  | "current" // ④ 지금의 나
  | "compare" // ⑤ 두 개의 나
  | "insight" // ⑥ 종합 인사이트
  // (이전 버전 카드 — 이어보기 호환용, 새 카드로 그림)
  | "two-selves"
  | "meeting"
  | "saju-only"
  | "topic"; // 운세 주제 샘플 풀이 (arg = TopicId)

export type CardLine = { card: CardKind; arg?: string };

/** 대본의 한 줄: 고정 문장 · 프로필/상담 맥락에 따라 바뀌는 문장 · 카드 */
export type Line = string | ((p: Profile, c: Consult) => string) | CardLine;

export type NodeId =
  | "welcome"
  | "explain"
  | "about"
  | "later"
  | "askName"
  | "askCalendar"
  | "askLeap"
  | "askDate"
  | "askTime"
  | "askGender"
  | "askMbti"
  | "confirm"
  | "analyze"
  | "topics"
  // 홈에서 주제를 골라 들어온 상담 (PHASE 2)
  | "greet" // 주제별 첫 인사 + 지금의 고민
  | "concernAgain" // 고민 다시 고르기
  | "detail" // 고민에 따라 갈라지는 후속 질문
  | "bridge" // 반응 한마디 → 기본 정보로 (질문 없음, 자동 진행)
  | "extra" // 상대방 정보 (재회 · 궁합, 선택)
  | "partnerDate"
  | "partnerMbti"
  | "editPick" // 고칠 항목 고르기
  | "switchTopic" // 다른 주제로 바꿀지 확인
  | `topic-${TopicId}`;

export type InputField = "nickname" | "birthdate" | "birthtime" | "mbti" | "partnerDate" | "partnerMbti";

/** 다음 노드: 특정 노드 또는 "@info" = 아직 받지 않은 정보 중 첫 번째 (이미 받은 정보는 다시 묻지 않음) */
export type NextNode = NodeId | "@info";

export type ChoiceOption = {
  label: string;
  /** 사용자 말풍선에 표시할 문장 (없으면 label) */
  reply?: string;
  next?: NextNode;
  patch?: Partial<Profile>;
  /** 고민 · 세부 질문의 답으로 기록 */
  record?: { key: "concern" | "detail"; value: string; react?: string };
  /** 정보 고치기 시작 */
  edit?: boolean;
  /** 주제 전환 확인 */
  switchTopic?: "accept" | "keep";
  /** 다른 화면으로 이동하는 선택지 */
  href?: string;
  /** 대화를 처음부터 다시 */
  restart?: boolean;
};

export type Prompt =
  | { type: "choices"; options: ChoiceOption[] }
  | { type: "input"; field: InputField; next: NextNode };

/** 질문이 아닌 반응 대사 뒤에만 쓰는 자동 진행. 질문 뒤에는 쓰지 않음 */
export type AutoNext = { type: "auto"; next: NextNode };

export type ScriptNode = {
  /** 프로필 · 상담 맥락에 따라 대사가 달라지면 함수로 */
  say: Line[] | ((p: Profile, c: Consult) => Line[]);
  then: Prompt | AutoNext | ((p: Profile, c: Consult) => Prompt | AutoNext);
};

/* ── 화면에 표시되는 메시지 ── */
export type AdvisorText = { id: string; from: "advisor"; kind: "text"; text: string; at: number };
export type AdvisorCard = {
  id: string;
  from: "advisor";
  kind: "card";
  card: CardKind;
  arg?: string;
  profile: Profile;
  /** 카드가 만들어질 때의 상담 맥락 (입력 확인 카드에 주제 · 고민 표시) */
  context?: Pick<Consult, "topic" | "answers" | "entry">;
  /** 결과 세대 — ChatState.resultEpoch 와 다르면 '이전 정보 기준' 결과 */
  epoch?: number;
  at: number;
};
export type UserText = { id: string; from: "user"; kind: "text"; text: string; at: number };
export type Message = AdvisorText | AdvisorCard | UserText;

/** 아직 화면에 나오지 않은 상담자 메시지 (DOM에 렌더링하지 않음) */
export type Pending =
  | { id: string; kind: "text"; text: string; lead: boolean }
  | { id: string; kind: "card"; card: CardKind; arg?: string; profile: Profile; context?: AdvisorCard["context"]; epoch?: number; lead: boolean };
