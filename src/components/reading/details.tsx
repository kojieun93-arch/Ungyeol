import type { ReactNode } from "react";
import { ELEMENTS, ELEMENT_ORDER, elementLabel } from "@/features/saju/elements";
import { isDemo, type ElementKey, type MbtiLetter, type ReadingResult } from "@/features/saju/types";
import { RELATION_STYLE } from "@/features/saju/mbti";
import { relationTo } from "@/features/saju/relations";
import type { ReadingKind } from "./cards";

/* ──────────────────────────────────────────────────────────
   전체 화면 카드 아래 '상세 해석' — 카드별 심층 정보
   모두 ReadingResult 에서 계산 (샘플이면 맨 위에 샘플 안내)
   ────────────────────────────────────────────────────────── */

const PILLAR_MEANING: Record<string, { image: string; text: string }> = {
  year: { image: "뿌리", text: "집안의 배경과 어린 시절의 환경으로 읽어요." },
  month: { image: "줄기", text: "자라 온 환경과 사회 속 모습, 일하는 방식으로 읽어요. 태어난 계절도 여기에 담겨요." },
  day: { image: "꽃", text: "나 자신(일간)과 가장 가까운 관계의 자리로 읽어요." },
  hour: { image: "열매", text: "앞으로의 방향과 아랫사람과의 관계, 삶의 후반부로 읽어요." },
};


