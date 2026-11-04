import type { TopicId } from "@/features/saju/topics";

/* ──────────────────────────────────────────────────────────
   운세 콘텐츠 카테고리 — 홈 · 카테고리 페이지가 읽는 데이터
   - 문구 · 입력 항목 · 무료/심층 구성은 여기서만 수정
   - 가격은 PRODUCT_OFFERS 에 따로 둠. 지금은 모두 null(미정) → 화면에 '가격 미정 · 준비 중'
   - 실제 결제 · 권한 부여는 구현하지 않음
   ────────────────────────────────────────────────────────── */

export const FORTUNE_IDS = ["integrated", "overall", "love", "reunion", "compat", "wealth", "career", "relation", "year2027"] as const;
export type FortuneId = (typeof FORTUNE_IDS)[number];

export type ArtKey = "sakura" | "lantern" | "window" | "petals";
export const ART_SRC: Record<ArtKey, string> = {
  sakura: "/images/home/art-sakura.webp",
  lantern: "/images/home/art-lantern.webp",
  window: "/images/home/art-window.webp",
  petals: "/images/home/art-petals.webp",
};

export type Emblem = "threads" | "moon" | "blossom" | "knot" | "rings" | "coin" | "path" | "circle3" | "year";

/** 상담 전에 받는 정보 (채팅에서 이미 받은 값은 같은 세션에서 다시 묻지 않는 것이 PHASE 2 목표) */
export type InputKey = "nickname" | "calendar" | "birthdate" | "birthtime" | "gender" | "mbti" | "partner" | "situation";

export const INPUT_LABEL: Record<InputKey, { label: string; note?: string }> = {
  nickname: { label: "이름 또는 닉네임", note: "건너뛸 수 있어요" },
  calendar: { label: "양력 · 음력 · 윤달" },
  birthdate: { label: "생년월일" },
  birthtime: { label: "태어난 시간", note: "몰라도 괜찮아요" },
  gender: { label: "성별", note: "대운 방향에 쓰여요" },
  mbti: { label: "MBTI 16유형", note: "몰라도 괜찮아요" },
  partner: { label: "상대방 정보 (생년월일 · MBTI)", note: "선택 · 있을 때 비교가 가능해요" },
  situation: { label: "지금 상황에 대한 짧은 질문", note: "선택지로 답해요" },
};

const BASE_INPUTS: InputKey[] = ["nickname", "calendar", "birthdate", "birthtime", "gender", "mbti"];

export type FortuneCategory = {
  id: FortuneId;
  title: string;
  /** 카드 한 줄 소개 */
  short: string;
  /** 카테고리 페이지 소개 */
  intro: string;
  emblem: Emblem;
  /**
   * 카드 그림 — 채팅 배경 원본(03-chat-background-ui-removed.png)에서 잘라 둔 네 조각 중 하나 + 문양.
   * 실제 일러스트가 생기면 public/images/home/ 의 파일만 바꾸면 됨
   */
  art: { src: ArtKey; flip?: boolean; position?: string };
  /** 이런 이야기를 나눠요 */
  explores: string[];
  /** 무료 요약에 들어가는 것 */
  free: string[];
  /** 심층 리포트(준비 중) 목차 */
  premium: string[];
  inputs: InputKey[];
  /** 주제별 추가 질문 (PHASE 2 에서 채팅 선택지로 연결) */
  followUps: { question: string; options: string[] }[];
  /** 채팅의 운세 주제와 연결 (없으면 통합 분석) */
  chatTopic: TopicId | null;
};

