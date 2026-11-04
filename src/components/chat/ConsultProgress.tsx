import { TOPIC_FLOWS, needsPartner } from "@/features/chat/topicFlows";
import type { Consult, NodeId } from "@/features/chat/types";

/*
  상담 진행 단계 — 헤더 아래 얇은 줄 (헤더 디자인은 그대로)
  고민 나누기 → 기본 정보 → (추가 정보) → 확인 → 결과
  추가 정보는 상대방 정보가 필요한 주제(재회 · 궁합)에서만 보임
*/

type Stage = "concern" | "info" | "extra" | "confirm" | "result";

const STAGE_LABEL: Record<Stage, string> = { concern: "고민 나누기", info: "기본 정보", extra: "추가 정보", confirm: "확인", result: "결과" };

export function stageOf(node: NodeId): Stage {
  if (node === "askName" || node === "askCalendar" || node === "askLeap" || node === "askDate" || node === "askTime" || node === "askGender" || node === "askMbti") return "info";
  if (node === "extra" || node === "partnerDate" || node === "partnerMbti") return "extra";
  if (node === "confirm" || node === "editPick") return "confirm";
  if (node === "analyze" || node === "topics" || node.startsWith("topic-")) return "result";
  return "concern";
}

export function ConsultProgress({ node, consult }: { node: NodeId; consult: Consult }) {
  const stages: Stage[] = ["concern", "info", ...(needsPartner(consult.topic) ? (["extra"] as Stage[]) : []), "confirm", "result"];
  // 주제 전환 확인 중에는 이전 단계를 그대로 보여 줌
  const shown = node === "switchTopic" && consult.resumeNode ? consult.resumeNode : node;
  const current = Math.max(0, stages.indexOf(stageOf(shown)));
  const name = consult.entry === "home" ? TOPIC_FLOWS[consult.topic].name : "사주 × MBTI";

  return (
    <div
      className="relative z-20 flex h-8 shrink-0 items-center justify-center gap-2.5 px-4 text-[11.5px] leading-none text-chat-muted"
      role="progressbar"
      aria-label={`${name} 상담 진행`}
      aria-valuemin={1}
      aria-valuemax={stages.length}
      aria-valuenow={current + 1}
      aria-valuetext={`${stages.length}단계 중 ${current + 1}단계, ${STAGE_LABEL[stages[current]]}`}
    >
      <span className="max-w-[40%] truncate font-medium text-white/90">{name}</span>
      <span aria-hidden className="flex items-center gap-1">
        {stages.map((s, i) => (
          <span
            key={s}
            className={i < current ? "h-1 w-3.5 rounded-full bg-[#e8c9ac]/80" : i === current ? "h-1 w-5 rounded-full bg-[#f6e7dc]" : "h-1 w-3.5 rounded-full bg-white/20"}
          />
        ))}
      </span>
      <span className="tabular-nums">
        {current + 1}/{stages.length} · {STAGE_LABEL[stages[current]]}
      </span>
    </div>
  );
}
