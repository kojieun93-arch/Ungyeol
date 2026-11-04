# 만세력 연결 (PHASE 6-4 — 화면 연결 준비 완료 · 공개 전)

> 현재 화면: **샘플 사주(운결 데모 사주, 일간 乙木)** 그대로예요.
> 사용자 화면이 실제 계산을 쓰는 조건: `HRUM_MAPPING_VERIFIED=true` **그리고** `MANSE_PUBLIC_ENABLED=true` (GET /api/manse 의 `screen: "live"`) **그리고** 그 요청의 서버 응답이 `status: "calculated"`(자체 점검 모두 통과)

## 실제 호출 검증 기록
| 일시 | 사례 | 결과 |
|---|---|---|
| 2026-11-05 | 기본 4건 (양력 2 · 시각 모름 1 · 음력 평달 1) | HTTP 200 4/4 · 원국 기준값 4/4 · 한글 표기 4/4 · 오행 개수 4/4 · 시각 모름 시주 null · 음력 변환 확인 (사용자 실행, /check/manse) |
| 대기 | 천간 십신 표준 규칙 대조 | 4건 실행 당시엔 점검 항목이 없었음 → 다음 실행에서 확인 |
| 대기 | 추가 6건 (입춘 전/후 · 자시 · 윤달 · 없는 윤달 · 서머타임) | /check/manse 3단계 |

## 화면 연결 구조
```
채팅 결과 카드 · 전체 화면 · 리포트(my) · 무료 요약 카드
  └ resultFor(profile)  ← features/chat/consultation.ts
      └ getLiveEntry(profile) ← features/saju/live.ts (브라우저 메모리)
           calculated → 실제 원국 + liveExtras(십신 · 계산 기준)  → resultStatus "calculated"
           그 밖(sample 모드 · 계산 중 · 실패 · 윤달 모름 · unverified) → 데모 사주 + '샘플' 표시 (+ 이유)
```
- 브라우저는 `GET /api/manse` 의 `screen` 만 보고, `live` 일 때만 `POST /api/manse` (키 · 토큰 없음)
- 실제 계산일 때 카드: '만세력' 알약 · '운결 결과' · 십신 줄 · 근거 문구(HRUM 계산 · 표준시 · 전통 자시 · 일간 해석은 운결 해설표)
- 리포트: 사주 칸 '실제 계산', 대운 · 세운 · 월운 관계 · 두 사람 원국 비교는 계속 '미연결/미확정'
- 사주 기반 참고 MBTI: 실제 계산이어도 '운결 비유 분류(규칙 확정 전 시안) · 실제 MBTI 산출 아님'

## 공개 사용 보호 (과금 방지)
| 단계 | 누가 계산할 수 있나 |
|---|---|
| 검증 전 (VERIFIED 없음) | 확인 토큰(X-Manse-Check-Token) 요청만 |
| 검증 후 · 공개 전 (VERIFIED=true, PUBLIC 없음) | 확인 토큰 요청만 (공개 요청 403 PUBLIC_DISABLED) |
| 공개 (VERIFIED=true + PUBLIC=true) | 같은 사이트 브라우저(Origin 필수, Sec-Fetch-Site same-origin) · IP당 분당 3 · IP당 하루 `MANSE_IP_DAILY_LIMIT` · 인스턴스 하루 `MANSE_DAILY_BUDGET` |
- 한계: 서버리스 인스턴스 메모리 기준이라 인스턴스가 여럿이면 합산되지 않음, Origin 은 curl 로 꾸밀 수 있음 → **최종 상한은 HRUM 콘솔 '요청 제한'(하루 횟수)**. 공개 전 공유 저장소(예: Vercel KV / Upstash) 카운터 · 봇 차단(Turnstile 등) 도입 권장

## 근거 문서 (2026-11-05 확인)
- 공식 문서 https://hrum.ai/docs.html (만세력 API 절) · 시작 가이드 https://hrum.ai/getting-started.html
- 문서에 없거나 이번에 읽은 범위에서 확인되지 않은 것: 일간 자리의 `stemSipsin` 표기, `lunarInput` · `trueSolarTime` · `warnings` 의 세부 필드, 공통 오류표 전체 → **추측해서 쓰지 않음**

## 요청 (운결 → HRUM)
`POST https://api.hrum.ai/api/v1/partners/v1/manseryeok` · 헤더 `X-Partner-Api-Key` · `Content-Type: application/json` · `User-Agent: ungyeol/0.2` · `X-Idempotency-Key`(본문 해시)

| 공식 필드 | 운결 값 | 비고 |
|---|---|---|
| `year` `month` `day` | 생년월일 | 필수 |
| `hour` `minute` | 출생 시각 | 모르면 **생략** → 시주 없이 3주 계산 |
| `timezone` | `"Asia/Seoul"` 고정 | 필수 (생략 시 400) |
| `gender` | `male` · `female` | 필수 (대운 방향) |
| `calendar` · `isLeapMonth` | 음력일 때만 `"lunar"` · true/false | 윤달 모르면 운결이 422로 막음 (추측 안 함). 없는 윤달은 HRUM 400 `INVALID_LUNAR_DATE` |
| `birthLatitude` `birthLongitude` `country` | 보내지 않음 | → 진태양시 보정 없이 표준시 기준 (보내면 경도 보정) |
| `zaSiRule` | 보내지 않음 | → 공식 기본 `traditional` (23시 이후 다음 날 일주) |
| `birthTimePrecision` `name` `astrology` `glossary` `lang` | 보내지 않음 | 이름은 개인정보라 보내지 않음, `lang` 기본 `ko` |

