import type { Metadata, Viewport } from "next";
import { HomeScreen } from "@/components/home/HomeScreen";

export const metadata: Metadata = {
  title: "운결 — 운세 홈",
  description: "종합운 · 연애 · 재회 · 궁합 · 재물 · 직업 · 인간관계 · 2027년 신년운세, 그리고 사주 × MBTI 통합 분석.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2e1c24",
};

/** /home = 운결 콘텐츠 홈 (인트로에서 진입) */
export default function HomePage() {
  return <HomeScreen />;
}
