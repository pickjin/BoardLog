# 09. Roadmap

상태: **확정(Accepted)**. 2026-10-30. D-041, D-042.

## 1. 순서 (D-041)

```
M0 기반 정비 ──▶ M1 측정 (+ TBD-006 아이폰 실기기 확인 병행) ──▶ 4주 관찰 관문 ──▶ M2 결정
                                                                      ├─ 조건 충족: 클라우드 백업
                                                                      └─ 미충족: 게임 허브 또는 확산(공유 링크) 개선
```

클라우드 백업은 취소가 아니라 순서 결정 대상이다(D-010 유지).

## 2. 마일스톤

### M0 기반 정비

- 목적: 이후 모든 작업(사람·AI)의 안전장치. D-033(CI), D-038(AI 병합), D-040(완료 증거)이 작동하는 상태
- 사용자에게 보이는 변화: 없음. (설계 때 PR2를 "버그 4건 수정"으로 봤으나, 4건은 동작 차이 없는 타입 불일치였음. 05 §1 정정)
- 작업:

| ID | 작업 | 근거 |
|---|---|---|
| M0-1 | `bun.lock` 삭제, `package-lock.json` 생성, `engines.node` 24.x | D-021 |
| M0-2 | 미사용 의존성 제거·이동(`express`, `dotenv`, `@types/express`, `autoprefixer`, `vite` 중복, `@types/canvas-confetti`, `@types/node`) | 03 §5 |
| M0-3 | `@types/react`·`@types/react-dom` + `strict: true`, 오류 4건 수정 | D-025 |
| M0-4 | 스크립트 정리(`typecheck`, `lint`, `format`, `test*`, `clean`) | D-028 |
| M0-5 | Biome 도입, 전체 포맷 별도 커밋, 오류 정리(훅 의존성 3, 미사용 18, 나머지) | D-026 |
| M0-6 | Vitest 도입, 기존 순수 함수(`sharedPlay`, `backupImport`, `titleMatch`) 단위 테스트 | D-029, D-030 |
| M0-7 | Playwright Test 도입, qa-evidence 4개 스크립트 이전(S-01, S-02, 공통) | D-029 |
| M0-8 | `.github/workflows/ci.yml`(Supabase 단계는 M2에서 추가), 비밀값 문자열 검사 | D-033, D-037 |
| M0-9 | `.env.example` 재작성 | 07 §7.4 |
| 소유자 | TBD-014 main 브랜치 보호(M0-8 첫 실행 후), TBD-015, TBD-016 | |

- PR 순서(D-042). M0 기간에는 다른 기능 작업을 병행하지 않는다.

| PR | 포함 작업 | CI에 추가되는 검사 | 병합 후 |
|---|---|---|---|
| PR1 | M0-1, M0-2, M0-4, M0-9, M0-8(최소) | `npm ci` → `npm run lint`(현행 tsc) → `npm run build` → 비밀값 문자열 검사 | 소유자 TBD-014(필수 검사 `ci`) |
| PR2 | M0-3 | `npm run typecheck`(strict) | 이후 PR은 strict 타입 검사를 통과해야 병합 |
| PR3 | M0-5. 커밋 ① 설정 ② 전체 포맷(기계적) ③ 오류 정리. 범위는 코드 파일만, 예외 62건(TBD-018) | `biome check --error-on-warnings`(`npm run lint`에 포함) | |
| PR4 | M0-6. 순수 함수 6개 테스트(`sharedPlay`·`backupImport` 분기 100% 차단, `formatters`·`titleMatch`·`playShareText`·`koreanIndex` 포함). `storage.ts` 다계정 격리 단위 테스트는 가짜 IndexedDB 선정이 필요해 PR5 이후로 | `npm test` + 커버리지 기준(D-030) | |
| PR5 | M0-7 | `npm run test:e2e` | qa-evidence 스크립트 보관 사유 소멸 → README에 이전 완료 표시 |

- 완료 기준: main 브랜치 보호에서 `ci`가 필수 검사로 동작, `npm run lint`(strict 포함)·`test`·`test:e2e` 통과

### M1 측정

- 목적: 관문 판단 데이터 확보
- 작업: `src/services/analytics.ts`(허용 목록, ID 없으면 무동작), FR-MEAS-02 이벤트, Vercel Web Analytics
- 소유자: TBD-004(GA4 속성·측정 ID), TBD-006(실제 아이폰, 홈 화면 앱과 사파리 각각 7일 이상 미사용 후 데이터 남는지), TBD-005 고지 문구(측정 범위)
- 완료 기준: 프로덕션에서 `play_saved` 수신 확인, 요청에 이름·게임명 없음(FR-MEAS-03 완료 기준)

### 관문 (M1 배포 후 4주)

| 지표 | 클라우드 백업을 M2로 하는 조건(시작값, 근거 없음) | 출처 |
|---|---|---|
| `play_saved`를 보낸 사용자 | 30 이상 | GA4 |
| 그중 iOS + Safari 비율 | 30% 이상 | GA4 기본 차원(운영체제·브라우저) |
| TBD-006 | 7일 삭제가 실제 발생 | 소유자 실기기 |

- 셋 모두 충족 → M2 = 클라우드 백업
- 하나라도 미충족 → M2 = 게임 허브 또는 공유 링크 확산 개선(관문 시점에 질문으로 결정)
- 사용자 수가 너무 적어 판단 불가 → 확산(판매)을 우선하라는 신호로 해석
- 주의: GA4 사용자 수는 쿠키 기준이고, 사파리는 쿠키 수명을 제한할 수 있어(TBD-006) 아이폰 사용자가 중복 집계될 수 있다. 절대값보다 비율·추세로 본다
- 결과와 판단은 decision-log에 기록

### M2 후보

| 후보 | 범위 | 선행 조건 |
|---|---|---|
| 클라우드 백업 | 04-architecture 전체, ADR-002, FR-CLOUD-01~11 | TBD-007, 008, 013, 005 해결. 07 §5.4 공개 차단 조건 |
| 게임 허브 | FR-HUB, `hubKey.ts` | 없음 |
| 확산 개선 | 공유 링크 경로 개선 | 관문 데이터(`share_link_opened`→`share_link_added` 전환) |
