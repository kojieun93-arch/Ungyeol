import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { ArrowIcon, SampleBadge, Section } from "@/components/ui";

const ITEMS = [
  { href: "/result", no: "01", title: "샘플 결과", desc: "타고난 나와 지금의 나를 나란히 읽는 화면", sample: true },
  { href: "/result#map", no: "02", title: "운명 지도", desc: "연애 · 재물 · 직업 · 인간관계 · 신년운세", sample: true },
  { href: "/report", no: "03", title: "심층 리포트 미리보기", desc: "목차와 샘플 페이지 (준비 중)", sample: false },
];

/** 먼저 둘러보기 — 입력 없이 볼 수 있는 화면 모음 */
export default function ExplorePage() {
  return (
    <AppShell>
      <TopBar title="먼저 둘러보기" />
      <main className="flex-1">
        <Section chapter="Preview" title={<>입력하기 전에,<br />운결을 먼저 펼쳐 보세요</>} description="아래 화면은 모두 샘플 데이터로 구성되어 있습니다.">
          <ul className="border-t border-line">
            {ITEMS.map((it) => (
              <li key={it.href} className="border-b border-line">
                <Link href={it.href} className="group flex items-center gap-4 py-5">
                  <span className="type-italic w-6 shrink-0 text-champagne-300/80">{it.no}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-serif text-[1.0625rem] tracking-[-0.02em] text-fg">
                      {it.title}
                      {it.sample && <SampleBadge />}
                    </span>
                    <span className="mt-0.5 block text-[0.8125rem] text-fg-subtle">{it.desc}</span>
                  </span>
                  <ArrowIcon className="text-fg-subtle transition-transform duration-500 group-hover:translate-x-0.5 group-hover:text-champagne-300" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </main>
    </AppShell>
  );
}
