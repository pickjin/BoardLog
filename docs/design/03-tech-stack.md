# 03. Technology Stack

상태: PHASE 3 완료 (2026-10-30). ADR-001은 Proposed(TBD-013).
버전은 2026-10-30에 `package.json`과 설치된 패키지에서 확인한 값이다.

## 1. 확정 스택

| 영역 | 선택 | 버전(선언 / 설치 확인) | 근거 |
|---|---|---|---|
| 언어 | TypeScript | ~5.8.2 / 5.8.3 | 기존 |
| 프론트엔드 | React | ^19.0.1 / 19.2.8 | 기존 |
| 빌드 | Vite | ^6.2.3 / 6.4.3 | 기존 |
| 스타일 | Tailwind CSS | ^4.1.14 / 4.3.3 | 기존 |
| 아이콘·애니메이션 | lucide-react, motion | ^0.546.0 / 0.546.0, ^12.23.24 / 12.43.0 | 기존 |
| AI(사진 인식) | @google/genai (서버리스 함수에서만) | ^2.4.0 / 2.17.1 | 기존 |
| 서버 실행 | Vercel 서버리스 함수(`api/`) | Node 24.x (Vercel 프로젝트 설정) | 기존, D-020 |
| 백엔드 플랫폼 | Supabase (Postgres, Auth, Storage) | `@supabase/supabase-js` 2.118.0 (npm 최신, 2026-10-30) | D-019, ADR-001 (Proposed) |
| 데이터 접근 | 일반: 브라우저 → supabase-js + RLS / 관리자 작업: Vercel 함수 | — | D-020 |
| ORM | 사용 안 함 | — | D-020 |
| 분석 | GA4, Vercel Web Analytics(`@vercel/analytics` 2.0.1, npm 최신) | — | D-004, D-005 |
| 패키지 관리 | npm (`package-lock.json`, 설치는 `npm ci`) | npm 10.x | D-021 |
| Node | `engines.node = 24.x` | — | D-021 |

## 2. 데이터 접근 경로 (D-020)

| 작업 | 경로 | 권한 |
|---|---|---|
| 백업 올리기·받기, 사진 축소본 올리기·받기 | 브라우저 → Supabase(supabase-js) | 로그인 사용자 토큰. RLS가 본인 데이터만 허용 |
| 계정 삭제 | 브라우저 → Vercel 함수 `api/delete-account.ts` → Supabase 관리자 API | 함수가 요청자 토큰을 검증한 뒤 서비스 역할 키로 본인 계정만 삭제 |
| 사진 인식 | 브라우저 → Vercel 함수 `api/scan-games.ts` → Gemini | 기존 |

서비스 역할 키와 Gemini 키는 Vercel 환경변수에만 둔다. 클라이언트 번들에 들어가는 값은 Supabase URL, 공개(anon) 키, GA4 측정 ID뿐이다(NFR-03).

## 3. 번들 예산 (NFR-05)

| 항목 | gzip | 출처 |
|---|---|---|
| 현재 첫 화면 JS | 376.6KB | 2026-10-30 `npm run build` 실측 |
| 허용 증가분(+15%) | 약 56KB | NFR-05 |
| supabase-js 최소 사용 | +58.2KB | 실측(ADR-001) → **지연 로딩 필수** |

## 4. 버전 정책 (D-021)

- 잠금 파일(`package-lock.json`)을 반드시 커밋한다. 배포·CI 설치는 `npm ci`.
- `bun.lock`은 삭제한다.
- 새 의존성은 정확한 버전이 잠금 파일에 기록된 상태로만 추가한다.
- 메이저 버전 업그레이드는 별도 작업으로 하고, 결정 기록에 남긴다.

## 5. 정리 대상 (구현 단계 작업, Proposed)

| 항목 | 현황(코드 검색 결과) | 조치 |
|---|---|---|
| `express`, `dotenv`, `@types/express` | import 없음 | 제거 |
| `autoprefixer` | import 없음, PostCSS 설정 없음 | 제거 |
| `vite` | dependencies·devDependencies 중복 | devDependencies만 유지 |
| `@types/canvas-confetti` | 타입 정의가 dependencies에 있음 | devDependencies로 이동 |
| `@types/node` ^22 | `engines.node` 24.x와 불일치 | 24 계열로 정렬 |
| `clean` 스크립트 `rm -rf` | 윈도우 기본 명령창 비호환 가능성 | PHASE 5에서 처리 |
| `bun.lock` → `package-lock.json` | D-021 | 구현 첫 작업 |
