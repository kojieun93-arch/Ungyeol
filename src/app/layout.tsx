import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

/** 제목용 한글 명조 */
const serifKr = Noto_Serif_KR({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-serif-kr",
  display: "swap",
  preload: false,
});

/** 'Chapter 01' 같은 에디토리얼 라벨용 이탤릭 세리프 */
const cormorant = Cormorant_Garamond({
  weight: ["400", "500"],
  style: ["italic"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "운결 — 내 안의 두 가지 결이 만나는 순간",
  description: "타고난 기질과 지금의 성향이 만나 당신만의 이야기가 시작됩니다. 사주 × MBTI 개인 리포트.",
  applicationName: "운결",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2e1c24",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${serifKr.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
