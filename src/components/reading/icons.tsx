import type { CSSProperties } from "react";

/*
  결과 카드 아이콘 — 원본 시안의 아이콘 자리(나무 · 별 · 새싹 · 왕관 · 전구 · 하트 …)를
  운결 팔레트의 단순한 SVG 로 그림 (이미지 아님 → 어떤 해상도에서도 선명, 공유 이미지에도 그대로)
*/

export type IconName =
  | "leaf" | "flame" | "mountain" | "gem" | "drop"
  | "crown" | "sprout" | "tree" | "star" | "bulb"
  | "heart" | "spark" | "root" | "wave" | "balance"
  | "rings" | "split" | "chat" | "laurel";

const GOLD = "#c79a5e";
const ROSE = "#b4566c";
const GREEN = "#6d8a5a";
const INK = "#5b2a3a";

export function Icon({ name, className, style }: { name: IconName; className?: string; style?: CSSProperties }) {
  const p = { className, style, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true as const };
  switch (name) {
    case "leaf":
      return (
        <svg {...p}>
          <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z" fill="#e9d3b5" stroke={GOLD} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M5 19 14 10" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "flame":
      return (
        <svg {...p}>
          <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.4 1.3-3.8 2.4-5 .3 1.6 1 2.6 2 3-.4-2.8-.2-5.4.6-8Z" fill="#f0b39f" stroke="#c4553f" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case "mountain":
      return (
        <svg {...p}>
          <path d="M2.5 19 9 8l3.5 5.5L15 10l6.5 9h-19Z" fill="#e8cfa8" stroke="#a37845" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case "gem":
      return (
        <svg {...p}>
          <path d="M7 4h10l4 5-9 11L3 9l4-5Z" fill="#e7e3ea" stroke="#857b8f" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M3 9h18M9 4l-1.5 5L12 20l4.5-11L15 4" stroke="#857b8f" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      );
    case "drop":
      return (
        <svg {...p}>
          <path d="M12 3c3.5 4.3 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.5-6.7 6-11Z" fill="#cfdaf0" stroke="#4f6b9a" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M9.2 14.5a3 3 0 0 0 2.3 3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "crown":
      return (
        <svg {...p}>
          <path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 10H5L3 8Z" fill="#f2d79a" stroke="#b88a3e" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M5.5 15.5h13" stroke="#b88a3e" strokeWidth="1" />
        </svg>
      );
    case "sprout":
      return (
        <svg {...p}>
          <path d="M12 20v-8" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 13c-.5-3.8-3-5.5-7-5.5.2 3.8 2.8 5.7 7 5.5Z" fill="#cfe0bd" stroke={GREEN} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M12 12c.5-3.5 2.8-5.2 6.5-5.2-.2 3.6-2.6 5.3-6.5 5.2Z" fill="#cfe0bd" stroke={GREEN} strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case "tree":
      return (
        <svg {...p}>
          <path d="M12 22v-7M12 17.5l-2.5-2M12 16l2.5-2" stroke="#8a6040" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 2.5c3.6 0 6.5 2.7 6.5 6 0 .9-.2 1.7-.6 2.4A3.5 3.5 0 0 1 15 16H9a3.5 3.5 0 0 1-2.9-5.1A5.6 5.6 0 0 1 5.5 8.5c0-3.3 2.9-6 6.5-6Z" fill="#c9dcb3" stroke="#6d8a5a" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case "star":
      return (
        <svg {...p}>
          <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8L12 3Z" fill="#f4d58c" stroke="#bf9440" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case "bulb":
      return (
        <svg {...p}>
          <path d="M9 17h6M10 20h4" stroke="#a37845" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.2.9 1.9V17h5.2v-1.2c0-.7.3-1.4.9-1.9A6 6 0 0 0 12 3Z" fill="#f6dfa0" stroke="#bf9440" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case "heart":
      return (
        <svg {...p}>
          <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" fill="#f1b7c3" stroke={ROSE} strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case "spark":
      return (
        <svg {...p}>
          <path d="M13 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z" fill="#f4d58c" stroke="#bf9440" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M6 15c.3 1.8 1.2 2.7 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.3 2.7-1.2 3-3Z" fill="#f4d58c" stroke="#bf9440" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      );
    case "root":
      return (
        <svg {...p}>
          <path d="M4 12h16" stroke="#a37845" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M12 4v8m0 0c0 3-3 4-4 8m4-8c0 3 3 4 4 8m-4-8v8" stroke="#a37845" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="12" cy="4.5" r="2" fill="#e8cfa8" stroke="#a37845" strokeWidth="1.2" />
        </svg>
      );
    case "wave":
      return (
        <svg {...p}>
          <path d="M3 10c2.2-2 4.3-2 6.5 0s4.3 2 6.5 0 3.5-1.6 5 0M3 15c2.2-2 4.3-2 6.5 0s4.3 2 6.5 0 3.5-1.6 5 0" stroke="#4f6b9a" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "balance":
      return (
        <svg {...p}>
          <path d="M12 4v15M7 19h10M5 7h14" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M5 7 2.5 13h5L5 7Zm14 0-2.5 6h5L19 7Z" fill="#efd9c5" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
      );
    case "rings":
      return (
        <svg {...p}>
          <circle cx="9" cy="12" r="5" stroke={ROSE} strokeWidth="1.6" />
          <circle cx="15" cy="12" r="5" stroke={INK} strokeWidth="1.6" />
        </svg>
      );
    case "split":
      return (
        <svg {...p}>
          <path d="M4 18c4 0 5-3 8-6s4-6 8-6M4 6c3 0 4.5 1.6 5.8 3.2M20 18c-3 0-4.5-1.6-5.8-3.2" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
          <path d="m17.5 3.5 2.5 2.5-2.5 2.5" stroke={INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "chat":
      return (
        <svg {...p}>
          <path d="M12 4c4.7 0 8.5 3 8.5 7s-3.8 7-8.5 7c-.9 0-1.8-.1-2.6-.3L5 19.5l1-3.4C4.4 14.8 3.5 13 3.5 11c0-4 3.8-7 8.5-7Z" fill="#f6e3e6" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
          <circle cx="8.5" cy="11" r="1" fill={INK} />
          <circle cx="12" cy="11" r="1" fill={INK} />
          <circle cx="15.5" cy="11" r="1" fill={INK} />
        </svg>
      );
    case "laurel":
      return (
        <svg {...p} viewBox="0 0 16 32">
          <path d="M13 30C5 26 2 18 4 8" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" />
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx={4.2 + i * 0.4} cy={9 + i * 4.4} rx="2.1" ry="1.1" transform={`rotate(-40 ${4.2 + i * 0.4} ${9 + i * 4.4})`} fill="#e3c08c" />
          ))}
        </svg>
      );
  }
}

/** 원본의 매듭 장식(카드 윗변 가운데 · 일간 알약 양옆) */
export function Knot({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 20 20" className={className} style={style} aria-hidden>
      <rect x="4.5" y="4.5" width="11" height="11" rx="1.5" transform="rotate(45 10 10)" fill="#f4e2c8" stroke="#c79a5e" strokeWidth="1.2" />
      <rect x="7.5" y="7.5" width="5" height="5" rx="1" transform="rotate(45 10 10)" fill="none" stroke="#a5733f" strokeWidth="1" />
    </svg>
  );
}

/** 전통 구름 무늬 — 카드 모서리에 옅게 */
export function Cloud({ className, style, flip }: { className?: string; style?: CSSProperties; flip?: boolean }) {
  return (
    <svg viewBox="0 0 120 48" className={className} style={{ ...style, transform: flip ? "scaleX(-1)" : undefined }} aria-hidden fill="none">
      <path
        d="M4 40c10-1 16-6 18-13 2-8 10-12 17-9 4-8 15-10 22-3 6-5 16-3 19 4 5-2 11 0 13 5M30 40c6 0 10-4 9-9-1-4-6-5-8-2-2 2 0 5 2 4M60 40c8 0 13-5 12-11-1-5-7-7-10-3-2 3 0 6 3 5M90 40c6 0 11-3 12-8"
        stroke="#e8b9c0"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M8 46h104" stroke="#efcfd2" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
