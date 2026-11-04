# 만세력 연결 (PHASE 6-5 — 공개 전 마지막 보안 · 정확도 점검)

> 현재 화면: **샘플 사주(운결 데모 사주, 일간 乙木)** 그대로예요.
> 사용자 화면이 실제 계산을 쓰는 조건 (모두 만족해야 함)
> 1. `HRUM_MAPPING_VERIFIED=true` 2. `MANSE_PUBLIC_ENABLED=true` 3. 공유 저장소(Upstash) 4. `MANSE_SIGNING_SECRET`(32자 이상)
>    → `GET /api/manse` 의 `screen: "live"` (하나라도 없으면 `publicBlockers` 에 이름이 나오고 screen 은 sample)
> 5. 그 요청의 서버 응답이 `status: "calculated"` — 자체 점검 · 필드 완전성 · 계산 기준이 모두 맞을 때만

## 실제 호출 검증 기록
| 일시 | 사례 | 결과 |
|---|---|---|
| 2026-11-05 | 기본 4건 c1~c4 (양력 2 · 시각 모름 1 · 음력 평달 1) | HTTP 200 · 원국 · 한글 · 오행 개수 · 천간 십신 일치 · 시각 모름 시주 null · 음력 변환 확인 |
| 2026-11-05 | 경계 6건 e1~e6 (입춘 전 · 입춘 후 · 23:30 자시 · 윤2월 · 없는 윤1월 · 1988 서머타임) | 정상 5건 일치 · e5 HTTP 400 `INVALID_LUNAR_DATE` (의도한 오류, 과금 없음) |
| 2026-11-05 | 독립 기준 계산기 대조 (`tests/manse/reference.ts`) | **10/10 일치** — 앱 코드 · HRUM 을 쓰지 않는 별도 계산 |
| 선택 | e7 1996-05-17 09:15 (시 경계가 정각인지 30분인지) | 미실행. 기존 10건은 이 차이를 가르지 못함 (아래 '남은 위험') |

기록은 `src/content/manse-check-cases.json` 의 `verifiedRuns` 에 있고, `tests/manse/verified.test.ts` 가 매번 대조해요.

### 독립 기준 계산기 (`tests/manse/reference.ts`)
| 항목 | 방법 |
|---|---|
| 절기 · 연 · 월주 | 태양 겉보기 황경(Meeus 저정밀식, 약 ±15분). 입춘 = 315°, 30°마다 다음 달. 오호둔 |
| 일주 | 율리우스 일수, (JDN + 49) mod 60. 기준점 1949-10-01 甲子 · 2000-01-01 戊午 · 1900-01-01 甲戌 |
| 시주 | 시계 시각(표준시, 진태양시 보정 없음), 子시 23:00–00:59, 오서둔 |
| 자시 | 전통 규칙 — 23시 이후 다음 날 일주 |
| 서머타임 | 1987-05-10 02:00 ~ 10-11 03:00 · 1988-05-08 02:00 ~ 10-09 03:00 이면 1시간 뺌 |
| 음력 | 시험 날짜만 공개 역법 자료 대응표 (2024 설 = 2-10, 2023 윤2월 1일 = 3-22) |
| 십신 | 오행 생극 + 음양 (앱 규칙과 100쌍 모두 같음을 시험) |
경계 사례(e1 · e2)는 절입 시각과 2.7시간 이상 떨어져 있어 천문식 오차가 결과를 바꾸지 않아요 (시험에서 확인).

