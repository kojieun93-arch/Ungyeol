import type { Emblem } from "@/content/fortunes";

/*
  운세 카테고리 문양 — 샴페인 금빛 선 하나로 그린 단순한 상징 (새 일러스트·캐릭터 아님)
  배경 그림(채팅 배경 원본 조각) 위에 얹어 카드마다 주제를 구분
*/

const S = { stroke: "#f1d7b8", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

export function EmblemMark({ name, className }: { name: Emblem; className?: string }) {
  const p = { viewBox: "0 0 48 48", className, "aria-hidden": true as const };
  switch (name) {
    case "threads": // 두 결이 꼬이며 만나는 선
      return (
        <svg {...p}>
          <path d="M6 30c8-14 14-14 18 0s10 14 18 0" {...S} />
          <path d="M6 18c8 14 14 14 18 0s10-14 18 0" {...S} stroke="#e7a7b4" />
          <circle cx="24" cy="24" r="2.2" fill="#f1d7b8" />
        </svg>
      );
    case "moon":
      return (
        <svg {...p}>
          <path d="M30 8a16 16 0 1 0 10 26A13 13 0 1 1 30 8Z" {...S} />
          <path d="M37 12l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1 1-2.4Z" fill="#f1d7b8" />
        </svg>
      );
    case "blossom":
      return (
        <svg {...p}>
          {[0, 72, 144, 216, 288].map((a) => (
            <path key={a} d="M24 24c-4-5-4-11 0-14 4 3 4 9 0 14Z" {...S} transform={`rotate(${a} 24 24)`} />
          ))}
          <circle cx="24" cy="24" r="2.4" fill="#e7a7b4" />
        </svg>
      );
    case "knot": // 다시 이어지는 매듭
      return (
        <svg {...p}>
          <path d="M8 24h9c4 0 5-8 9-8s5 8 1 12-9 4-9 0 5-8 9-8h13" {...S} />
          <circle cx="8" cy="24" r="2" fill="#f1d7b8" />
          <circle cx="40" cy="24" r="2" fill="#e7a7b4" />
        </svg>
      );
    case "rings":
      return (
        <svg {...p}>
          <circle cx="19" cy="24" r="10" {...S} />
          <circle cx="29" cy="24" r="10" {...S} stroke="#e7a7b4" />
        </svg>
      );
    case "coin": // 엽전
      return (
        <svg {...p}>
          <circle cx="24" cy="24" r="14" {...S} />
          <circle cx="24" cy="24" r="10.5" {...S} strokeWidth={0.9} />
          <rect x="20" y="20" width="8" height="8" {...S} />
        </svg>
      );
    case "path": // 산 너머로 이어지는 길
      return (
        <svg {...p}>
          <path d="M5 36l11-14 7 8 6-7 14 13" {...S} />
          <path d="M22 42c2-5 6-7 4-12" {...S} stroke="#e7a7b4" strokeDasharray="2 3" />
          <circle cx="34" cy="12" r="3" {...S} />
        </svg>
      );
    case "circle3": // 사람 사이
      return (
        <svg {...p}>
          <circle cx="24" cy="15" r="6" {...S} />
          <circle cx="14" cy="31" r="6" {...S} stroke="#e7a7b4" />
          <circle cx="34" cy="31" r="6" {...S} />
          <path d="M19 20l-2 5M29 20l2 5M20 32h8" {...S} strokeWidth={1} />
        </svg>
      );
    case "year":
      return (
        <svg {...p}>
          <circle cx="24" cy="24" r="15" {...S} strokeWidth={1} />
          <text x="24" y="22" textAnchor="middle" fontSize="9.5" fill="#f1d7b8" fontFamily="serif">丁未</text>
          <text x="24" y="33" textAnchor="middle" fontSize="7.5" fill="#e7a7b4" fontFamily="serif" letterSpacing="0.5">2027</text>
        </svg>
      );
  }
}
