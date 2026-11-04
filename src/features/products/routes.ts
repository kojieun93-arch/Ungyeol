import type { ReportId } from "@/features/report/types";
import type { ProductId } from "./types";

/** 주제별 리포트 주소 — 상품 · 리포트 · 챕터 id 만 (개인정보 없음) */
export const productHref = (id: ProductId, reportId?: ReportId | null, chapterId?: string | null) =>
  !reportId ? `/reports/${id}` : chapterId ? `/reports/${id}/${reportId}/chapter/${chapterId}` : `/reports/${id}/${reportId}`;
