import { Panel, Visual, td, th } from "@/components/report/reader/Visuals";
import type { ReportVisual } from "@/features/report/types";
import type { ProductVisual } from "@/features/products/types";
import type { ResultPayload } from "@/features/saju/types";

/* 주제별 리포트의 시각 자료 — 모두 HTML 표 · SVG. 종합 리포트와 같은 종류는 그 컴포넌트를 그대로 씀 */

const Unknown = ({ children = "미확정" }: { children?: string }) => (
  <span className="rounded-full bg-[#efe3d0] px-2 py-0.5 text-[12px] font-medium text-[#6b4f2a] shadow-[inset_0_0_0_1px_rgb(155_118_71/0.35)]">{children}</span>
);
const SampleTag = () => <span className="ml-1 align-middle text-[10.5px] font-semibold text-[#974d5e]">샘플</span>;

const OWN = new Set(["pair-table", "element-relations", "breakup-timing", "input-status", "pattern-loop", "term-calendar", "habit-table"]);

export function ProductVisualView({ v, r }: { v: ProductVisual; r: ResultPayload }) {
  if (!OWN.has(v.kind)) return <Visual v={v as ReportVisual} r={r} />;
  switch (v.kind) {
    case "pair-table":
      return (
        <Panel title={v.title} note={v.note}>
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className={`${th} w-[30%]`}>항목</th>
                <th className={th}>나</th>
                <th className={th}>상대방</th>
              </tr>
            </thead>
            <tbody>
              {v.rows.map((row) => (
                <tr key={row.label}>
                  <td className={`${td} font-semibold text-[#6e2a40]`}>{row.label}</td>
                  <td className={`${td} text-[13.5px]`}>
                    {row.me}
                    {row.meSample && <SampleTag />}
                  </td>
                  <td className={`${td} text-[13.5px]`}>{row.partner ?? <Unknown />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      );
    case "element-relations":
      return (
        <Panel title="상대 일간에 따라 달라지는 관계" note={v.note}>
          <p className="mb-2 text-center text-[13px] font-semibold" style={{ color: v.me.color }}>
            {v.me.label}
          </p>
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className={`${th} w-[24%]`}>상대</th>
                <th className={th}>관계 · 읽는 법</th>
              </tr>
            </thead>
            <tbody>
              {v.rows.map((row) => (
                <tr key={row.element}>
                  <td className={`${td} font-semibold`} style={{ color: row.color }}>
                    {row.element}
                  </td>
                  <td className={td}>
                    <span className="block text-[13px] font-semibold text-[#6e2a40]">{row.relation}</span>
                    <span className="text-[13px]">{row.text}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      );
    case "breakup-timing":
      if (v.status !== "known" || !v.year || !v.window)
        return (
          <Panel title="이별 시점" note="헤어진 연 · 월을 알려주시면 그해 · 그달의 간지가 이 자리에 들어와요.">
            <div className="flex justify-center py-2">
              <Unknown>{v.status === "private" ? "말하지 않음" : "이별 시기 미확정"}</Unknown>
            </div>
          </Panel>
        );
      return (
        <Panel title="이별 시점의 간지" note="연 · 월 간지는 달력으로 정해진 값이에요. 나와의 관계는 샘플 원국 기준이에요. 절기 날짜는 해마다 하루 안팎 달라져요.">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-white px-2 py-3 shadow-[0_0_0_1px_#e6cdbd]">
              <p className="text-[12px] text-[#7b6266]">{v.year.label} (절기 기준 해)</p>
              <p className="mt-1 font-serif text-[20px] font-semibold" style={{ color: v.year.color }}>
                {v.year.pillar}
              </p>
              <p className="text-[12px] text-[#7b6266]">{v.year.reading}</p>
              <p className="mt-1 text-[12.5px] font-semibold text-[#6e2a40]">{v.year.relation}</p>
            </div>
            <div className="rounded-xl bg-white px-2 py-3 shadow-[0_0_0_1px_#e6cdbd]">
              <p className="text-[12px] text-[#7b6266]">달력 {v.window.calendar}</p>
              <ul className="mt-1 space-y-1 text-[13px]">
                <li>
                  <span className="block text-[11.5px] text-[#7b6266]">{v.window.before.label}</span>
                  <span className="font-serif text-[15px] font-semibold text-[#4a1a2c]">{v.window.before.pillar}월</span>
                </li>
                <li>
                  <span className="block text-[11.5px] text-[#7b6266]">{v.window.after.label}</span>
                  <span className="font-serif text-[15px] font-semibold text-[#4a1a2c]">{v.window.after.pillar}월</span>
                </li>
              </ul>
            </div>
          </div>
          {v.elapsed && <p className="mt-2 text-center text-[13px] text-[#6e2a40]">헤어진 뒤 {v.elapsed}</p>}
        </Panel>
      );
    case "input-status":
      return (
        <Panel title="이 리포트에 쓰인 정보" note="이름 · 생년월일 · 상대 생년월일 · 이별 날짜는 화면에 표시하지 않아요. 모든 입력은 이 탭의 메모리에만 있어요.">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className={`${th} w-[34%]`}>정보</th>
                <th className={th}>상태</th>
                <th className={`${th} w-[26%]`}>쓰인 곳</th>
              </tr>
            </thead>
            <tbody>
              {v.rows.map((row) => (
                <tr key={row.label} data-known={row.known}>
                  <td className={`${td} font-semibold text-[#6e2a40]`}>{row.label}</td>
                  <td className={`${td} text-[13px]`}>{row.known ? row.state : <Unknown>{row.state}</Unknown>}</td>
                  <td className={`${td} text-[12.5px] tabular-nums text-[#7b6266]`}>{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      );
    case "pattern-loop":
      return (
        <Panel title="되풀이된 고리" note={v.note}>
          <ol className="relative mx-auto grid max-w-[22rem] grid-cols-2 gap-2.5" aria-label={`반복 고리: ${v.steps.join(" → ")}`}>
            {v.steps.map((st, i) => (
              <li key={st} className={`rounded-xl bg-white px-3 py-2.5 text-[13.5px] leading-[1.45] shadow-[0_0_0_1px_#e6cdbd] [word-break:keep-all] ${i === 2 ? "col-start-2 row-start-2" : i === 3 ? "col-start-1 row-start-2" : ""}`}>
                <span className="mb-0.5 block font-serif text-[12px] font-semibold text-[#9a7647]">{i + 1}</span>
                {st}
              </li>
            ))}
          </ol>
          <svg viewBox="0 0 100 20" className="mx-auto -mt-1 block h-5 w-24" aria-hidden>
            <path d="M10 6 Q50 22 90 6" fill="none" stroke="#b88a57" strokeWidth="1.4" />
            <path d="m14 2-4 4 5 2" fill="none" stroke="#b88a57" strokeWidth="1.4" />
          </svg>
          <p className="text-center text-[13px] font-semibold text-[#6e2a40]">가운데에 있던 것 · {v.center}</p>
        </Panel>
      );
    case "term-calendar":
      return (
        <Panel title={`${v.year}년 달력 월 → 절기 월`} note="‘절기 전’은 그 달 초(절기 날 전), ‘절기 후’는 그 절기부터예요. 날짜는 해마다 하루 안팎 달라져요.">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className={`${th} w-[14%]`}>달력</th>
                <th className={th}>절기</th>
                <th className={`${th} w-[23%]`}>절기 전</th>
                <th className={`${th} w-[23%]`}>절기 후</th>
              </tr>
            </thead>
            <tbody>
              {v.rows.map((row) => (
                <tr key={row.calendar}>
                  <td className={`${td} font-semibold text-[#6e2a40]`}>{row.calendar}</td>
                  <td className={`${td} text-[12.5px]`}>{row.term}</td>
                  <td className={`${td} text-[12.5px]`}>{row.before}</td>
                  <td className={`${td} text-[12.5px] font-semibold`}>{row.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      );
    case "habit-table":
      return (
        <Panel title={v.title} note={v.note}>
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className={`${th} w-[26%]`}>장면</th>
                <th className={th}>{v.columns[0]}</th>
                <th className={th}>{v.columns[1]}</th>
              </tr>
            </thead>
            <tbody>
              {v.rows.map((row) => (
                <tr key={row.label}>
                  <td className={`${td} text-[12.5px] font-semibold text-[#6e2a40]`}>{row.label}</td>
                  <td className={`${td} text-[13px]`}>{row.a}</td>
                  <td className={`${td} text-[13px]`}>{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      );
  }
  return null;
}
