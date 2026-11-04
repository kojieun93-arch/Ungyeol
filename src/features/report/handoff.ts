import type { ChapterId, ConsultationContext, ReportId } from "./types";

/* ──────────────────────────────────────────────────────────
   리포트 ↔ 채팅 이동 기억 (메모리 전용, 이 탭에서만)
   - 리포트에서 '운결에게 더 물어보기' → 읽던 위치를 저장하고 /chat?report=…&chapter=… 로 이동
     (주소에는 리포트 · 챕터 id 만, 개인정보 없음)
   - 채팅에서 '리포트로 돌아가기' → 저장한 스크롤 위치로 복귀
   ────────────────────────────────────────────────────────── */

let saved: ConsultationContext | null = null;

export function saveReturn(c: ConsultationContext) {
  saved = c;
}

/** 같은 리포트(· 상품) · 챕터로 돌아왔을 때만 꺼내 씀 (한 번 쓰면 지움) */
export function takeReturn(reportId: ReportId, chapterId: string | null, productId: string | null = null): ConsultationContext | null {
  if (!saved || saved.reportId !== reportId || (saved.productId ?? null) !== productId || (chapterId && saved.chapterId !== chapterId)) return null;
  const c = saved;
  saved = null;
  return c;
}

export function peekReturn() {
  return saved;
}

export const chatHrefFor = (reportId: ReportId, chapterId: ChapterId) => `/chat?report=${reportId}&chapter=${chapterId}`;
/** 주제별 리포트 → 채팅 (주소에는 상품 · 리포트 · 챕터 id 만) */
export const productChatHref = (productId: string, reportId: ReportId, chapterId: string) => `/chat?product=${productId}&report=${reportId}&chapter=${chapterId}`;
export const reportHrefFor = (reportId: string, chapterId?: string | null) => (chapterId ? `/report/${reportId}/chapter/${chapterId}` : `/report/${reportId}`);
