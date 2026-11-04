import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/reading/Frame";
import { cn } from "@/lib/cn";

/* 홈 · 카테고리 페이지 공통 조각 — 채팅과 같은 플럼 · 크림 · 버건디 · 샴페인 팔레트 */

export const ADVISOR_IMAGE = "/images/ungyeol-advisor.webp";

/** 화면 위 고정 바: ‹ · 공식 로고(또는 제목) · 오른쪽 슬롯 */
export function HomeBar({ backHref, backLabel, title, right }: { backHref: string; backLabel: string; title?: string; right?: ReactNode }) {
  return (
    <div className="sticky top-0 z-30 bg-[#2e1c24]/92 backdrop-blur-[6px]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="grid h-14 grid-cols-[44px_1fr_44px] items-center gap-2 px-2 shadow-[0_1px_0_rgb(231_195_187/0.14)]">
        <Link href={backHref} aria-label={backLabel} className="grid size-11 place-items-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-chat-accent">
          <svg viewBox="0 0 15 29" fill="none" aria-hidden className="h-[18px] w-[10px]">
            <path d="M13 2 2.5 14.5 13 27" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="flex justify-center">
          {title ? <h1 className="truncate font-serif text-[1rem] font-semibold text-white">{title}</h1> : <LogoMark width="6.4rem" />}
        </div>
        <div className="flex justify-end">{right}</div>
      </div>
    </div>
  );
}

