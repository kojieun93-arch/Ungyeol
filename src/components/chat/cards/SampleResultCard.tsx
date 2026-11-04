import Link from "next/link";
import { SAMPLE_RESULT } from "@/content/sample-result";

/**
 * 샘플 분석 카드
 * 실제 만세력 계산이 연결되기 전까지, 입력 정보와 무관한 '샘플'임을 카드 안에서도 분명히 표시
 */
export function SampleResultCard() {
  const r = SAMPLE_RESULT;
  return (
    <article aria-label="샘플 분석 카드" className="overflow-hidden rounded-[1.125rem] bg-chat-advisor text-chat-advisor-ink">
      <header className="flex items-center justify-between gap-3 border-b border-chat-advisor-ink/10 px-4 py-3">
        <p className="font-serif text-[1rem] font-semibold tracking-[-0.02em]">두 가지 결</p>
        <span className="rounded-full bg-chat-user px-2 py-0.5 text-[0.6875rem] font-semibold text-chat-user-ink">샘플 결과</span>
      </header>

      <p className="bg-chat-advisor-ink/[0.04] px-4 py-2 text-[0.75rem] leading-[1.5] text-chat-advisor-soft">
        입력하신 정보로 계산한 결과가 아니에요. 화면 구성을 보여드리기 위한 예시예요.
      </p>

      <div className="grid grid-cols-2 gap-px bg-chat-advisor-ink/10">
        {[
          { label: "타고난 나", sub: "사주", name: r.innate.name, kw: r.innate.keywords },
          { label: "지금의 나", sub: "MBTI", name: r.present.name, kw: r.present.keywords },
        ].map((s) => (
          <div key={s.label} className="bg-chat-advisor px-4 py-3">
            <p className="text-[0.6875rem] text-chat-advisor-soft">
              {s.label} · {s.sub}
            </p>
            <p className="mt-1 font-serif text-[1.125rem] font-semibold tracking-[-0.02em]">{s.name}</p>
            <p className="mt-1 text-[0.75rem] leading-[1.5] text-chat-advisor-soft">{s.kw.join(" · ")}</p>
          </div>
        ))}
      </div>

      <dl className="space-y-2.5 border-t border-chat-advisor-ink/10 px-4 py-3 text-[0.8125rem] leading-[1.55]">
        <div>
          <dt className="text-[0.6875rem] font-semibold text-[#8a5a3c]">닮은 점</dt>
          <dd className="mt-0.5">{r.meeting.resonance[0]}</dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] font-semibold text-chat-user">다른 점</dt>
          <dd className="mt-0.5">{r.meeting.tension[0]}</dd>
        </div>
      </dl>

      <nav aria-label="운세 갈래 (샘플)" className="border-t border-chat-advisor-ink/10 px-3 py-3">
        <ul className="grid grid-cols-3 gap-1.5">
          {r.chapters.map((c) => (
            <li key={c.id} className={c.id === "year" ? "col-span-2" : undefined}>
              <Link
                href="/result#map"
                className="flex min-h-11 items-center justify-center rounded-xl border border-chat-advisor-ink/12 px-2 text-center text-[0.8125rem] font-medium transition-colors duration-200 hover:bg-chat-advisor-ink/[0.05] active:bg-chat-advisor-ink/[0.08]"
              >
                {c.id === "year" ? "2027 신년운세" : c.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
