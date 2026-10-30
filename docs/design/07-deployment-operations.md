# 07. Deployment & Operations

상태: **작성 중(Draft)**. 2026-10-30. PHASE 7 결정이 나올 때마다 채운다.

## 1. 배포 환경 (D-032)

| 환경 | 트리거 | Supabase | 클라우드 기능 |
|---|---|---|---|
| Production | `main` 병합 시 Vercel 자동 배포 | 프로덕션 프로젝트 | `VITE_CLOUD_PUBLIC=true`일 때만 공개 |
| Preview | PR마다 Vercel 자동 배포 | 연결 안 함 | 꺼짐 |
| Development | 로컬 `npm run dev` / `vercel dev` | 로컬 Supabase(D-031) | 켜짐 |

변수별 배치는 [04-architecture §8.1](./04-architecture.md).

## 2. 클라우드 기능 공개 절차 (D-032)

1. `VITE_CLOUD_PUBLIC=false`로 프로덕션 배포
2. 운영자가 점검 경로로 카카오 로그인, 매직링크 수신, 백업·복원, 계정 삭제를 직접 확인(06 §6)
3. 이상 없으면 `VITE_CLOUD_PUBLIC=true`로 바꾸고 재배포
4. 문제가 생기면 `false`로 되돌리고 재배포. 기기 기록에는 영향 없음

점검 경로의 형태는 구현 시 결정한다.

## 3. CI (D-033)

| 항목 | 내용 |
|---|---|
| 위치 | GitHub Actions, `.github/workflows/ci.yml` |
| 실행 시점 | PR 생성·갱신, `main` 푸시 |
| 작업 | 단일 작업 `ci`. 이 이름을 main 브랜치 보호의 필수 검사로 지정(TBD-014) |
| 단계 | ① `npm ci` ② `npm run typecheck` ③ `biome check` ④ `npm test`(단위·통합, 커버리지 기준 D-030) ⑤ `supabase start` → `npm run test:db` ⑥ `npm run build` ⑦ `npm run test:e2e` |
| 실패 | 어느 단계든 실패하면 병합 불가. 검사를 끄거나 건너뛰는 방식으로 통과시키지 않음(D-025, D-027) |
| 캐시 | npm 캐시, Playwright 브라우저, Supabase Docker 이미지 |
| 중복 실행 | 같은 PR에 새 푸시가 오면 이전 실행 취소(`concurrency`) |
| 비밀값 | 없음. 로컬 Supabase는 실행마다 생성되는 키 사용. 프로덕션 키를 CI에 두지 않음 |
| 측정 | 구현 직후 1회 실행 시간, 매월 사용 시간 확인. 무료 한도 70% 초과 시 경로별 실행으로 축소 검토 |

## 4. 비밀값·로그·모니터링·백업 복구

미정.
