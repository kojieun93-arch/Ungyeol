import { handleMansePost, handleManseStatus } from "@/server/manse/handler";

/**
 * POST /api/manse — 실제 만세력 계산 (서버 전용, HRUM 키는 서버 환경 변수)
 * GET  /api/manse — 연결 상태 (값 없이 설정 여부만). 공개 모드면 화면용 서명 쿠키 발급
 * GET  /api/manse?probe=store + X-Manse-Check-Token — 공유 저장소 · 하루 예산 확인 (HRUM 호출 없음)
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handleManseStatus(process.env, req);
}

export async function POST(req: Request) {
  return handleMansePost(req);
}
