# 만세력 단위 테스트

실제 HRUM 을 부르지 않아요. 공식 응답 형식의 가짜 응답으로만 검사해요.

```bash
npm run test:manse
```

- `server.test.ts` — 입력 검증 · 주소 정리 · 요청 본문 · 응답 매핑 · 오류 · 재시도 · 캐시 · 크레딧 추정 · 확인 토큰
- `live.test.ts` — 실제 호출로 검증한 4사례 고정(원국 · 오행 · 천간 십신) · 공개 조건 · 브라우저 저장소(샘플 ↔ 실제 · 서명 쿠키 재시도) · 값의 출처 분리 · 리포트 연결
- `verified.test.ts` — 실제 HRUM 검증 10건 고정 + 독립 기준 계산기(`reference.ts`) 대조 · 필드 누락 · 계산 기준 불일치 · 경계 규칙 안내
- `protect.test.ts` — 공유 하루 예산(가짜 Upstash, `fakeUpstash.ts`) · 환불 · 서명 쿠키 · 위조 · 반복 · 동시 폭주 · 저장소 장애 · Turnstile · 저장소 점검 · 비밀값 노출
- `reference.ts` — 앱 코드를 쓰지 않는 독립 만세력 계산기 (천문 절기 · 율리우스 일수 · 오호둔 · 오서둔)

`tsconfig.json` 에서 제외되어 있어 `next build` 타입 검사에는 들어가지 않아요.