export const FORTUNES: Record<FortuneId, FortuneCategory> = {
  integrated: {
    id: "integrated",
    title: "사주 × MBTI 통합 분석",
    short: "타고난 결과 지금의 결을 나란히 놓고 읽어요",
    intro: "사주로 본 타고난 기질과, 직접 고른 MBTI로 본 지금의 성향. 두 관점이 어디서 닮고 어디서 엇갈리는지 운결과 함께 차근차근 살펴봐요.",
    emblem: "threads",
    art: { src: "window", position: "70% 40%" },
    explores: ["사주 원국과 오행의 분포", "타고난 나 · 지금의 나", "사주 기반 참고 MBTI와 직접 고른 MBTI 비교", "두 결을 묶은 종합 인사이트"],
    free: ["결과 카드 6종 (사주 원국 · 오행 · 타고난 나 · 지금의 나 · 두 개의 나 · 종합)", "카드별 상세 해석", "이미지 저장 · 공유"],
    premium: ["12개 챕터 종합 리포트", "대운과 세운의 흐름", "2027년 월별 흐름"],
    inputs: BASE_INPUTS,
    followUps: [{ question: "요즘 가장 많이 드는 생각은 어느 쪽에 가까워요?", options: ["나를 더 알고 싶어요", "관계가 고민이에요", "진로·일이 고민이에요"] }],
    chatTopic: null,
  },
  overall: {
    id: "overall",
    title: "종합운",
    short: "지금 나의 흐름을 한눈에",
    intro: "타고난 바탕 위에서 지금 어떤 기운이 흐르고 있는지, 무엇을 채우고 무엇을 내려놓으면 좋을지 넓게 살펴봐요.",
    emblem: "moon",
    art: { src: "petals", position: "80% 50%" },
    explores: ["타고난 기질의 큰 흐름", "많이 드러난 기운과 채워 갈 기운", "지금 시기에 도움이 되는 작은 실천"],
    free: ["종합운 샘플 풀이", "핵심 키워드 세 가지"],
    premium: ["12개 챕터 종합 리포트", "대운과 세운", "종합 분석과 조언"],
    inputs: BASE_INPUTS,
    followUps: [{ question: "요즘 가장 신경 쓰이는 영역은?", options: ["일", "관계", "건강·휴식", "돈"] }],
    chatTopic: "overall",
  },
  love: {
    id: "love",
    title: "연애 · 인연운",
    short: "나의 관계 기질과 마음의 표현",
    intro: "어떤 사람에게 끌리고, 마음을 어떻게 표현하는지. 관계 속 나의 결을 살펴보고 인연을 대하는 방식을 함께 짚어 봐요.",
    emblem: "blossom",
    art: { src: "sakura", position: "0% 60%" },
    explores: ["관계에서 드러나는 기질", "감정 표현의 방식", "시기별로 살펴볼 흐름"],
    free: ["연애·인연운 샘플 풀이", "관계에서의 작은 실천"],
    premium: ["관계 기질 심층 해석", "감정 표현 패턴", "시기별 해석"],
    inputs: [...BASE_INPUTS, "situation"],
    followUps: [{ question: "지금 연애 상태는 어떤가요?", options: ["연애 중", "썸 타는 중", "혼자예요", "말하고 싶지 않아요"] }],
    chatTopic: "love",
  },
  reunion: {
    id: "reunion",
    title: "재회운",
    short: "다시 이어질 수 있을지, 관계의 패턴부터",
    intro: "다시 만나고 싶은 마음 뒤에 어떤 관계 패턴이 있었는지 돌아봐요. 상대 정보가 있으면 두 사람의 결을 나란히 비교할 수 있어요.",
    emblem: "knot",
    art: { src: "window", flip: true, position: "70% 30%" },
    explores: ["반복되던 관계 패턴", "헤어짐을 둘러싼 흐름", "상대 정보가 있을 때 두 사람의 비교"],
    free: ["재회운 샘플 풀이", "관계를 돌아보는 질문"],
    premium: ["관계 패턴 심층 해석", "이별 시점 전후의 흐름", "상대 정보 기반 비교"],
    inputs: [...BASE_INPUTS, "partner", "situation"],
    followUps: [{ question: "헤어진 때는 언제쯤이에요? (연도와 월만)", options: ["연 · 월 입력", "기억나지 않아요", "말하고 싶지 않아요"] }, { question: "헤어진 뒤 연락은 어땠어요?", options: ["연락하지 않았어요", "가끔 안부를 주고받아요", "최근 다시 연락이 닿았어요", "연락하지 않기로 했어요"] }],
    chatTopic: "reunion",
  },
  compat: {
    id: "compat",
    title: "궁합",
    short: "두 사람의 사주와 MBTI를 나란히",
    intro: "두 사람의 사주와 MBTI를 나란히 놓고, 서로를 채워 주는 부분과 부딪히기 쉬운 부분을 살펴봐요.",
    emblem: "rings",
    art: { src: "lantern", position: "20% 80%" },
    explores: ["두 사람의 오행 비교", "MBTI 선호의 닮은 점 · 다른 점", "서로에게 필요한 배려"],
    free: ["궁합 샘플 풀이", "대화를 위한 질문"],
    premium: ["두 사람의 사주 비교", "MBTI 비교", "관계 속 역할과 배려"],
    inputs: [...BASE_INPUTS, "partner"],
    followUps: [{ question: "두 사람은 어떤 사이인가요?", options: ["연인", "썸", "친구·동료", "가족"] }],
    chatTopic: "compat",
  },
  wealth: {
    id: "wealth",
    title: "재물운",
    short: "돈을 대하는 나의 방식",
    intro: "사주에서 재물을 읽는 전통적인 방식과, 나의 소비 · 저축 성향을 함께 살펴봐요. 투자 조언이 아니라 나를 이해하는 참고예요.",
    emblem: "coin",
    art: { src: "lantern", flip: true, position: "20% 90%" },
    explores: ["재물에 대한 전통적 해석", "소비 · 저축 성향", "돈과 관련해 살펴볼 습관"],
    free: ["재물운 샘플 풀이", "돈 습관 체크 질문"],
    premium: ["재성(財星) 중심 전통 해석", "소비 성향 분석", "시기별 흐름"],
    inputs: [...BASE_INPUTS, "situation"],
    followUps: [{ question: "요즘 돈과 관련해 가장 궁금한 것은?", options: ["모으는 법", "쓰는 습관", "수입의 변화"] }],
    chatTopic: "wealth",
  },
  career: {
    id: "career",
    title: "직업 · 적성운",
    short: "나에게 맞는 일의 방식",
    intro: "어떤 환경에서 힘이 나는지, 어떤 방식으로 일할 때 편한지 살펴봐요. 전환을 고민 중이라면 탐색의 실마리를 함께 찾아요.",
    emblem: "path",
    art: { src: "petals", flip: true, position: "80% 30%" },
    explores: ["타고난 적성의 방향", "업무 스타일", "전환을 고민할 때 살펴볼 것"],
    free: ["직업·적성운 샘플 풀이", "일의 방식 체크 질문"],
    premium: ["적성 심층 해석", "업무 스타일과 협업", "전환 탐색 가이드"],
    inputs: [...BASE_INPUTS, "situation"],
    followUps: [{ question: "지금 일과 관련된 상황은?", options: ["일하는 중", "준비 중", "전환을 고민 중"] }],
    chatTopic: "career",
  },
  relation: {
    id: "relation",
    title: "인간관계",
    short: "사람 사이에서의 나",
    intro: "가까운 사람, 일로 만난 사람과의 관계에서 내가 어떤 역할을 맡는지, 어떤 순간에 갈등이 생기기 쉬운지 살펴봐요.",
    emblem: "circle3",
    art: { src: "sakura", flip: true, position: "0% 30%" },
    explores: ["대인관계 성향", "갈등이 생기기 쉬운 패턴", "관계를 편하게 만드는 거리"],
    free: ["인간관계 샘플 풀이", "관계를 돌아보는 질문"],
    premium: ["대인관계 성향 심층 해석", "갈등 패턴과 대화법", "관계별 거리 두기"],
    inputs: [...BASE_INPUTS, "situation"],
    followUps: [{ question: "요즘 마음이 쓰이는 관계는?", options: ["가족", "친구", "직장", "새로 만난 사람"] }],
    chatTopic: "relation",
  },
  year2027: {
    id: "year2027",
    title: "2027년 신년운세",
    short: "정미년(丁未年), 한 해의 흐름",
    intro: "2027년 정미년(丁未年)의 기운이 나의 타고난 결과 어떻게 만나는지, 한 해의 요약과 달마다의 흐름을 살펴봐요.",
    emblem: "year",
    art: { src: "window", position: "75% 60%" },
    explores: ["한 해의 요약", "월별 흐름", "계절마다 살펴볼 것"],
    free: ["2027년 신년운세 샘플 풀이", "한 해의 키워드"],
    premium: ["연간 요약", "월별 흐름 (1월 ~ 12월)", "계절별 실천"],
    inputs: BASE_INPUTS,
    followUps: [{ question: "새해에 가장 바라는 변화는?", options: ["일", "관계", "나 자신", "건강"] }],
    chatTopic: "year2027",
  },
};

/* ── 가격 · 판매 상태 (운영에서 관리할 데이터) ──
   priceKRW: null = 아직 정하지 않음. 화면은 '가격 미정'으로만 표시
   status: "draft" = 판매하지 않음 (구매 버튼 없음) */
export type OfferStatus = "draft" | "test" | "on-sale";
export type ProductOffer = { productId: string; fortune: FortuneId; tier: "premium"; title: string; priceKRW: number | null; status: OfferStatus };

export const PRODUCT_OFFERS: ProductOffer[] = FORTUNE_IDS.map((id) => ({
  productId: `premium-${id}`,
  fortune: id,
  tier: "premium",
  title: id === "integrated" || id === "overall" ? "종합 리포트 (12개 챕터)" : `${FORTUNES[id].title} 심층 리포트`,
  priceKRW: null,
  status: "draft",
}));

export const offerFor = (id: FortuneId) => PRODUCT_OFFERS.find((o) => o.fortune === id) ?? null;
export const isFortuneId = (v: string): v is FortuneId => (FORTUNE_IDS as readonly string[]).includes(v);
