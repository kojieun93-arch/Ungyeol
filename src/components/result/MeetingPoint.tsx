import { Ornament } from "@/components/ui";
import type { ResultData } from "@/types/result";

/** 두 결이 만나는 자리 — 닮은 점 / 부딪히는 점 / 한 문장 */
export function MeetingPoint({ meeting }: { meeting: ResultData["meeting"] }) {
  return (
    <div>
      <p className="type-subtitle text-fg">{meeting.title}</p>

      <dl className="mt-6 space-y-6">
        <div>
          <dt className="flex items-center gap-2 text-[0.75rem] font-medium tracking-[0.02em] text-champagne-200">
            <span aria-hidden className="size-1.5 rounded-full bg-champagne-300" />
            서로 닮은 결
          </dt>
          {meeting.resonance.map((t) => (
            <dd key={t} className="type-small mt-2 border-l border-champagne-300/25 pl-3.5 text-fg-muted">
              {t}
            </dd>
          ))}
        </div>
        <div>
          <dt className="flex items-center gap-2 text-[0.75rem] font-medium tracking-[0.02em] text-lavender-200">
            <span aria-hidden className="size-1.5 rounded-full bg-lavender-300" />
            서로 엇갈리는 결
          </dt>
          {meeting.tension.map((t) => (
            <dd key={t} className="type-small mt-2 border-l border-lavender-300/25 pl-3.5 text-fg-muted">
              {t}
            </dd>
          ))}
        </div>
      </dl>

      <figure className="mt-10 text-center">
        <Ornament />
        <blockquote className="mx-auto mt-5 max-w-[17rem] font-serif text-[1.1875rem] leading-[1.6] tracking-[-0.02em] text-fg">
          {meeting.sentence}
        </blockquote>
      </figure>
    </div>
  );
}
