import { formatBirth, formatBirthTime, formatGender, formatMbti } from "@/features/chat/format";
import { TOPIC_FLOWS } from "@/features/chat/topicFlows";
import type { AdvisorCard, Profile } from "@/features/chat/types";

function formatPartner(p: Profile["partner"]) {
  if (p === null) return "입력 안 함";
  if (!p) return "";
  const parts = [
    p.birth ? `${p.calendar === "lunar" ? "음력" : "양력"} ${p.birth.y}.${p.birth.m}.${p.birth.d}` : null,
    p.mbti ? p.mbti : p.mbti === null ? "MBTI 모름" : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "입력 안 함";
}

/** 입력 확인 카드 — 홈에서 고른 상담이면 주제 · 고민 · 상대방 정보도 함께 */
export function SummaryCard({ profile, context }: { profile: Profile; context?: AdvisorCard["context"] }) {
  const home = context?.entry === "home";
  const concern = [context?.answers.concern?.label, context?.answers.detail?.label].filter(Boolean).join(" · ");
  const rows: [string, string][] = [
    ...(home && context ? ([["상담 주제", TOPIC_FLOWS[context.topic].name]] as [string, string][]) : []),
    ...(home && concern ? ([["고민", concern]] as [string, string][]) : []),
    ["이름", profile.nickname ?? "입력 안 함"],
    ["생년월일", formatBirth(profile)],
    ["태어난 시간", formatBirthTime(profile.time)],
    ["성별", formatGender(profile.gender)],
    ["MBTI", formatMbti(profile.mbti)],
    ...(profile.partner !== undefined ? ([["상대방", formatPartner(profile.partner)]] as [string, string][]) : []),
  ];
  return (
    <div className="bg-chat-advisor px-4 py-3.5 text-chat-advisor-ink" style={{ borderRadius: "1.26em", fontSize: "clamp(14px, 3.85vw, 15px)" }}>
      <p className="text-[0.75rem] font-semibold tracking-[0.02em] text-chat-advisor-soft">입력 정보 확인</p>
      <dl className="mt-2.5 divide-y divide-chat-advisor-ink/10">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2 text-[0.875rem]">
            <dt className="shrink-0 text-chat-advisor-soft">{k}</dt>
            <dd className="text-right font-medium [word-break:keep-all]">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