/** 대화 아이콘 버튼 → /chat */
export function ChatShortcut() {
  return (
    <Link href="/chat" aria-label="운결과 대화하기" className="grid size-11 place-items-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-chat-accent">
      <span className="grid size-9 place-items-center rounded-full bg-chat-chip shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)]">
        <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" aria-hidden>
          <path d="M10 3.5c3.9 0 7 2.5 7 5.7s-3.1 5.7-7 5.7c-.8 0-1.5-.1-2.2-.3L4.5 16l.8-2.8C3.9 12.2 3 10.8 3 9.2 3 6 6.1 3.5 10 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}

/** 상담자 인사 — 확정된 원형 프로필 + 채팅과 같은 크림 말풍선 */
export function AdvisorGreeting({ lines }: { lines: string[] }) {
  return (
    <div className="flex gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- 확정된 상담자 프로필 이미지 */}
      <img src={ADVISOR_IMAGE} alt="운결 상담자 프로필" width={52} height={52} className="size-[52px] shrink-0 rounded-full object-cover shadow-[0_0_0_1.5px_#c9838f]" />
      <div className="min-w-0 flex-1">
        <p className="mb-1.5 text-[12px] font-medium text-chat-text">운결</p>
        <div className="flex flex-col items-start gap-1.5">
          {lines.map((t, i) => (
            <p
              key={t}
              className={cn("relative max-w-full rounded-[1.26em] bg-chat-advisor px-[1.05em] py-[0.6em] text-[clamp(14px,3.85vw,15px)] leading-[1.5] font-[470] tracking-[-0.01em] text-chat-advisor-ink [word-break:keep-all]", i === 0 && "rounded-tl-[0.4em]")}
              style={{ boxShadow: "inset 0 1px 0 var(--color-chat-advisor-rim), 0 0 0 0.5px rgb(30 12 20 / 0.35)" }}
            >
              {t}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SectionHead({ eyebrow, title, desc, id }: { eyebrow?: string; title: string; desc?: string; id?: string }) {
  return (
    <div className="mb-4">
      {eyebrow && <p className="mb-1 font-serif text-[12px] tracking-[0.14em] text-[#e8c9ac]/85">{eyebrow}</p>}
      <h2 id={id} className="font-serif text-[1.25rem] leading-snug font-semibold tracking-[-0.02em] text-white">
        {title}
      </h2>
      {desc && <p className="mt-1 text-[13px] leading-[1.55] text-chat-muted/90">{desc}</p>}
    </div>
  );
}

/** 알약 표시 (샘플 · 준비 중 · 무료 …) */
export function Tag({ children, tone = "plum" }: { children: ReactNode; tone?: "plum" | "cream" | "line" }) {
  const t = {
    plum: "bg-[#974d5e] text-white shadow-[inset_0_0_0_1px_#c96f81]",
    cream: "bg-[#f6e7dc] text-[#4a1a2c]",
    line: "text-[#e8c9ac] shadow-[inset_0_0_0_1px_rgb(232_201_172/0.5)]",
  }[tone];
  return <span className={cn("inline-flex h-[22px] shrink-0 items-center rounded-full px-2.5 text-[11px] leading-none font-semibold", t)}>{children}</span>;
}

/** 상담 진행 순서 (홈 · 카테고리 공통) */
export const FLOW_STEPS = [
  { title: "주제 고르기", text: "궁금한 운세를 골라요." },
  { title: "정보 알려주기", text: "운결이 묻는 대로 생년월일과 MBTI를 답해요. 모르는 건 건너뛰어도 괜찮아요." },
  { title: "운결과 대화", text: "결과 카드가 하나씩 도착해요. 누르면 크게 펼쳐 읽을 수 있어요." },
  { title: "리포트로 이어 읽기", text: "더 깊은 풀이는 챕터별 리포트로 준비하고 있어요." },
];

export function StepFlow() {
  return (
    <ol className="relative flex flex-col gap-3">
      {FLOW_STEPS.map((s, i) => (
        <li key={s.title} className="relative flex gap-3">
          <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-[#f6e7dc] font-serif text-[13px] font-semibold text-[#4a1a2c]">{i + 1}</span>
          {i < FLOW_STEPS.length - 1 && <span aria-hidden className="absolute top-8 left-4 h-[calc(100%-1.25rem)] w-px -translate-x-1/2 bg-[#e8c9ac]/35" />}
          <span className="min-w-0 pt-1">
            <span className="block font-serif text-[15px] font-semibold text-white">{s.title}</span>
            <span className="mt-0.5 block text-[13px] leading-[1.55] text-chat-muted/90 [word-break:keep-all]">{s.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** 샘플 · 정보 처리 안내 — 출생정보와 상담 내용의 수집 · 저장 · 삭제를 구분해서 */
export function PolicyNotice() {
  const rows = [
    { item: "출생 정보", sub: "생년월일 · 시간 · 성별", collect: "상담 중 직접 입력", keep: "이 탭의 메모리에만 (서버 전송 · 기기 저장 없음)", del: "새로고침 · ‘처음부터 다시’ · 30분 경과 시" },
    { item: "MBTI · 이름", sub: "닉네임은 선택", collect: "상담 중 직접 선택", keep: "출생 정보와 같음", del: "출생 정보와 같음" },
    { item: "상담 내용", sub: "대화 · 고른 주제", collect: "대화하면서 생김", keep: "이 탭의 메모리에만", del: "출생 정보와 같음" },
    { item: "공유 이미지", sub: "직접 저장할 때만", collect: "버튼을 눌렀을 때 만듦", keep: "내 기기의 사진 · 파일 (운결 서버 없음)", del: "기기에서 직접 삭제" },
  ];
  return (
    <section aria-labelledby="policy-title" className="rounded-[1.25rem] bg-[#fbf2e8] px-4 py-5 text-[#3a2229] shadow-[0_0_0_1.5px_#d3ab7c]">
      <h2 id="policy-title" className="font-serif text-[1.05rem] font-semibold text-[#4a1a2c]">
        샘플 결과와 정보 처리 안내
      </h2>
      <p className="mt-2 text-[13px] leading-[1.6] [word-break:keep-all]">
        아직 실제 만세력 계산이 연결되지 않아, 모든 사주 결과는 <strong className="font-semibold">정해진 샘플</strong>로 보여드려요. 입력하신 생년월일로 계산한 결과가 아니에요. 운결은 후기나 정확도 통계를 내세우지 않아요.
      </p>
      <dl className="mt-3 flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.item} className="rounded-xl bg-white/60 px-3 py-2.5 text-[12.5px] leading-[1.5] shadow-[0_0_0_1px_#e6cdbd]">
            <dt className="font-serif text-[14px] font-semibold text-[#6e2a40]">
              {r.item} <span className="font-sans text-[11.5px] font-normal text-[#7b6266]">{r.sub}</span>
            </dt>
            <dd className="mt-1 grid grid-cols-[3.2em_1fr] gap-x-2 gap-y-0.5 [word-break:keep-all]">
              <span className="text-[#7b6266]">수집</span>
              <span>{r.collect}</span>
              <span className="text-[#7b6266]">보관</span>
              <span>{r.keep}</span>
              <span className="text-[#7b6266]">삭제</span>
              <span>{r.del}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[12px] leading-[1.55] text-[#7b6266] [word-break:keep-all]">
        만세력 계산(HRUM) · 유료 리포트가 연결되면 그때 필요한 저장 범위와 보관 기간을 따로 알려드리고 동의를 받은 뒤에 적용해요.
      </p>
    </section>
  );
}
