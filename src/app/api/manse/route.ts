import { handleMansePost, handleManseStatus } from "@/server/manse/handler";

/**
 * POST /api/manse — 실제 만세력 계산 (서버 전용, HRUM 키는 서버 환경 변수)
 * GET  /api/manse — 연결 상태 (값 없이 설정 여부만)
 * 설정 전: 503 { status: "not-configured" } → 화면은 샘플 사주 그대로
 * 지금 화면(채팅 · 리포트)은 이 주소를 부르지 않음 (매핑 확인 후 연결)
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleManseStatus();
}

export async function POST(req: Request) {
  return handleMansePost(req);
}