## 출생 시각 · 절기 · 서머타임 · 자시 규칙 (화면 안내)
실제 계산일 때 원국 카드 아래 근거 문구에 해당하는 것만 '읽을 때 참고'로 붙어요.
| 상황 | 계산 | 안내 |
|---|---|---|
| 출생 시각 모름 | 시주 없이 연 · 월 · 일주 6글자. 오행 · 십신도 6글자 기준 | 시주 칸 비움 + 안내 |
| 절기 날 ±1일 | HRUM 이 절입 시각 기준으로 월주(2월이면 연주도) 결정 | '출생 시각에 따라 달라질 수 있어요'. 시각까지 모르면 '월주(입춘이면 연주도)가 실제와 다를 수 있어요' |
| 1987 · 1988 서머타임 기간 | HRUM 이 1시간 빼서 시주 계산 (e6 로 확인) | 기간 안일 때만 안내 |
| 1948–51 · 1955–60 | HRUM 이 기간 안이면 1시간 뺌 (공식 문서) | 날짜별 기간을 운결이 확인하지 않아 '기간 안이면'으로 조건부 안내 |
| 1908–11 · 1954–61 | 예전 표준시(UTC+8:30) — 문서에 처리 설명 없음 | 주의 안내만 |
| 23:00–23:59 | 전통 자시: 다음 날 일주 + 子시 (e3 로 확인) | '야자시 규칙이면 일주가 달라질 수 있어요' |
| 진태양시 | 위경도를 보내지 않아 보정 없음 | 근거 문구 '표준시 기준, 진태양시 보정 없음' |

## HRUM 응답 필드 → 화면 연결
| 응답 필드 | 쓰는 곳 | 없을 때 |
|---|---|---|
| `wonkuk.*.stemHanja` · `branchHanja` | 원국 카드 표 · 일간 · 리포트 사주 칸 | 응답 실패(502) |
| `wonkuk.*.stem` · `branch`(한글) | 한자와 대조만 | 한자 기준으로 씀 (대조 불가) |
| `wonkuk.*.ohaeng` | 보관 · 점검 | `missing` → calculated 안 됨 |
| `wonkuk.*.stemSipsin` (일간 제외) | 카드 십신 줄 위 | `missing` → calculated 안 됨 |
| `wonkuk.*.branchSipsin` | 카드 십신 줄 아래 | `missing` → calculated 안 됨 |
| `ohaengBalance` | 오행 그래프는 원국 8글자로 운결이 센 값, 이 값과 같아야 함 | `missing` → calculated 안 됨 |
| `birthHour.known` | 시각 모름 판별 | 시각 모름인데 없으면 응답 실패 |
| `trueSolarTime` | 기준 점검 (null 이어야 함) | 값이 있으면 `BASIS_MISMATCH` |
| `lunarInput` | 음력 입력 점검 (있어야 함) | 음력인데 없으면 `BASIS_MISMATCH` |
| `warnings[].code` | 보관 (화면 미사용) | — |
| `daeun` · `seun` · `yongshin` · `gyeokguk` · `strength` · `jijanggan` · `ungSung` · 신살 | **쓰지 않음** — 리포트 '미연결' | — |
calculated 가 아닌 이유는 `verification.reasons` 에 코드로 나와요: `MAPPING_NOT_VERIFIED` · `HANGUL_MISMATCH` · `OHAENG_MISMATCH_OR_MISSING` · `STEM_SIPSIN_MISMATCH_OR_MISSING` · `SIPSIN_NAME_UNKNOWN` · `FIELD_MISSING` · `BASIS_MISMATCH`

## 값의 출처 (`ResultPayload.provenance`)
| 값 | 실제 계산일 때 | 샘플일 때 |
|---|---|---|
| 원국 · 오행 개수 · 십신 | `hrum` | `sample` / 십신 `unconnected` |
| 일간 기질 문장 | `ungyeol-table` (운결 일간 10종 해설표) | 같음 |
| 사주 기반 참고 MBTI | `ungyeol-analogy-draft` — 운결 비유 분류 시안, 계산 · 진단 아님 | 같음 |
| 지금의 MBTI | `user-selected` | 같음 |
| 대운 · 세운 · 월운 · 용신 · 격국 · 신강약 · 지장간 · 12운성 · 신살 · 상대방 원국 | `unconnected` | 같음 |