HRUM 이 직접 처리 (공식 문서): 절기 기준 원국 · 한국 서머타임(1948–51 · 1955–60 · 1987–88, 서울 시간대) 1시간 차감 · 음력 변환(KASI, 음력 1900-01-01 ~ 2050-11-30)

## 응답 매핑표 (HRUM → 운결)

| 공식 응답 | 운결 필드 | 처리 |
|---|---|---|
| `success` | — | `true` 가 아니면 실패 |
| `data.wonkuk.{year,month,day,hour}.stemHanja` · `branchHanja` | `ManseResult.pillars[].stem` · `branch` | 운결 천간 · 지지 표로 변환. 표에 없으면 실패 |
| `….stem` · `….branch` (한글) | `calculation.pillars[].stemHangul` · `branchHangul` | 한자와 맞지 않으면 실패 |
| `data.wonkuk.day.stemHanja` | `ManseResult.dayMaster` | 일간 |
| `data.wonkuk.hour === null` + `data.birthHour.known === false` | 시주 비움 · `hourKnown:false` · `birthHourKnown:false` | 공식 안내대로 `birthHour.known` 으로 판별 (`excludedFields` 안 씀) |
| `….ohaeng` (목화토금수) | `calculation.pillars[].ohaeng` | 제공자 문자열 그대로 보관 |
| `….stemSipsin` · `….branchSipsin` (10종) | `calculation.pillars[].stemSipsin` · `branchSipsin` → 카드 '십신' 줄 | 그대로 표시. 일간 자리는 '일간'. 천간 십신은 운결 표준 규칙(생극 + 음양)으로 따로 계산해 대조 → `checks.stemSipsinMatches`, 이름이 10종 밖이면 `sipsinNamesKnown:false` (둘 중 하나라도 어긋나면 calculated 안 됨). 지지 십신은 학파 차이로 대조하지 않음 |
| `data.ohaengBalance {목,화,토,금,수}` | `calculation.ohaengBalance {wood,fire,earth,metal,water}` | 운결이 글자로 센 개수와 비교 → `verification.checks.ohaengBalanceMatches` |
| `data.trueSolarTime` | `calculation.trueSolarTimeApplied` | null 이면 보정 안 함 |
| `data.lunarInput` | `calculation.lunarConverted` | 있는지만 (세부 필드 미확인) |
| `data.warnings[].code` | `warnings.provider` | 코드만 (예 `UNKNOWN_TIMEZONE`) |
| `daeun` `seun` `yongshin` `gyeokguk` `strength` `jijanggan` `ungSung` 신살 등 | 변환하지 않음 | 리포트 '미연결' 유지 → 다음 단계 |

## 운결 응답 (`/api/manse`)
```
{ status: "calculated" | "unverified" | "not-configured" | "error",
  calculation: { manse, pillars[], ohaengBalance, birthHourKnown, trueSolarTimeApplied, lunarConverted, providerWarnings, checks },
  warnings:    { provider: [코드], ungyeol: [{code, message}] },
  verification:{ mappingVerified, checks: { ohaengBalanceMatches, hangulMatches } },
  error:       { code, message, upstreamStatus?, upstreamCode? } }   ← 오류일 때만
```
- `calculated` = `HRUM_MAPPING_VERIFIED=true` **그리고** 자체 점검 일치. 그 외 성공은 `unverified`
- 검증 전(`HRUM_MAPPING_VERIFIED` 없음)에는 `X-Manse-Check-Token` 이 맞는 요청만 계산 (403 `CHECK_TOKEN_REQUIRED`)

## 오류 (공식 → 운결)
| HRUM | 운결 code · HTTP | 재시도 |
|---|---|---|
| 400 `INVALID_LUNAR_DATE` | `INVALID_LUNAR_DATE` 400 | 안 함 |
| 400 기타 (`INVALID_LOCATION` · 형식) | `INVALID_INPUT` 400 | 안 함 |
| 401 키 없음 · 잘못됨 | `AUTH` 503 | 안 함 |
| 402 잔액 부족 (만세력은 code 없음) | `INSUFFICIENT_BALANCE` 503 | 안 함 |
| 403 보안 규칙 (HTML 본문) | `BLOCKED` 503 | 안 함 |
| 429 | `RATE_LIMITED` 503 | 안 함 |
| 500 · 502 · 503 · 504 | `UPSTREAM` 503 | **1번** (1초 뒤) |
| 시간 초과(기본 8초) | `TIMEOUT` 504 | 안 함 |
공식: 실패(4xx · 5xx) 응답은 과금 없음 · 성공 1건 ₩50 · 키당 분당 300회 상한

## 실제 호출 검증 순서
1. Vercel 환경 변수 등록 (아래) → 재배포
2. `GET /api/manse` → `configured: true`, `screen: "sample"`
3. `UNGYEOL_URL=… MANSE_CHECK_TOKEN=… node scripts/manse-check.mjs --yes` (최대 4건, ₩200 이하)
4. `manse-check-result.json` 을 대화로 전달 → 기준값과 대조 · 십신 표기 확인
5. 모두 맞으면 그때 `HRUM_MAPPING_VERIFIED=true` → 화면 연결 작업 (별도 단계)
