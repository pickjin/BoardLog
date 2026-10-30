# 04. Technical Architecture

상태: **확정(Accepted, D-024)**. 2026-10-30. Supabase 의존 부분은 TBD-013 결과에 따라 변경 가능.
근거: D-010, D-011, D-017, D-019~D-023, [ADR-001](./adr/ADR-001-backend-platform.md), [ADR-002](./adr/ADR-002-cross-device-merge.md)

## 1. 시스템 구성

```
[브라우저: React SPA (Vite 빌드)]
  ├─ IndexedDB (원본 저장소, 계정별 레코드)      ← storage.ts만 접근
  ├─ 클라우드 백업 모듈 (로그인 시에만 지연 로딩)
  │    └─ supabase-js ─────────────▶ [Supabase]
  │                                    ├─ Auth (카카오, 이메일 매직링크)
  │                                    ├─ Postgres: backups (RLS)
  │                                    └─ Storage: 사진 축소본 (경로 RLS)
  ├─ GA4 (측정 ID 있을 때만) / Vercel Web Analytics
  └─ fetch ──▶ [Vercel 서버리스 함수]
                 ├─ api/scan-games.ts ──▶ Gemini (기존)
                 └─ api/delete-account.ts ──▶ Supabase 관리자 API (신규)
```

원칙:
- 서버는 사본이다(D-011). 서버가 내려가도 기록 입력·조회는 동작한다.
- 관리자 권한 키는 `api/delete-account.ts`에만 있다(D-020, NFR-03).

## 2. 서버 데이터 스키마 (Supabase)

### 2.1 테이블 `public.backups`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `user_id` | uuid | PK, FK → `auth.users(id)` ON DELETE CASCADE | 소유자 |
| `version` | integer | NOT NULL, 기본 0 | 낙관적 동시성(ADR-002 §3) |
| `schema_version` | integer | NOT NULL | 백업 형식 버전 |
| `payload` | jsonb | NOT NULL | `{ games[], plays[], tombstones[] }`. 사진은 축소본 경로 참조만 |
| `active_since` | timestamptz | | 마지막 업로드 기기 정보(진단용, 선택) |
| `updated_at` | timestamptz | NOT NULL | 서버 기록 시각 |

RLS 정책:
- `SELECT`, `INSERT`, `UPDATE`: `user_id = auth.uid()`
- `DELETE`: 클라이언트 불허. 계정 삭제는 `ON DELETE CASCADE`로 처리

### 2.2 Storage 버킷 `play-thumbs` (비공개)

- 경로: `{user_id}/{play_syncId}/{photo_id}.jpg` (긴 변 400px, D-015)
- 정책: 경로의 첫 폴더가 `auth.uid()`와 같을 때만 읽기·쓰기
- 계정 삭제 시 `{user_id}/` 전체 삭제(`api/delete-account.ts`에서 수행)

### 2.3 크기 추정

| 항목 | 크기 |
|---|---|
| 기록 100건 payload | 약 100KB |
| 축소본 | 장당 약 20~40KB |

(모두 추정)

## 3. 기기 저장 구조 변경 (ADR-002)

| 대상 | 추가 |
|---|---|
| 게임, 기록 | `syncId`(UUID), `updatedAtMs`(number) |
| 새 IndexedDB 저장소 `tombstones` | `{ id, userId, syncId, kind, deletedAtMs }`, `userId` 인덱스 |
| DB 버전 | `DB_VERSION` 1 → 2, 업그레이드 시 기존 레코드에 `syncId`, `updatedAtMs` 부여 |

기존 원칙은 그대로 유지한다: id로 접근하는 모든 경로는 소유자를 확인한다(`idbReadOwned`).

## 4. 인증과 인가

| 항목 | 방식 |
|---|---|
| 로그인 | Supabase Auth. 카카오 OAuth, 이메일 매직링크(D-012) |
| 세션 | supabase-js 기본 세션 저장(브라우저). 사파리 저장 제한으로 세션이 지워지면 재로그인 후 복원 |
| 데이터 인가 | RLS(`auth.uid()`), Storage 경로 정책 |
| 관리자 작업 | `api/delete-account.ts`: `Authorization: Bearer <access_token>` 검증 → 토큰의 사용자만 삭제 |
| 게스트 | 서버 접근 없음 |
| 기존 로컬 계정 | 로그인 유지, 신규 가입 차단, "클라우드로 옮기기" = 로컬 데이터를 해당 클라우드 계정과 합치기(ADR-002 규칙) |

## 5. API 계약 (서버리스 함수)

### `POST /api/delete-account` (신규)