## 화면 연결 구조
```
채팅 결과 카드 · 전체 화면 · 리포트(my) · 무료 요약 카드
  └ resultFor(profile)  ← features/chat/consultation.ts
      └ getLiveEntry(profile) ← features/saju/live.ts (브라우저 메모리)
           calculated → 실제 원국 + liveExtras(십신 · 계산 기준 · 읽을 때 참고)  → resultStatus "calculated"
           그 밖(sample 모드 · 계산 중 · 실패 · 윤달 모름 · unverified) → 데모 사주 + '샘플' 표시 (+ 이유)
```
- 브라우저는 `GET /api/manse` 의 `screen` 만 보고, `live` 일 때만 `POST /api/manse` (키 · 토큰 없음, 서명 쿠키는 HttpOnly 라 스크립트도 모름)
- 서명 쿠키 만료(30분) · 네트워크 변경 → 상태를 다시 받아 한 번만 재시도
- 리포트: 사주 칸 '실제 계산', 대운 · 세운 · 월운 관계 · 두 사람 원국 비교는 계속 '미연결/미확정'

## 공개 사용 보호 · 공유 과금 제한
### 단계
| 단계 | 누가 계산할 수 있나 |
|---|---|
| 검증 전 (VERIFIED 없음) | 확인 토큰(X-Manse-Check-Token) 요청만 |
| 검증 후 · 공개 전 | 확인 토큰 요청만 (공개 요청 403 `PUBLIC_DISABLED`) |
| 공개 (VERIFIED + PUBLIC + Upstash + 서명 비밀값) | 아래 보호를 모두 통과한 화면 요청 |

### 공개 요청이 통과해야 하는 순서 (앞에서 걸리면 HRUM 호출 없음)
| # | 보호 | 막는 것 | 거절 코드 |
|---|---|---|---|
| 1 | Origin 필수 · 같은 호스트 · `Sec-Fetch-Site: same-origin` | 다른 사이트 · curl 기본 호출 | 403 `FORBIDDEN_ORIGIN` |
| 2 | `Content-Type: application/json` | 단순 폼 위조(CSRF) | 415 |
| 3 | 서명 쿠키 (HMAC-SHA256, 30분, IP 해시 묶음, HttpOnly · Secure · SameSite=Strict · Path=/api/manse) | 화면을 거치지 않은 직접 호출 · 쿠키 재사용 · 변조 | 403 `TICKET_REQUIRED` |
| 4 | IP당 분당 3 · IP당 하루 `MANSE_IP_DAILY_LIMIT` (공유 저장소) | 반복 호출 | 429 `RATE_LIMITED` · `DAILY_LIMIT` |
| 5 | 입력 검증 | 잘못된 입력으로 크레딧 낭비 | 400 · 422 |
| 6 | 봇 확인 Cloudflare Turnstile (선택, 키 넣으면 켜짐) | 자동화 브라우저 · 봇 | 403 `BOT_CHECK_FAILED` |
| 7 | IP당 동시 1건 잠금 (15초) | 같은 사용자의 동시 폭주 | 429 `CONCURRENT` |
| 8 | 같은 입력 진행 중 공유 · 10분 캐시 | 같은 계산 중복 과금 | — |
| 9 | 전체 동시 HRUM 호출 `MANSE_MAX_CONCURRENT`(2) | 동시 폭주 | 503 `RATE_LIMITED` |
| 10 | **하루 전체 예산** `MANSE_DAILY_BUDGET`(18) — 공개는 `− MANSE_OPERATOR_RESERVE`(3) = 15 까지 | 총 비용 상한 | 503 `BUDGET_EXCEEDED` |
| 11 | 초당 `MANSE_UPSTREAM_PER_SECOND`(1, HRUM 콘솔과 같게) — 차 있으면 1.1초 한 번 기다림 | HRUM 429 | 503 `RATE_LIMITED` |
| — | 저장소 연결 실패 · 오류 | 셀 수 없는 상태에서 호출 | 503 `LIMIT_STORE_UNAVAILABLE` (fail-closed) |

