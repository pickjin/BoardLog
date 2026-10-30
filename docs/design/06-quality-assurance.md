# 06. Quality Assurance

상태: **확정(Accepted)**. 2026-10-30. D-029~D-031, 세부 배치(§3, §5)는 D-032 응답 시 이견 없음으로 확정.

## 1. 도구 (D-029)

| 계층 | 도구 | 버전(2026-10-30 npm) | 명령 |
|---|---|---|---|
| 단위·통합 | Vitest + @vitest/coverage-v8 | 5.0.5 | `npm test` |
| E2E | Playwright Test | 1.64.1 | `npm run test:e2e` |
| 서버 통합 | 로컬 Supabase(CLI + Docker) | TBD(구현 시 확인) | `npm run test:db` |

## 2. 병합 차단 기준 (D-030)

| 계층 | 기준 |
|---|---|
| 순수 함수 `src/utils/hubKey.ts`, `syncMerge.ts`, `sharedPlay.ts`, `backupImport.ts` | 분기 커버리지 100% |
| `storage.ts` id 접근 경로 | 경로마다 다계정 격리 테스트 1개 이상 |
| 클라우드 모듈 + Supabase RLS | 다른 사용자의 행·파일 읽기·쓰기 거부 테스트 |
| 화면 | 시나리오 S-01~S-06 E2E 통과 |
| 그 외 | 리포트만(차단 없음) |

## 3. 테스트 배치

| 위치 | 내용 |
|---|---|
| `src/**/*.test.ts` | 순수 함수 단위 테스트(대상 파일 옆) |
| `src/services/storage.test.ts` | IndexedDB 통합(가짜 IndexedDB 구현 사용, 구현 시 라이브러리 선정) |
| `supabase/tests/*.test.ts` | 로컬 Supabase 대상 RLS·Storage 정책 테스트 |
| `e2e/*.spec.ts` | Playwright Test. `vite preview` 빌드 결과 대상 |
| `supabase/migrations/*.sql` | 스키마·RLS 정의(D-031) |

## 4. 핵심 테스트 목록

### 4.1 단위 (분기 100%)

| 대상 | 반드시 포함할 경우 |
|---|---|
| `hubKey` | 시드 변형판 5쌍은 다른 키 / 공백·기호 차이는 같은 키 / 한글·영문명 연결 / 괄호 별칭 3건 / 시드 300개 키 충돌 0 |
| `syncMerge` | 한쪽에만 있음 / 같은 syncId 수정 시각 비교(양방향) / 삭제가 나중 / 수정이 나중(되살림) / 첫 합치기 내용 키 일치·불일치 / 이전 형식 데이터(syncId·updatedAtMs 없음) / 충돌 이벤트 1회 |
| `sharedPlay` | 정상 왕복 / 손상 링크 / 길이·참여자·이름 상한 / 무승부·참여 결과 / HTML 이름은 문자열 그대로 |
| `backupImport` | 화이트리스트 / `javascript:` 이미지 제거 / 잘못된 항목 수 / 이전 형식 파일 |

### 4.2 통합

| 대상 | 검증 |
|---|---|
| `storage.ts` | 계정 A의 id로 계정 B가 수정·삭제 시 거부, 복원 시 새 id, 삭제 표시 저장, DB 버전 1→2 이전 |
| Supabase RLS | B가 A의 `backups` 행 조회·수정 불가, A의 `play-thumbs/{A}/…` 접근 불가, 버전 조건부 업데이트 충돌 감지 |
| 계정 삭제 함수 | 토큰 없음 401, 다른 사용자 토큰으로 타인 삭제 불가, 정상 삭제 시 행·파일 0건 |

### 4.3 E2E (시나리오)

| 시나리오 | 출처 |
|---|---|
| S-01 기록·공유 | qa-evidence `verify-play-form`, `verify-share-import` 이전 |
| S-02 링크로 친구 추가 | qa-evidence `verify-share-link` 이전 |
| S-03 사진 등록 → 허브 | 신규. 사진 인식 API는 E2E에서 가짜 응답 사용(외부 서비스) |
| S-04 아이폰 사파리 게스트 → 로그인 권유 | 신규. 사용자 에이전트로 환경 흉내 |
| S-05 새 기기 복원 | 신규. 브라우저 컨텍스트 2개 + 로컬 Supabase |
| S-06 계정 삭제 | 신규 |
| 공통 | 예시 데이터 정리·PWA(`verify-sample-pwa` 이전) |

## 5. 자동 실행 (세부는 07 CI)

PR마다 실행 순서:
1. 타입 검사
2. Biome + 마이그레이션 금지 구문 검사(D-034)
3. 단위·통합
4. 로컬 Supabase 정책 테스트
5. 빌드
6. E2E

하나라도 실패하면 병합 불가(D-027).

## 6. 수동 점검 (자동화 불가)

| 항목 | 시점 |
|---|---|
| 카카오 로그인 실제 흐름 | 프로덕션 배포 후 공개 스위치를 켜기 전(D-032), 카카오 설정 변경 후 |
| 매직링크 메일 수신(스팸함 포함) | 프로덕션 배포 후 공개 스위치를 켜기 전, 메일 설정 변경 후 |
| 실제 아이폰 사파리 7일 저장 제한(TBD-006) | 클라우드 백업 출시 전 |
| 사진 인식(Gemini 실제 호출) | 출시 전 |
| Supabase 기본 백업 유무·보관 기간 확인(TBD-013, D-035) | 클라우드 백업 공개 전. **미확인이면 공개 금지** |
| 복구 시험 1회(07 §5.3) | 클라우드 백업 공개 전 |