function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="flex items-center gap-2 font-serif text-[1.02em] font-semibold text-[#4a1a2c]">
        <span aria-hidden className="size-[0.4em] rotate-45 bg-[#b88a57]" />
        {title}
      </h3>
      <div className="mt-2 text-[0.94em] leading-[1.7] text-[#3a2229] [word-break:keep-all]">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2">
          <span aria-hidden className="mt-[0.7em] size-1 shrink-0 rounded-full bg-[#974d5e]" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Row({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <li className="flex gap-3 border-b border-[#e6cdbd]/70 py-2.5 last:border-b-0">
      <span className="w-[5.2em] shrink-0 font-serif font-semibold text-[#6e2a40]">{head}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

export function SampleBanner({ r }: { r: ReadingResult }) {
  if (!isDemo(r)) return null;
  return (
    <p role="note" className="mb-4 rounded-xl bg-[#974d5e]/10 px-3.5 py-2.5 text-[0.86em] leading-[1.6] text-[#6e2a40] shadow-[inset_0_0_0_1px_rgb(151_77_94/0.25)]">
      <strong className="font-semibold">데모 결과</strong> — 실제 만세력 계산이 아직 연결되지 않아, {r.demo?.label ?? "정해진 샘플 사주"}로 만든 풀이예요. 입력하신 생년월일로 계산한 결과가 아니에요.
      {r.demo && <span className="mt-1 block text-[0.94em] text-[#7b6266]">{r.demo.description}</span>}
      {r.mixesUserMbti && <span className="mt-1 block">MBTI는 직접 고르신 값을 그대로 썼어요. 사주 샘플과 함께 섞인 데모 결과예요.</span>}
    </p>
  );
}

export function ReadingDetails({ kind, r, onTopic }: { kind: ReadingKind; r: ReadingResult; onTopic?: (id: ReadingResult["integratedInsight"]["topics"][number]["id"]) => void }) {
  const dmEl = r.sajuPersonality.dayMaster.element;
  switch (kind) {
    case "manse":
      return (
        <>
          <Section title="각 기둥이 뜻하는 것">
            <ul>
              {[...r.manseResult.pillars].reverse().map((p) => (
                <Row key={p.key} head={<>{p.label}<span className="block text-[0.78em] font-medium text-[#7b6266]">{PILLAR_MEANING[p.key].image}</span></>}>
                  <span className="font-serif text-[1.05em]">{p.stem && p.branch ? `${p.stem.hanja}${p.branch.hanja} (${p.stem.hangul}${p.branch.hangul})` : "미확정"}</span>
                  <span className="block">{PILLAR_MEANING[p.key].text}</span>
                </Row>
              ))}
            </ul>
          </Section>
          <Section title="일간과 오행의 관계">
            <p>
              사주에서는 일간을 ‘나’로 두고, 다른 글자들이 나와 어떤 관계인지 읽어요. 이 원국의 일간 · <strong className="font-semibold">{r.sajuPersonality.title}</strong>
            </p>
            <ul className="mt-2">
              {ELEMENT_ORDER.map((k) => {
                const rel = relationTo(dmEl, k);
                const count = r.fiveElements.counts.find((c) => c.key === k)?.count ?? 0;
                return (
                  <Row key={k} head={<span style={{ color: ELEMENTS[k].color }}>{elementLabel(k)}</span>}>
                    <strong className="font-semibold">{rel.name}</strong> · {rel.text}
                    <span className="block text-[0.88em] text-[#7b6266]">원국에 {count}글자{k === dmEl ? " (일간 포함)" : ""}</span>
                  </Row>
                );
              })}
            </ul>
          </Section>
          <Section title={r.manseResult.hourKnown ? "태어난 시간에 대해" : "출생 시간 미상에 따른 해석 제한"}>
            {r.manseResult.hourKnown ? (
              <p>시주는 두 시간 단위로 바뀌어요. 경계 시각 가까이 태어났다면 시주가 달라질 수 있으니, 정확한 시간을 다시 확인해 보면 좋아요.</p>
            ) : (
              <Bullets
                items={[
                  "시주 두 글자를 알 수 없어, 8글자 중 6글자로만 풀이했어요.",
                  "오행 분포에서 시주의 기운이 빠져 있어 실제 분포와 다를 수 있어요.",
                  "자녀·후배와의 관계, 삶의 후반부처럼 시주로 읽는 부분은 풀이에서 뺐어요.",
                ]}
              />
            )}
          </Section>
        </>
      );
    case "elements":
      return (
        <>
          <Section title="각 기운의 의미">
            <ul>
              {ELEMENT_ORDER.map((k) => {
                const pct = r.fiveElements.ratios.find((x) => x.key === k)?.percent ?? 0;
                const count = r.fiveElements.counts.find((x) => x.key === k)?.count ?? 0;
                return (
                  <Row key={k} head={<span style={{ color: ELEMENTS[k].color }}>{elementLabel(k)}</span>}>
                    {ELEMENTS[k].tendency}
                    <span className="mt-1 flex items-center gap-2 text-[0.88em] text-[#7b6266]">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e6cdbd]/60" aria-hidden>
                        <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: ELEMENTS[k].color }} />
                      </span>
                      <span className="tabular-nums">
                        {count}글자 · {pct}%
                      </span>
                    </span>
                  </Row>
                );
              })}
            </ul>
          </Section>
          <Section title="분포의 특징">
            <p>
              {r.fiveElements.strongest.map(elementLabel).join("·")} 기운이 가장 많고, {r.fiveElements.weakest.map(elementLabel).join("·")} 기운이 상대적으로 적어요.{" "}
              {r.fiveElements.counts.some((c) => c.count === 0)
                ? "비어 있는 기운은 부족하다는 뜻이라기보다, 그 기운을 다른 데서 채워 가는 구성으로 읽어요."
                : "다섯 기운이 모두 있어 어느 하나가 완전히 비어 있지는 않은 구성이에요."}
            </p>
          </Section>
          <Section title="참고할 점">
            <Bullets items={[r.fiveElements.method, ...r.fiveElements.limits, "오행이 많고 적음은 좋고 나쁨이 아니라, 기질의 방향을 읽는 참고예요."]} />
          </Section>
        </>
      );
    case "innate":
      return (
        <>
          <Section title="사주 기질 설명">
            <p>
              일간 <strong className="font-semibold">{r.sajuPersonality.title}</strong> — 전통적으로 ‘{r.sajuPersonality.image}’에 비유해요. {r.sajuPersonality.core}
            </p>
            <p className="mt-2">핵심 키워드 · {r.sajuPersonality.keywords.join(" · ")}</p>
          </Section>
          <Section title="강점">
            <Bullets items={r.sajuPersonality.strengths} />
          </Section>
          <Section title="보완점">
            <Bullets items={r.sajuPersonality.cautions} />
          </Section>
          <Section title="사주 기반 참고 MBTI에 대해">
            <p>
              {r.sajuMBTIReference.type} — {r.sajuMBTIReference.reason}이에요.
            </p>
            <p className="mt-2">분류 근거</p>
            <Bullets items={r.sajuMBTIReference.basis} />
            <p className="mt-2 text-[0.92em] text-[#7b6266]">
              {r.sajuMBTIReference.note}
              {r.sajuMBTIReference.ruleStatus === "draft" ? " 분류 규칙은 아직 확정 전인 시안이라, 계산된 유형이 아니에요." : ""}
            </p>
          </Section>
        </>
      );
    case "current": {
      const c = r.selfReportedMBTI;
      if (!c.type)
        return (
          <>
            <Section title="MBTI를 고르지 않았어요">
              <p>MBTI는 스스로 고르는 선호 유형이에요. 아래 네 가지 질문에서 지금의 나에게 가까운 쪽을 고르면, 대략적인 방향을 떠올려 볼 수 있어요.</p>
            </Section>
            <Section title="스스로 살펴보는 질문">
              <Bullets
                items={[
                  "에너지 — 사람을 만나고 나면 충전되나요, 혼자 있어야 회복되나요?",
                  "인식 — 눈앞의 사실을 먼저 보나요, 앞으로의 가능성을 먼저 보나요?",
                  "판단 — 결정할 때 논리가 먼저인가요, 사람의 마음이 먼저인가요?",
                  "생활 방식 — 계획이 있어야 편한가요, 열어 두는 쪽이 편한가요?",
                ]}
              />
            </Section>
            <Section title="참고">
              <p>정식 검사는 공인된 기관의 MBTI® 검사로 받을 수 있어요. 운결은 검사를 제공하지 않아요.</p>
            </Section>
          </>
        );
      const letters = c.type.split("") as MbtiLetter[];
      const rel = RELATION_STYLE[`${letters[0]}${letters[2]}`];
      return (
        <>
          <Section title="성향 설명">
            <p>
              {c.type} · {c.summary}
            </p>
          </Section>
          <Section title="네 가지 선호">
            <ul>
              {c.axes.map((a) => (
                <Row key={a.axis} head={<>{a.title}<span className="ml-1 font-sans text-[0.9em] text-[#974d5e]">{a.letter}</span></>}>
                  {a.text}
                </Row>
              ))}
            </ul>
          </Section>
          <Section title="판단과 대인관계">
            <p>{c.axes.find((a) => a.axis === "judgement")?.text}</p>
            {rel && <p className="mt-2">{rel}</p>}
          </Section>
          <Section title="강점과 보완점">
            <Bullets items={[...c.strengths, ...c.growth]} />
          </Section>
        </>
      );
    }
    case "compare": {
      const c = r.comparison;
      return (
        <>
          {c.relation === "unknown" ? (
            <Section title="지금은 비교할 MBTI가 없어요">
              <p>{c.insight}</p>
            </Section>
          ) : (
            <>
              <Section title={c.relation === "same" ? "같은 유형이에요" : `${c.reference}와 ${c.selected}`}>
                <p>
                  네 글자 중 {c.sameLetters.length}글자가 같아요{c.sameLetters.length ? ` (${c.sameLetters.join(", ")})` : ""}. {c.insight}
                </p>
              </Section>
              <Section title="공통점">
                <Bullets items={c.common} />
              </Section>
              <Section title="차이점">
                <Bullets items={c.differences} />
              </Section>
            </>
          )}
          <Section title="자기탐색 질문">
            <Bullets items={c.questions} />
          </Section>
        </>
      );
    }
    case "insight": {
      const s = r.integratedInsight;
      return (
        <>
          <Section title="주요 키워드">
            <p>{s.keywords.map((k) => k.word).join(" · ")}</p>
          </Section>
          <Section title="종합 성향 요약">
            <p>{s.summary}</p>
          </Section>
          <Section title="자기탐색 조언">
            <p>{s.advice}</p>
          </Section>
          {onTopic && (
            <Section title="관련 운세 바로가기">
              <div className="flex flex-wrap gap-2">
                {s.topics.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onTopic(t.id)}
                    className="inline-flex min-h-11 items-center rounded-full bg-[#974d5e] px-4 text-[0.95em] font-medium text-white shadow-[inset_0_0_0_1px_#c96f81] active:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6e2a40]"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Section>
          )}
        </>
      );
    }
  }
}
