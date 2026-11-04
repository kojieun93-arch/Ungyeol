import type { Metadata, Viewport } from "next";
import { IntroScreen } from "@/components/intro/IntroScreen";

export const metadata: Metadata = {
  title: "운결 — 사주 × MBTI 상담",
  description: "타고난 나와 지금의 나. 그 사이에 아직 발견하지 못한 이야기가 있어요.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2a1d2b",
};

/** / = 운결 인트로. 메인 버튼 → /chat */
export default function IntroPage() {
  return <IntroScreen />;
}
