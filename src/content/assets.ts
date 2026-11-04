/**
 * 이미지 에셋 레지스트리
 *
 * 현재 모든 일러스트는 코드(SVG/CSS)로 그려져 있어 외부 이미지가 필요 없습니다.
 * 실제 일러스트·사진으로 교체할 때는:
 *   1. 파일을 public/images/<영역>/ 에 규칙에 맞는 이름으로 넣고
 *   2. 아래 항목의 src 를 채우고 status 를 "ready" 로 바꾼 뒤
 *   3. 해당 컴포넌트에서 getAsset(key) 로 불러 next/image 로 렌더링합니다.
 *      (src 가 없으면 지금처럼 코드 일러스트가 그대로 쓰입니다)
 *
 * 파일 규칙: public/images/<area>/<name>@<width>w.<webp|avif>
 *   예) public/images/home/moon-scene@1170w.webp
 */

export type AssetStatus = "code-drawn" | "ready";

export type AssetEntry = {
  /** public 기준 경로. 없으면 코드 일러스트 사용 */
  src?: string;
  alt: string;
  /** 원본 권장 크기 (px) */
  width: number;
  height: number;
  status: AssetStatus;
  /** 어떤 컴포넌트가 쓰는지 */
  usedBy: string;
  note?: string;
};

export const ASSETS = {
  "brand.logo": {
    src: "/images/ungyeol-logo.webp",
    alt: "운결 — 사주 × MBTI 운명 상담",
    width: 900,
    height: 482,
    status: "ready",
    usedBy: "components/chat/ChatHeader.tsx, components/intro/IntroScreen.tsx",
    note: "design/source/01-logo.png 에서 로고 영역(x430–1640, y20–668)만 잘라 배경을 투명 처리. 글자·달·인장·부제는 다시 그리지 않음. 헤더용 520px 판: ungyeol-logo-sm.webp",
  },
  "advisor.character": {
    src: "/images/ungyeol-character.webp",
    alt: "운결 상담자 — 자주색 한복과 벚꽃 장신구, 긴 검은 머리의 여성",
    width: 1086,
    height: 1448,
    status: "ready",
    usedBy: "components/intro/IntroVisual.tsx",
    note: "design/source/02-character.png 원본 그대로 (형식만 WebP)",
  },
  "advisor.profile": {
    src: "/images/ungyeol-advisor.webp",
    alt: "운결 상담자 프로필",
    width: 240,
    height: 240,
    status: "ready",
    usedBy: "components/chat/ChatAvatar.tsx",
    note: "02-character.png 의 얼굴 영역(중심 493,361 · 반지름 268). 03-chat.png 의 프로필과 템플릿 매칭으로 위치를 맞춤",
  },
  "chat.background": {
    src: "/images/chat/chat-bg-top.webp",
    alt: "",
    width: 954,
    height: 1649,
    status: "ready",
    usedBy: "components/chat/ChatRoom.tsx",
    note: "03-chat.png 에서 UI(로고·말풍선·버튼·입력창)를 지운 그림. 위(0–1100)·아래(960–1649) 두 조각 + 사이 민무늬 띠(chat-bg-mid). 전체판: design/source/03-chat-background-ui-removed.png",
  },
  "reading.sakura": {
    src: "/images/reading/sakura-corner.webp",
    alt: "",
    width: 262,
    height: 92,
    status: "ready",
    usedBy: "components/reading/Frame.tsx",
    note: "03-chat-background-ui-removed.png 왼쪽 위 벚꽃 가지를 잘라 배경만 투명 처리. 크림 바탕용 보정판: reading/sakura-sprig-light.webp",
  },
  "result.cover": {
    alt: "두 갈래의 빛이 만나는 수면",
    width: 1170,
    height: 900,
    status: "code-drawn",
    usedBy: "components/result/ResultCover.tsx",
  },
  "report.cover": {
    alt: "리포트 표지 — 초승달과 두 가닥의 결",
    width: 900,
    height: 1260,
    status: "code-drawn",
    usedBy: "components/report/ReportCover.tsx",
  },
} satisfies Record<string, AssetEntry>;

export type AssetKey = keyof typeof ASSETS;

export function getAsset(key: AssetKey): AssetEntry {
  return ASSETS[key];
}