### 공유 하루 예산 설계
- 저장소: Upstash Redis REST (Vercel Marketplace 'Upstash for Redis'). npm 패키지 없이 fetch 로 REST 명령만, 주소는 `https://*.upstash.io` 만 허용
- 키: `ungyeol:manse:budget:<한국 날짜>` 하나를 모든 인스턴스 · 토큰 요청 · 공개 요청이 같이 씀. 한국 자정에 만료
- 원자성: Lua 스크립트 한 번으로 `INCR → 처음이면 EXPIRE → 한도 넘으면 DECR 후 거절` (경쟁 상태 없음)
- 예약 → 환불: HRUM 을 부르기 **직전**에 1 예약. 과금되지 않은 결과(4xx · 5xx · 멱등 재응답)는 되돌림. 시간 초과는 HRUM 쪽에서 성공했을 수 있어 되돌리지 않음 (보수적으로 계산)
- 캐시 · 진행 중 공유 응답은 예산을 쓰지 않음
- 최대 비용: 하루 18건 × ₩50 = **₩900**. HRUM 콘솔 하루 20회 제한이 그 위의 최종 안전장치
- IP 는 비밀값을 섞은 해시로만 키에 씀 (원래 IP 미저장). 로그는 `[manse] 코드` 만

### 운영자 확인
- `/check/manse` → '공유 사용량 저장소 확인' (`GET /api/manse?probe=store` + 확인 토큰). HRUM 호출 없음. `shared: true` · 쓰기/읽기 true · 오늘 사용량 · 공개 전 남은 설정이 보여요

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
  verification:{ mappingVerified, checks: { ohaengBalanceMatches, hangulMatches, stemSipsinMatches, sipsinNamesKnown, requiredPresent, basisMatches }, reasons: [코드] },
  error:       { code, message, upstreamStatus?, upstreamCode? } }   ← 오류일 때만
```
- `calculated` = `HRUM_MAPPING_VERIFIED=true` **그리고** 점검 모두 통과(`reasons` 비어 있음). 그 외 성공은 `unverified`
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

## 안전한 전환 순서 (운영자가 직접 — 순서를 건너뛰지 마세요)
1. **Upstash 연결**: Vercel 프로젝트 → Storage(Marketplace) → Upstash for Redis 생성 · 연결 → `KV_REST_API_URL` · `KV_REST_API_TOKEN`(또는 `UPSTASH_REDIS_REST_*`)이 자동 등록됐는지 확인
2. **서명 비밀값**: `MANSE_SIGNING_SECRET` (32자 이상 임의 문자열, 비밀번호 관리자로 생성) 등록
3. (권장) **봇 확인**: Cloudflare Turnstile 위젯 생성(도메인 ungyeol-nine.vercel.app, 모드 Invisible/Managed) → `TURNSTILE_SITE_KEY` · `TURNSTILE_SECRET_KEY`
4. 예산 확인: `MANSE_DAILY_BUDGET` 은 HRUM 콘솔 하루 한도(20)보다 작게 (기본 18) · `MANSE_UPSTREAM_PER_SECOND=1`
5. 재배포 → `/check/manse` 에서 '저장소 확인' → `shared: true`, 쓰기/읽기 true, 오늘 사용량 숫자가 보이는지
6. (선택) e7 1건 실행 → 시 경계 규칙 확인 (₩50)
7. `HRUM_MAPPING_VERIFIED=true` 등록 → 재배포. **이때도 사용자 화면은 샘플** (`publicBlockers: ["MANSE_PUBLIC_ENABLED"]` 만 남아야 함)
8. `/check/manse` 1단계 1건 다시 → `status: "calculated"`, `reasons: []` 확인
9. 마지막으로 `MANSE_PUBLIC_ENABLED=true` → 재배포 → `GET /api/manse` 가 `screen: "live"`, `publicBlockers: []`
10. 휴대폰 화면에서 상담 1회 → 원국 카드 '만세력' · '실제 만세력 계산' 근거 확인 → HRUM 콘솔 사용량이 1 늘었는지
되돌리기: `MANSE_PUBLIC_ENABLED` 를 지우고 재배포하면 바로 샘플 화면으로 돌아가요 (다른 값은 그대로 둬도 됨)

## 실제 호출 검증 (스크립트)
1. `GET /api/manse` → `configured: true`, `screen: "sample"`
2. `UNGYEOL_URL=… MANSE_CHECK_TOKEN=… node scripts/manse-check.mjs --yes` (최대 4건, ₩200 이하)
3. `manse-check-result.json` 을 대화로 전달 → 기준값과 대조
