# 만세력 연결 (PHASE 6-2 — 공식 명세 반영 · 실제 호출 검증 대기)

> 현재 화면: **샘플 사주(운결 데모 사주, 일간 乙木)** 그대로예요. 실제 호출 검증과 기준 만세력 대조가 끝나기 전에는 바꾸지 않아요.

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
| `….stemSipsin` · `….branchSipsin` (10종) | `calculation.pillars[].stemSipsin` · `branchSipsin` | 그대로 보관 (일간 자리 표기는 문서에 없어 해석 안 함) |
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
