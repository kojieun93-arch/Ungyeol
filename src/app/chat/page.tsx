import type { Metadata, Viewport } from "next";
import { ChatRoom } from "@/components/chat/ChatRoom";

export const metadata: Metadata = {
  title: "운결과 상담 — 사주 × MBTI",
  description: "타고난 기질과 지금의 성향, 두 가지 결을 운결과 대화하며 살펴보세요.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2e1c24",
  // 확대 제한 없음 (접근성). 입력창 글자를 16px 이상으로 두어 iOS 자동 확대를 피함
  // Android Chrome: 키보드가 열리면 레이아웃 높이를 줄임 (iOS는 visualViewport로 보정)
  interactiveWidget: "resizes-content",
};

/**
 * /chat = 운결 채팅 상담
 * /chat?topic=love 처럼 홈에서 고른 주제를 받음 (주제 id 만, 개인정보는 주소에 넣지 않음)
 * 알 수 없는 주제는 종합운으로, 주제가 없으면 인트로에서 들어온 기본 상담
 */
export default async function ChatPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = sp.topic;
  const topic = Array.isArray(raw) ? raw[0] : raw;
  // 리포트에서 '운결에게 더 물어보기' (리포트 · 챕터 id 만)
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
  return <ChatRoom topicParam={topic ?? null} reportParam={one(sp.report)} chapterParam={one(sp.chapter)} />;
}
