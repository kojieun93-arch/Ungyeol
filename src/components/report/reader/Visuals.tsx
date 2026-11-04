import type { ReactNode } from "react";
import { C } from "@/components/reading/Frame";
import { CompareCard, ElementRadar, InsightCard, ManseTable } from "@/components/reading/cards";
import type { ReportVisual } from "@/features/report/types";
import type { ResultPayload } from "@/features/saju/types";
import { TOPICS, type TopicId } from "@/features/saju/topics";

/* 챕터 안 시각 자료 — 모두 HTML 표 · SVG (이미지 아님). 결과 카드 6종의 표 · 그래프 · 비교 카드를 그대로 재사용 */

function Panel({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <figure className="reveal rounded-[1.1rem] bg-white/60 px-3.5 py-4 shadow-[0_0_0_1px_#e6cdbd]">
      <figcaption className="mb-3 text-center font-serif text-[15px] font-semibold text-[#4a1a2c]">{title}</figcaption>
      {children}
      {note && <p className="mt-3 text-center text-[12.5px] leading-[1.55] text-[#7b6266] [word-break:keep-all]">{note}</p>}
    </figure>
  );
}

const th = "border-b border-[#e6cdbd] px-2 py-2 text-left font-serif text-[13px] font-semibold text-[#6e2a40]";
const td = "border-b border-[#e6cdbd]/70 px-2 py-2.5 align-top text-[14px] leading-[1.5] [word-break:keep-all]";

export function Visual({ v, r, onTopic }: { v: ReportVisual; r: ResultPayload; onTopic?: (id: TopicId) => void }) {
  switch (v.kind) {
    case "manse-table":
      return (
        <Panel title="사주 원국" note={r.demo ? `${r.demo.label} · 입력하신 생년월일로 계산하지 않았어요` : undefined}>
          <div style={{ fontSize: "clamp(13px, 3.7vw, 15px)" }}>
            <ManseTable r={r} />
          </div>
        </Panel>
      );
    case "ten-gods":
      return (
        <Panel title="일간과 다섯 기운의 관계" note="전통 십성의 다섯 갈래로 묶어 본 관계예요. 글자 수는 원국에 나타난 개수예요.">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className={`${th} w-[26%]`}>기운</th>
                <th className={`${th} w-[18%]`}>갈래</th>
                <th className={th}>뜻</th>
                <th className={`${th} w-[14%] text-right`}>글자</th>
              </tr>
            </thead>
            <tbody>
              {v.rows.map((row) => (
                <tr key={row.element}>
                  <td className={`${td} font-semibold`} style={{ color: row.color }}>
                    {row.element}
                  </td>
                  <td className={`${td} font-semibold`}>{row.group}</td>
                  <td className={`${td} text-[13px]`}>{row.text.split(" — ")[1] ?? row.text}</td>
                  <td className={`${td} text-right tabular-nums`}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      );
    case "element-radar":
      return (
        <Panel title="오행 분포" note={r.fiveElements.method}>
          <div className="mx-auto max-w-[19rem] px-6" style={{ fontSize: "clamp(12px, 3.4vw, 14px)" }}>
            <ElementRadar r={r} />
          </div>
        </Panel>
      );
    case "reference-rules":
      return (
        <Panel title="운결의 참고 분류 규칙표 · 시안" note={`표에 나오지 않는 유형: ${v.missing.join(" · ")}. 규칙은 확정 전이라 바뀔 수 있어요.`}>
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className={`${th} w-[26%]`}>일간</th>
                <th className={th}>전통 비유</th>
                <th className={`${th} w-[22%] text-right`}>참고 유형</th>
              </tr>
            </thead>
            <tbody>
              {v.rows.map((row) => (
                <tr key={row.stem} className={row.current ? "bg-[#f2dfe0]" : undefined} aria-current={row.current ? "true" : undefined}>
                  <td className={`${td} font-serif font-semibold`}>
                    {row.stem}
                    {row.current && <span className="ml-1 rounded-full bg-[#974d5e] px-1.5 py-0.5 align-middle text-[10.5px] font-semibold text-white">이 원국</span>}
                  </td>
                  <td className={`${td} text-[13px]`}>{row.image}</td>
                  <td className={`${td} text-right font-serif font-semibold tracking-[0.04em] text-[#4a1a2c]`}>{row.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      );
    case "compare-card":
      return (
        <div className="reveal">
          <CompareCard r={r} mode="full" />
        </div>
      );
    case "letter-compare":
      return (
        <Panel title={`${v.left.label} vs ${v.right.label}`}>
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className={`${th} w-[20%]`}>축</th>
                <th className={th}>{v.left.type}</th>
                <th className={th}>{v.right.type ?? "?"}</th>
                <th className={`${th} w-[14%] text-center`}>같음</th>
              </tr>
            </thead>
            <tbody>
              {v.rows.map((row) => (
                <tr key={row.axis}>
                  <td className={`${td} font-semibold text-[#6e2a40]`}>{row.axis}</td>
                  <td className={`${td} text-[13px]`}>{row.left}</td>
                  <td className={`${td} text-[13px]`}>{row.right ?? "—"}</td>
                  <td className={`${td} text-center font-semibold`} aria-label={row.same === null ? "비교 없음" : row.same ? "같음" : "다름"}>
                    {row.same === null ? "·" : row.same ? "○" : "×"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      );
    case "cycle-slots":
      return (
        <Panel title="나의 대운표" note="만세력 계산이 연결되면 10년 단위 대운이 이 칸에 들어와요. 지금은 값을 만들어 넣지 않았어요.">
          <ol className="grid grid-cols-4 gap-2" aria-label="대운표 — 미연결">
            {Array.from({ length: v.count }, (_, i) => (
              <li key={i} className="grid h-16 place-items-center rounded-xl text-center text-[12px] leading-tight text-[#7b6266] shadow-[inset_0_0_0_1.5px_rgb(155_123_120/0.45)] [background:repeating-linear-gradient(135deg,transparent_0_6px,rgb(230_205_189/0.35)_6px_7px)]" style={{ borderStyle: "dashed" }}>
                <span>
                  {i + 1}번째
                  <br />
                  미연결
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      );
    case "month-pillars":
      return (
        <Panel title={`2027년 ${v.year.pillar} · 월별 간지`} note="연 · 월 간지는 달력으로 정해진 값이에요. 나와의 관계 해석은 계산 연결 후에 들어와요.">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className={`${th} w-[30%]`}>절기 무렵</th>
                <th className={th}>월 간지</th>
                <th className={`${th} w-[30%]`}>천간 성향</th>
              </tr>
            </thead>
            <tbody>
              {v.months.map((mo) => (
                <tr key={mo.term}>
                  <td className={`${td} text-[13px]`}>
                    <span className="font-semibold">{mo.term}</span>
                    <span className="block text-[12px] text-[#7b6266]">{mo.approx}</span>
                  </td>
                  <td className={`${td} font-serif`}>
                    {mo.pillar}
                    <span className="block text-[12px] font-sans" style={{ color: mo.color }}>
                      {mo.element}
                    </span>
                  </td>
                  <td className={`${td} text-[13px]`}>{mo.tendency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      );
    case "insight-card":
      return (
        <div className="reveal">
          <InsightCard r={r} mode="full" onTopic={onTopic ? (id) => onTopic(id as TopicId) : undefined} />
          <p className="sr-only">운세 버튼은 해당 챕터로 이동해요: {Object.values(TOPICS).map((t) => t.label).join(", ")}</p>
        </div>
      );
  }
}
