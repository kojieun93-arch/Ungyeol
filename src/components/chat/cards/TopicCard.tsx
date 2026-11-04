import Link from "next/link";
import { TOPICS, type TopicId } from "@/features/saju/topics";
import { CardLabel, ChatCard, PLUM, SampleBadge } from "./ChatCard";

/** 운세 주제 샘플 풀이 → 리포트 미리보기로 연결 */
export function TopicCard({ id }: { id: TopicId }) {
  const t = TOPICS[id];
  if (!t) return null;
  return (
    <ChatCard
      label={`${t.title} 샘플 풀이`}
      title={t.title}
      badge={<SampleBadge>샘플 풀이</SampleBadge>}
      footnote={
        <span className="flex items-center justify-between gap-3">
          <span>심층 리포트 · {t.reportChapter}</span>
          <Link
            href="/report"
            className="-my-2 inline-flex min-h-11 shrink-0 items-center font-semibold text-chat-user underline decoration-chat-user/40 underline-offset-4"
          >
            미리보기
          </Link>
        </span>
      }
    >
      <ul className="space-y-1.5">
        {t.lines.map((l) => (
          <li key={l} className="text-[13px] leading-[1.6]">
            {l}
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-[12px] bg-chat-user/[0.08] px-3 py-2.5">
        <CardLabel>작은 실천</CardLabel>
        <p className="mt-0.5 text-[13px] leading-[1.55]" style={{ color: PLUM }}>
          {t.practice}
        </p>
      </div>
      {t.note && <p className="mt-2.5 text-[11.5px] leading-snug text-chat-advisor-soft">{t.note}</p>}
      <p className="mt-2.5 text-[11.5px] leading-snug text-chat-advisor-soft">샘플 사주(을목 乙木 일간) 기준의 예시 풀이예요.</p>
    </ChatCard>
  );
}
