import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { FortuneDetail } from "@/components/home/FortuneDetail";
import { FORTUNES, FORTUNE_IDS, isFortuneId } from "@/content/fortunes";

type Params = { params: Promise<{ id: string }> };

/** 9개 카테고리는 빌드 때 정적으로 생성 */
export function generateStaticParams() {
  return FORTUNE_IDS.map((id) => ({ id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  if (!isFortuneId(id)) return {};
  return { title: `${FORTUNES[id].title} — 운결`, description: FORTUNES[id].short };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2e1c24",
};

/** /fortune/[id] = 운세 카테고리 소개 → 상담 시작 */
export default async function FortunePage({ params }: Params) {
  const { id } = await params;
  if (!isFortuneId(id)) notFound();
  return <FortuneDetail f={FORTUNES[id]} />;
}
