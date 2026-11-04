# 만세력 연결 구조 (PHASE 6 — 연결 준비 상태)

> 현재 상태: **실제 계산은 연결되지 않았어요.** 화면(채팅 · 결과 카드 · 리포트)은 모두 고정 샘플 사주(운결 데모 사주, 일간 乙木)를 써요.

## 확인한 것 · 못 한 것

| 항목 | 상태 |
|---|---|
| HRUM 공식 문서 `hrum.ai/docs.html` | **직접 확인 못 함** (개발 세션에서 사이트 접근 차단) |
| 요청 · 응답 형식 | HRUM 운영사(플로트 주식회사)가 공개한 예제에서만 확인: [hrum-manseryeok-example](https://github.com/float1122/hrum-manseryeok-example), [hrum-saju-api-examples](https://github.com/float1122/hrum-saju-api-examples) |
| 실제 API 호출 | 안 함 (키 없음). 단위 테스트는 가짜 응답으로만 |

예제에서 확인한 내용 (공식 문서로 다시 확인 필요)
- `POST {base}/manseryeok`, 헤더 `X-Partner-Api-Key: <키>` · `Content-Type: application/json` · `User-Agent: 앱이름/버전`
- 본문: `year` `month` `day` (필수) · `hour` `minute` (모르면 생략) · `timezone` (필수, 예 `Asia/Seoul`) · `gender` (필수) · `calendar: "lunar"` · `isLeapMonth`
- 응답: `{ success: true, data: { wonkuk: { year, month, day, hour } } }`, 기둥마다 `stem` `branch` `stemHanja` `branchHanja` `ohaeng` `stemSipsin` `branchSipsin`, 시각 미상이면 `wonkuk.hour: null` · `birthHour.known: false`
- 오류: `{ success: false, statusCode, code?, message, timestamp }`, 예: `INVALID_LUNAR_DATE` `INVALID_LOCATION` `INSUFFICIENT_BALANCE` `RATE_LIMIT_EXCEEDED` `SERVICE_DEGRADED`
- 과금: 성공 요청마다. 같은 입력은 캐시 권장

## 구조

```
브라우저 (채팅 · 리포트)  ── 지금: MockManseProvider (샘플, 입력 무시)
        │  (다음 단계: 매핑 확인 후 fetch("/api/manse"))
        ▼
/api/manse  (src/app/api/manse/route.ts — Node 런타임, 캐시 금지)
  └ src/server/manse/handler.ts   같은 출처 · 2KB 제한 · IP당 분당 제한 · JSON · 입력 검증
      └ service.ts                설정 확인 · 10분 메모리 캐시(입력 해시) · status 결정
          └ hrum.ts               HRUM 호출(타임아웃) · 응답 검증 · ManseResult 변환 · 오류 매핑
```

- 키는 `HRUM_API_KEY`(서버 환경 변수)로만. 주소도 `HRUM_API_BASE_URL` 로만 받고 코드에 기본값 없음
- 설정이 없으면 HRUM 을 부르지 않고 `503 { status: "not-configured" }`
- `HRUM_MAPPING_VERIFIED=true` 전에는 결과가 와도 `status: "unverified"` → 화면에 '계산 결과'로 쓰지 않음
- 응답에 키 · 생년월일 · 이름을 넣지 않고, 로그에는 오류 코드만

## 데이터 처리 기준

| 항목 | 운결의 처리 | 계산 엔진에 맡기는 것 (문서 확인 필요) |
|---|---|---|
| 양력 / 음력 | `calendar` 그대로, 음력이면 `calendar: "lunar"` | 음력 → 양력 변환 |
| 윤달 | 음력이면 true/false 필수. **모르면 계산하지 않고 422** (추측 안 함) | 없는 윤달 판정 (`INVALID_LUNAR_DATE`) |
| 출생 시각 미상 | `hour` `minute` 생략 → 시주 비움, 오행은 6글자 기준 | — |
| 절기 경계 | 절기 날 ±1일이면 '월주가 시각에 따라 달라질 수 있음', 입춘 무렵이면 '연주도' 경고 | 실제 절입 시각 |
| 표준시 · 서머타임 | `timezone: "Asia/Seoul"` 만 허용. 1908–1911 · 1948–1961 · 1987–1988 출생은 경고 | 역사적 표준시 · 서머타임 보정, 진태양시(경도) 보정 여부 |
| 자시(23–01시) | 경고만 | 야자시 · 조자시 규칙 (`zaSiRule` — 예제에 이름만 있어 보내지 않음) |
| 해외 출생 · 좌표 | 지원 전 (다른 시간대 400) | `birthLatitude` `birthLongitude` |

## 응답 → 화면 데이터 매핑

| 화면 데이터 (`ManseResult`) | HRUM 응답 | 상태 |
|---|---|---|
| 년 · 월 · 일 · 시주 천간 · 지지 | `wonkuk.*.stemHanja` · `branchHanja` (운결 천간 · 지지 표와 맞지 않으면 실패) | 예제 기준 |
| 시주 미상 | `wonkuk.hour === null` | 예제 기준 |
| 일간 | 일주 천간 | 예제 기준 |
| 오행 개수 | 운결이 8(6)글자에서 직접 셈 | 운결 계산 |
| 십신 | 지금 화면은 운결의 다섯 갈래(비겁 · 식상 · 재성 · 관성 · 인성)를 일간 오행으로 계산 | `stemSipsin` `branchSipsin` 값 형식 확인 후 비교 · 연결 |
| 대운 · 세운 · 용신 · 격국 · 신강/신약 | 쓰지 않음 (리포트에 '미연결') | 형식 확인 후 연결 |

## 연결 순서 (사용자 작업 → 개발 작업)

1. HRUM 콘솔에서 API 키 발급 · 과금 설정
2. 공식 문서에서 위 '확인 필요' 항목 확인 (특히 주소 · 시각 보정 · 자시 규칙 · 십신 값 형식)
3. Vercel 프로젝트 → Settings → Environment Variables 에 `MANSE_PROVIDER=hrum` `HRUM_API_BASE_URL` `HRUM_API_KEY` 추가 (Production · Preview)
4. 배포 후 `GET /api/manse` 가 `configured: true` 인지 확인
5. 테스트 생년월일 몇 개로 다른 만세력과 대조 → 맞으면 `HRUM_MAPPING_VERIFIED=true`
6. 그다음 화면을 `/api/manse` 결과로 바꾸는 작업 (resultStatus `calculated` 일 때만 '샘플' 표시 해제)
