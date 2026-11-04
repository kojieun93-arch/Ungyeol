import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { ReportReader } from "@/components/report/reader/ReportReader";
import { CHAPTER_META } from "@/content/report/chapters";
import { CHAPTER_IDS, isChapterId, isReportId } from "@/features/report/types";

type Params = { params: Promise<{ reportId: string; chapterId: string }> };

/** 같은 문서에서 해당 챕터 위치로 이동 */
export function generateStaticParams() {
  return ["sample", "my"].flatMap((reportId) => CHAPTER_IDS.map((chapterId) => ({ reportId, chapterId })));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { chapterId } = await params;
  const m = CHAPTER_META.find((c) => c.id === chapterId);
  return { title: m ? `${m.id} ${m.title} — 운결 종합 리포트` : "종합 리포트 — 운결" };
}
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#2e1c24" };

export default async function ReportChapterPage({ params }: Params) {
  const { reportId, chapterId } = await params;
  if (!isReportId(reportId) || !isChapterId(chapterId)) notFound();
  return <ReportReader reportId={reportId} chapterId={chapterId} />;
}
