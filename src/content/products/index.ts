import type { InputRequirement, ProductId, ReportProduct } from "@/features/products/types";
import { PRODUCT_IDS } from "@/features/products/types";
import { OTHER_CHAPTERS } from "./others";
import { REUNION_CHAPTERS } from "./reunion";

/* ──────────────────────────────────────────────────────────
   7개 주제별 리포트 상품 정의 (ReportProduct)
   - 가격: 모두 미정 (amountKRW null). 화면에는 '가격 미정'만
   - 결제 · 유료 권한: 연결하지 않음 (purchase "not-connected"), 판매 전 테스트 상태 (stage "test")
   - 입력 정보: 무엇에 쓰이는지 함께 안내. 모든 입력은 이 탭의 메모리에만 있고 저장 · 전송하지 않음
   ────────────────────────────────────────────────────────── */

const I = (key: InputRequirement["key"], label: string, use: string): InputRequirement => ({ key, label, use });

const BASE_REQUIRED = [I("birth", "내 생년월일 (양력 · 음력)", "사주 원국 — 지금은 샘플 사주로 표시")];
const BASE_OPTIONAL = [I("birthtime", "태어난 시간", "시주 — 몰라도 볼 수 있어요"), I("gender", "성별", "대운 방향 (계산 연결 후)"), I("mbti", "내 MBTI", "지금의 선호 비교")];

const PRICE = { amountKRW: null, status: "undecided" as const, note: "가격은 아직 정하지 않았어요." };
const access = (free: string[]) => ({ mode: "public" as const, purchase: "not-connected" as const, stage: "test" as const, freeChapters: free });

const COMMON_SAFETY = ["샘플 사주는 입력하신 생년월일로 계산한 결과가 아니에요.", "사주 기반 MBTI는 운결의 자체 참고 분류이며 진단이 아니에요.", "미래를 확정적으로 예측하지 않아요."];

