#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────
   HRUM 만세력 실제 호출 검증 — 배포된 운결 /api/manse 를 4번만 부르고 기준값과 대조
   - 운결 서버를 거쳐 호출하므로 이 스크립트에는 HRUM 키가 필요 없어요 (키는 Vercel 환경 변수에만)
   - 필요한 것: 배포 주소 · MANSE_CHECK_TOKEN (Vercel 에 넣은 확인 토큰과 같은 값)
   - 비용: 성공한 계산 1건당 ₩50 (공식 문서) → 최대 4건 = ₩200. 같은 입력은 서버 캐시 · 멱등성 키로 재과금 최소화
   - 오류(402 잔액 · 401 키 · 403 차단)가 나면 바로 멈춤

   실행:  UNGYEOL_URL=https://ungyeol-8lss.vercel.app MANSE_CHECK_TOKEN=... node scripts/manse-check.mjs --yes
   결과:  화면 표 + manse-check-result.json (테스트용 가상 생년월일만 들어 있어요)

   기준값: 연주 · 월주는 60갑자 · 절기 월(오호둔), 일주는 60일 순환(기준일 1949-10-01 甲子 — 2000-01-01 戊午 · 1900-01-01 甲戌와 일치),
          시주는 오서둔 + 시계 시각(진태양시 보정 없음). 절기 경계 · 서머타임 · 자시를 피한 날짜로 골랐어요.
   ────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync } from "node:fs";

const CASES = JSON.parse(readFileSync(new URL("../src/content/manse-check-cases.json", import.meta.url), "utf8")).cases; // 화면(/check/manse)과 같은 사례

const url = process.env.UNGYEOL_URL?.replace(/\/+$/, "");
const token = process.env.MANSE_CHECK_TOKEN;
if (!process.argv.includes("--yes") || !url || !token) {
  console.log("실제 HRUM 호출이 최대 4건(₩200 이하) 발생해요.\nUNGYEOL_URL · MANSE_CHECK_TOKEN 을 넣고 --yes 를 붙여 실행하세요.");
  process.exit(1);
}

const st = await fetch(`${url}/api/manse`).then((r) => r.json()).catch(() => null);
console.log("서버 상태:", JSON.stringify(st));
if (!st?.configured) {
  console.log("서버에 HRUM 설정이 없어 호출하지 않았어요.");
  process.exit(1);
}

const out = [];
for (const c of CASES) {
  const r = await fetch(`${url}/api/manse`, { method: "POST", headers: { "Content-Type": "application/json", "X-Manse-Check-Token": token, "User-Agent": "ungyeol-check/0.2" }, body: JSON.stringify(c.body) });
  const j = await r.json().catch(() => null);
  if (!r.ok) {
    console.log(`✗ ${c.name}: HTTP ${r.status} ${j?.error?.code ?? ""} ${j?.error?.upstreamStatus ?? ""}`);
    out.push({ case: c.name, http: r.status, error: j?.error ?? null });
    if (["INSUFFICIENT_BALANCE", "AUTH", "BLOCKED", "CHECK_TOKEN_REQUIRED", "NOT_CONFIGURED"].includes(j?.error?.code)) break;
    continue;
  }
  const p = Object.fromEntries(j.calculation.manse.pillars.map((x) => [x.key, x.stem ? x.stem.hanja + x.branch.hanja : null]));
  const keys = ["year", "month", "day", "hour"];
  const diff = keys.filter((k) => p[k] !== c.expect[k]);
  console.log(`${diff.length ? "✗" : "✓"} ${c.name}: 년 ${p.year} 월 ${p.month} 일 ${p.day} 시 ${p.hour ?? "없음"}${diff.length ? `  (기준과 다름: ${diff.map((k) => `${k} 기준 ${c.expect[k]}`).join(", ")})` : ""}`);
  console.log(`   십신 ${j.calculation.pillars.map((x) => `${x.key}:${x.stemSipsin ?? "-"}/${x.branchSipsin ?? "-"}`).join(" ")} · 오행 일치 ${j.verification.checks.ohaengBalanceMatches} · 경고 ${[...j.warnings.provider, ...j.warnings.ungyeol.map((w) => w.code)].join(",") || "없음"}`);
  out.push({ case: c.name, http: r.status, pillars: p, expect: c.expect, match: diff.length === 0, status: j.status, pillarsExtra: j.calculation.pillars, ohaengBalance: j.calculation.ohaengBalance, checks: j.verification.checks, warnings: j.warnings, birthHourKnown: j.calculation.birthHourKnown, trueSolarTimeApplied: j.calculation.trueSolarTimeApplied, lunarConverted: j.calculation.lunarConverted });
}
writeFileSync("manse-check-result.json", JSON.stringify({ at: new Date().toISOString(), url, results: out }, null, 2));
console.log(`\n${out.filter((o) => o.match).length}/${CASES.length} 일치 · manse-check-result.json 저장 (이 파일을 운결 작업 대화에 보내 주세요)`);
