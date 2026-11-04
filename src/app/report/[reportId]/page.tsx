import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { ReportReader } from "@/components/report/reader/ReportReader";
import { isReportId } from "@/features/report/types";

type Params = { params: Promise<{ reportId: string }> };

/** sample = 공개 샘플 리포트, my = 이 탭에서 나눈 상담으로 만든 리포트 (주소에 개인정보 없음) */
export function generateStaticParams() {
  return [{ reportId: "sample" }, { reportId: "my" }];
}
export const dynamicParams = false;

export const metadata: Metadata = { title: "종합 리포트 — 운결" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#2e1c24" };

export default async function ReportPage({ params }: Params) {
  const { reportId } = await params;
  if (!isReportId(reportId)) notFound();
  return <ReportReader reportId={reportId} />;
}