export const PRODUCTS: Record<ProductId, ReportProduct> = {
  reunion: {
    id: "reunion",
    title: "재회운 리포트",
    summary: "두 사람의 결, 되풀이된 고리, 헤어지던 때의 기운을 차분히 짚고 — 다시 시작할지, 잘 마무리할지 스스로 정할 수 있게 돕는 10챕터 리포트예요.",
    category: "relationship",
    topic: "reunion",
    requiredInputs: [...BASE_REQUIRED],
    optionalInputs: [
      ...BASE_OPTIONAL,
      I("partnerBirth", "상대방 생년월일", "두 사람 사주 비교 (계산 연결 후) · 리포트에 표시하지 않음"),
      I("partnerMbti", "상대방 MBTI", "소통 방식 비교"),
      I("breakup", "헤어진 연도 · 월", "이별 시점의 간지 (날짜는 받지 않음)"),
      I("contact", "이별 이후 연락 여부", "고려할 점 · 소통 조언"),
      I("reason", "이별 이유에 대한 내 생각", "반복 패턴 (사실 판정 아님)"),
      I("question", "가장 궁금한 질문", "종합 결론"),
    ],
    chapters: REUNION_CHAPTERS,
    sampleSections: [
      { chapterId: "01", sectionIds: ["me", "partner"] },
      { chapterId: "07", sectionIds: ["month"] },
    ],
    previewAvailability: { freeChapters: ["01", "07"], fullDemo: true, written: "complete" },
    price: PRICE,
    accessState: access(["01", "07"]),
    safety: [...COMMON_SAFETY, "상대방의 지금 마음이나 재회 여부는 알 수 없어요.", "연락을 끊기로 했다면 그 경계를 존중하도록 안내해요.", "관계의 중대한 결정을 이 리포트 하나로 내리지 마세요."],
    limits: ["상대방의 현재 감정", "재회 가능성 · 시기", "누구의 잘못인지"],
  },
  love: {
    id: "love",
    title: "연애 · 인연운 리포트",
    summary: "설렘이 시작되는 방식부터 오래 가는 관계를 만드는 힘까지, 나의 연애 결을 여섯 장으로 살펴봐요.",
    category: "relationship",
    topic: "love",
    requiredInputs: [...BASE_REQUIRED],
    optionalInputs: [...BASE_OPTIONAL, I("relationType", "지금의 연애 상황", "상담 질문 (연결 예정)")],
    chapters: OTHER_CHAPTERS.love,
    sampleSections: [{ chapterId: "01", sectionIds: ["start", "pace"] }],
    previewAvailability: { freeChapters: ["01"], fullDemo: false, written: "structure" },
    price: PRICE,
    accessState: access(["01"]),
    safety: [...COMMON_SAFETY, "누구를 언제 만날지는 알려 주지 않아요."],
    limits: ["인연을 만나는 시기", "특정 상대의 마음"],
  },
  compat: {
    id: "compat",
    title: "궁합 리포트",
    summary: "연인 · 친구 · 가족 · 동료, 두 사람의 기운과 선호가 어디서 닮고 어디서 엇갈리는지 다섯 장으로 비교해요.",
    category: "relationship",
    topic: "compat",
    requiredInputs: [...BASE_REQUIRED, I("partnerBirth", "상대방 생년월일", "두 사람 사주 비교 (계산 연결 후) · 리포트에 표시하지 않음")],
    optionalInputs: [...BASE_OPTIONAL, I("partnerMbti", "상대방 MBTI", "MBTI 차이 · 소통")],
    chapters: OTHER_CHAPTERS.compat,
    sampleSections: [{ chapterId: "02", sectionIds: ["five", "kind"] }],
    previewAvailability: { freeChapters: ["02"], fullDemo: false, written: "structure" },
    price: PRICE,
    accessState: access(["02"]),
    safety: [...COMMON_SAFETY, "궁합을 점수로 매기거나 관계를 끝낼지 정하지 않아요."],
    limits: ["궁합 점수", "관계의 지속 여부"],
  },
  wealth: {
    id: "wealth",
    title: "재물운 리포트",
    summary: "돈과 현실을 다루는 기운이 내 사주에 어떻게 놓였는지, 그리고 결정 전에 스스로 점검할 질문을 네 장으로 정리해요.",
    category: "money-work",
    topic: "wealth",
    requiredInputs: [...BASE_REQUIRED],
    optionalInputs: [...BASE_OPTIONAL, I("money", "소비 · 저축 습관에 대한 답", "상담 질문 (연결 예정)")],
    chapters: OTHER_CHAPTERS.wealth,
    sampleSections: [{ chapterId: "01", sectionIds: ["wealth", "flow"] }],
    previewAvailability: { freeChapters: ["01"], fullDemo: false, written: "structure" },
    price: PRICE,
    accessState: access(["01"]),
    safety: [...COMMON_SAFETY, "투자 · 대출 · 큰 지출 결정을 운세로 내리지 마세요. 전문가와 상의해 주세요."],
    limits: ["수익 · 손실 예측", "투자 시점"],
  },
  career: {
    id: "career",
    title: "직업 · 적성운 리포트",
    summary: "일할 때 먼저 꺼내는 힘과 편한 방식을 바탕으로 적성 · 취업 · 이직 · 사업 · 성장을 일곱 장으로 살펴봐요.",
    category: "money-work",
    topic: "career",
    requiredInputs: [...BASE_REQUIRED],
    optionalInputs: [...BASE_OPTIONAL, I("workStage", "지금의 일 상황 (준비 · 재직 · 이직 고민 · 사업)", "상담 질문 (연결 예정)")],
    chapters: OTHER_CHAPTERS.career,
    sampleSections: [{ chapterId: "01", sectionIds: ["force", "rhythm"] }],
    previewAvailability: { freeChapters: ["01"], fullDemo: false, written: "structure" },
    price: PRICE,
    accessState: access(["01"]),
    safety: [...COMMON_SAFETY, "취업 · 이직 · 창업 결정을 운세 하나로 내리지 마세요."],
    limits: ["합격 여부", "특정 직업 추천"],
  },
  relation: {
    id: "relation",
    title: "인간관계운 리포트",
    summary: "가족 · 친구 · 직장에서의 나, 말하고 듣는 방식, 갈등 앞의 반응과 나를 지키는 경계를 여섯 장으로 정리해요.",
    category: "relationship",
    topic: "relation",
    requiredInputs: [...BASE_REQUIRED],
    optionalInputs: [...BASE_OPTIONAL, I("relationScope", "가장 고민되는 관계 (가족 · 친구 · 직장)", "상담 질문 (연결 예정)")],
    chapters: OTHER_CHAPTERS.relation,
    sampleSections: [{ chapterId: "04", sectionIds: ["speak", "places"] }],
    previewAvailability: { freeChapters: ["04"], fullDemo: false, written: "structure" },
    price: PRICE,
    accessState: access(["04"]),
    safety: [...COMMON_SAFETY, "괴롭힘이나 위협이 있는 관계라면 운세보다 주변의 도움과 전문 기관을 먼저 찾아 주세요."],
    limits: ["상대의 속마음", "관계를 끊을지 여부"],
  },
  year2027: {
    id: "year2027",
    title: "2027 신년운세 리포트",
    summary: "정미년 한 해의 흐름, 대운 · 세운, 절기 기준 열두 달, 연애 · 재물 · 직업을 여섯 장으로 살펴봐요.",
    category: "yearly",
    topic: "year2027",
    requiredInputs: [...BASE_REQUIRED],
    optionalInputs: [...BASE_OPTIONAL],
    chapters: OTHER_CHAPTERS.year2027,
    sampleSections: [{ chapterId: "03", sectionIds: ["term", "season"] }],
    previewAvailability: { freeChapters: ["03"], fullDemo: false, written: "structure" },
    price: PRICE,
    accessState: access(["03"]),
    safety: [...COMMON_SAFETY, "절기 날짜는 해마다 하루 안팎 달라져 ‘무렵’으로 표시해요."],
    limits: ["좋은 달 · 나쁜 달 판정 (계산 연결 전)", "사건 예측"],
  },
};

export const PRODUCT_LIST: ReportProduct[] = PRODUCT_IDS.map((id) => PRODUCTS[id]);
