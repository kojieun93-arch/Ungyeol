import { ChatReadingCard } from "@/components/reading/ChatReadingCard";
import type { TopicId } from "@/features/saju/topics";
import type { AdvisorCard, CardKind, Profile } from "@/features/chat/types";
import { SampleResultCard } from "./SampleResultCard";
import { SummaryCard } from "./SummaryCard";
import { TopicCard } from "./TopicCard";
import { ProductCard } from "./ProductCard";

/**
 * 카드 종류 → 컴포넌트
 * 결과 카드 6종은 components/reading 의 ChatReadingCard (채팅 요약형 + 크게 보기)
 * 사주 데이터는 지금 MockManseProvider 의 샘플. 입력한 생년월일을 쓰지 않음.
 */
export function AdvisorCardView({
  card,
  arg,
  profile,
  context,
  stale = false,
}: {
  card: CardKind;
  arg?: string;
  profile: Profile;
  context?: AdvisorCard["context"];
  /** 정보를 고치기 전의 결과 */
  stale?: boolean;
}) {
  switch (card) {
    case "summary":
      return <SummaryCard profile={profile} context={context} />;
    case "sample-result":
      return <SampleResultCard />;
    case "manse":
    case "elements":
    case "innate":
    case "current":
    case "compare":
    case "insight":
      return <ChatReadingCard kind={card} profile={profile} stale={stale} />;
    // 이전 버전 대화를 이어볼 때
    case "two-selves":
    case "meeting":
      return <ChatReadingCard kind="compare" profile={profile} />;
    case "saju-only":
      return <ChatReadingCard kind="innate" profile={profile} />;
    case "topic":
      return <TopicCard id={arg as TopicId} />;
    case "product":
      return <ProductCard id={arg ?? ""} profile={profile} context={context} stale={stale} />;
  }
}
