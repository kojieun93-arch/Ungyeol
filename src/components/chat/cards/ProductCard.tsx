import Link from "next/link";
import { PRODUCTS } from "@/content/products";
import { productFreeSummary } from "@/features/products/build";
import { productHref } from "@/features/products/routes";
import { isProductId } from "@/features/products/types";
import type { AdvisorCard, Profile } from "@/features/chat/types";
import { getSampleManse } from "@/features/saju/provider";
import { buildResultPayload } from "@/features/saju/reading";
import { CardLabel, ChatCard, PLUM, SampleBadge } from "./ChatCard";

/**
 * 주제별 리포트 무료 요약 → 해당 리포트 미리보기
 * 카드가 만들어질 때의 입력(profile 스냅숏)으로 그림. 정보를 고친 뒤에는 '이전 정보 기준'
 * 이름 · 생년월일 · 상대 생년월일 · 이별 날짜는 카드에 쓰지 않음
 */
export function ProductCard({ id, profile, context, stale = false }: { id: string; profile: Profile; context?: AdvisorCard["context"]; stale?: boolean }) {
  if (!isProductId(id)) return null;
  const P = PRODUCTS[id];
  const lines = productFreeSummary(id, {
    reportId: "my",
    payload: buildResultPayload(getSampleManse(profile.time !== null && profile.time !== undefined), { mbti: profile.mbti ?? null, birth: profile.birth ?? null }),
    mbti: profile.mbti ?? null,
    timeUnknown: profile.time === null,
    partner: profile.partner,
    reunion: profile.reunion,
    concern: context?.topic === id ? (context.answers.concern?.value ?? null) : null,
    now: new Date(),
  });
  return (
    <ChatCard
      label={`${P.title} 무료 요약`}
      title={`${P.title} · 무료 요약`}
      badge={<SampleBadge>{stale ? "이전 정보 기준" : "샘플 사주"}</SampleBadge>}
      className={stale ? "opacity-75" : undefined}
      footnote={
        <span className="flex items-center justify-between gap-3">
          <span>
            {P.chapters.length}개 챕터 · 공개 {P.previewAvailability.freeChapters.join(" · ")}
          </span>
          <Link href={productHref(id, "my")} className="-my-2 inline-flex min-h-11 shrink-0 items-center font-semibold text-chat-user underline decoration-chat-user/40 underline-offset-4">
            리포트 미리보기
          </Link>
        </span>
      }
    >
      {stale && <p className="mb-2 text-[13px] font-semibold text-chat-user">정보를 고치기 전의 요약이에요. 확인을 마치면 새 요약이 도착해요.</p>}
      <ul className="space-y-1.5">
        {lines.map((l) => (
          <li key={l} className="text-[14px] leading-[1.6]">
            {l}
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-[12px] bg-chat-user/[0.08] px-3 py-2.5">
        <CardLabel>알려드려요</CardLabel>
        <p className="mt-0.5 text-[13.5px] leading-[1.55]" style={{ color: PLUM }}>
          {id === "reunion" ? "상대방의 지금 마음이나 재회 여부는 이 요약으로 알 수 없어요." : P.limits.length ? `이 리포트가 알 수 없는 것 · ${P.limits.join(" · ")}` : P.safety[0]}
        </p>
      </div>
    </ChatCard>
  );
}