| 항목 | 내용 |
|---|---|
| 요청 헤더 | `Authorization: Bearer <Supabase access token>` |
| 요청 본문 | 없음 |
| 처리 | ① 토큰 검증 → 사용자 id 확인 ② Storage `play-thumbs/{user_id}/` 삭제 ③ 관리자 API로 사용자 삭제(`backups`는 CASCADE) |
| 200 | `{ deleted: true }` |
| 401 | 토큰 없음·만료·위조 |
| 405 | POST 외 메서드 |
| 502 | 공급자 오류. 원문은 로그에만 남기고 사용자에게는 분류된 메시지 |

### `POST /api/scan-games` (기존, 변경 없음)

## 6. 데이터 흐름

### 6.1 기록 저장 → 자동 백업 (D-017)

```
저장 → IndexedDB 기록(updatedAtMs 갱신) → [로그인 상태?]
  └─ 예: 5초 대기(추가 변경 시 연장) → 서버 백업·버전 받기 → 합치기(ADR-002)
        → 기기에 합친 결과 반영 → 조건부 업로드(version) → 새 사진 축소본 업로드
        → 상태 "완료" / 실패 시 "대기 중"(앱 열기·온라인 복구 시 재시도)
```

### 6.2 새 기기 로그인 (FR-CLOUD-04)

로그인 → 서버 백업 받기 → 기기 데이터와 합치기 → 기기 반영 → 업로드(6.1과 같은 경로)

### 6.3 계정 삭제 (FR-CLOUD-07)

확인 화면("기기 데이터는 남습니다") → `/api/delete-account` → 로그아웃 → 기기 데이터 유지

## 7. 모듈 구조

| 경로 | 책임 | 비고 |
|---|---|---|
| `src/services/storage.ts` | 기기 저장소 경계(기존). `syncId`·`updatedAtMs`·삭제 표시 관리 추가 | 기존 원칙 유지 |
| `src/utils/hubKey.ts` | 게임 허브 키 정규화(FR-HUB-01). 중복 판정에서도 사용 | 순수 함수 |
| `src/utils/syncMerge.ts` | 합치기 규칙(ADR-002 §2) | 순수 함수, 단위 테스트 대상 |
| `src/services/cloud/client.ts` | supabase-js 지연 로딩과 클라이언트 생성. Supabase 변수가 없으면 비활성(D-032) | 동적 `import()` |
| `src/services/cloud/backup.ts` | 받기·올리기·버전 재시도·축소본 업로드, 상태(완료·대기 중·실패) | `storage.ts` 경유로만 기기 데이터 접근 |
| `src/services/cloud/auth.ts` | 카카오·매직링크 로그인, 로그아웃, 계정 삭제 호출 | |
| `src/services/analytics.ts` | GA4·Vercel 이벤트 전송, 매개변수 허용 목록 검사(FR-MEAS-03). `backup_upload_result`, `app_error` 포함(D-036) | ID 없으면 무동작 |
| `src/utils/thumbnail.ts` | 400px 축소본 생성 | 기존 `imageCompressor` 재사용 |
| `api/delete-account.ts` | 계정 삭제(관리자 권한) | 서비스 역할 키 보유 유일 지점 |

## 8. 환경변수

| 이름 | 위치 | 용도 |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | 클라이언트(공개 가능) | Supabase 연결. RLS가 보호 |
| `VITE_GA_MEASUREMENT_ID` | 클라이언트 | GA4. 없으면 측정 안 함 |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel 서버 전용 | `api/delete-account.ts`만 사용 |
| `SUPABASE_URL` | Vercel 서버 | 위 함수용 |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Vercel 서버(기존) | 사진 인식 |
| `VITE_CLOUD_PUBLIC` | 클라이언트 | `true`일 때만 클라우드 기능을 모든 사용자에게 표시(D-032) |

### 8.1 환경별 배치 (D-032)

| 변수 | Production | Preview | Development(로컬) |
|---|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | 프로덕션 프로젝트 | **없음** | 로컬 Supabase(`supabase start` 출력값) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | 프로덕션 프로젝트 | **없음** | 로컬 Supabase |
| `VITE_CLOUD_PUBLIC` | 점검 전 `false`, 점검 후 `true` | 없음 | 선택 |
| `VITE_GA_MEASUREMENT_ID` | 있음 | 없음(미리보기 방문이 지표를 오염시키지 않도록) | 없음 |
| `GEMINI_API_KEY` | 있음 | 있음(기존) | 있음(기존) |

Supabase 변수가 없으면 클라우드 모듈은 로드되지 않고, 클라우드 관련 메뉴도 표시하지 않는다. 기기 기록 기능은 그대로 동작한다.

## 9. 미결

| ID | 내용 |
|---|---|
| TBD-013 | Supabase 확인 사항(ADR-001). 관리자 API 필요 여부 포함 |
