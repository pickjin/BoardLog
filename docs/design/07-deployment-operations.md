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

## 3. CI

미정(P7-Q02).

## 4. 비밀값·로그·모니터링·백업 복구

미정.
