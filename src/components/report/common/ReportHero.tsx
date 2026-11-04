import { LogoMark } from "@/components/reading/Frame";

/** 리포트 표지 — 공식 로고 · 부제 · 제목 · 상태 배지 · 안내 · 상담 요약(개인정보 없음) */
export function ReportHero({
  subtitle,
  title,
  badges,
  note,
  basis,
}: {
  subtitle: string;
  title: string;
  badges: { text: string; strong?: boolean }[];
  note?: string;
  basis?: { label: string; value: string }[];
}) {
  return (
    <header className="animate-rise pt-7 text-center">
      <div className="flex justify-center">
        <LogoMark width="9.5rem" />
      </div>
      <p className="mt-2 font-serif text-[13px] tracking-[0.18em] text-[#e8c9ac]">{subtitle}</p>
      <h1 className="mt-2 font-serif text-[1.75rem] leading-[1.3] font-semibold tracking-[-0.02em] [word-break:keep-all]">{title}</h1>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[12px]">
        {badges.map((b) => (
          <span key={b.text} className={b.strong ? "rounded-full bg-[#974d5e] px-2.5 py-1 font-semibold" : "rounded-full px-2.5 py-1 shadow-[inset_0_0_0_1px_rgb(232_201_172/0.5)]"}>
            {b.text}
          </span>
        ))}
      </div>
      {note && <p className="mx-auto mt-4 max-w-[24rem] text-[14px] leading-[1.65] text-chat-muted [word-break:keep-all]">{note}</p>}
      {basis && basis.length > 0 && (
        <ul className="mx-auto mt-3 flex max-w-[24rem] flex-wrap justify-center gap-x-3 gap-y-1 text-[12.5px] text-chat-muted/90" aria-label="상담 정보 요약">
          {basis.map((b) => (
            <li key={b.label}>
              {b.label} {b.value}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
