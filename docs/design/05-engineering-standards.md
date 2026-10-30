# 05. Engineering Standards

상태: **초안(Proposed)**. 2026-10-30. 1~3절은 결정 확정(D-025~D-027), 4~5절은 승인 대기.

## 1. 타입 검사 (D-025)

- `@types/react`, `@types/react-dom`을 devDependencies에 추가하고 `tsconfig.json`에 `"strict": true`를 켠다.
- 실측(2026-10-30): React 타입 추가 시 엄격 모드 오류 4건, 모두 실제 버그
  - `App.tsx:755`, `766`: 삭제 확인창에 존재하지 않는 `confirmVariant` 전달 → 위험 동작 스타일 미적용
  - `App.tsx:647`: 탭 타입에 처리하지 않는 `'add_play'` 포함
  - `KakaoShareModal.tsx:533`: 인원 필터 값 타입 불일치
- **검사 우회 금지:** `@ts-ignore`, `@ts-nocheck`, `@ts-expect-error`(사유 없는 것), `as any`로 오류 숨기기 금지. 정말 필요하면 사유 주석과 함께 PR에서 승인받는다.
- 타입 검사 명령: `npm run typecheck` (`tsc --noEmit`)

## 2. 린트·포맷 (D-026)

- 도구: Biome(단일 설정 `biome.json`)
- 포맷: 작은따옴표, 2칸 들여쓰기, 현재 코드 스타일에 최대한 맞춤. 전체 포맷 변경은 별도 커밋 1회
- 실측(2026-10-30, 기본 권장 규칙): 오류 74, 경고 117, 정보 4. 정리 우선순위:
  1. 훅 의존성 누락 3건
  2. 쓰지 않는 import·변수 18건
  3. 나머지
- 의도된 예외(예: 인쇄용 CSS `!important`)는 규칙을 끄지 않고 해당 위치에 사유와 함께 개별 예외 처리
- 명령:
  - `npm run lint` = 타입 검사 + `biome check`
  - `npm run format` = `biome format --write`

## 3. Git 정책 (D-027)

| 항목 | 규칙 |
|---|---|
| 브랜치 | `main` = 프로덕션(자동 배포). 직접 푸시 금지(브랜치 보호, TBD-014) |
| 작업 단위 | 작업 브랜치 → PR → 자동 검사(타입, 린트, 테스트) 통과 → 병합 |
| PR | 변경 요약, 관련 요구사항 ID, 미리보기 배포 링크, 검증 결과를 적는다 |
| 커밋 메시지 | `종류: 설명`. 종류 = feat, fix, docs, refactor, test, chore, design, revert |
| 분리 | 포맷 일괄 변경, 의존성 정리, 잠금 파일 전환은 기능 변경과 다른 커밋 |
| 되돌리기 | 이력 재작성(force push, rebase) 대신 revert 커밋 |

## 4. 코딩 규칙 (Proposed, 현재 코드에서 지켜지고 있는 원칙을 정식화)

### 4.1 구조와 책임

| 규칙 | 근거 |
|---|---|
| 기기 데이터 읽기·쓰기는 `src/services/storage.ts`만 한다. 컴포넌트는 IndexedDB·localStorage에 직접 접근하지 않는다 | CLAUDE.md, NFR-01 |
| 서버 접근은 `src/services/cloud/`만 한다. 서버 모듈도 기기 데이터는 `storage.ts`를 거친다 | D-020, 04-architecture |
| id로 접근하는 모든 저장소 경로는 소유자를 확인한다(`idbReadOwned`). 검증은 다계정 테스트로 한다 | NFR-01 |
| 외부에서 온 데이터(공유 링크, 백업 파일, 서버 응답)는 정규화 함수(필드 화이트리스트, 크기 제한)를 거친 뒤에만 저장한다 | NFR-02 |
| 테스트할 규칙(허브 키, 합치기, 공유 링크 해석)은 React와 저장소에 의존하지 않는 순수 함수로 `src/utils/`에 둔다 | 04-architecture §7 |
| 컴포넌트 하나는 화면 하나 또는 역할 하나를 맡는다. 데이터 계산은 순수 함수로 빼낸다 | 단일 책임 |

### 4.2 이름과 파일

| 대상 | 규칙 | 예 |
|---|---|---|
| React 컴포넌트 파일 | PascalCase, `src/components/` | `SharedPlayModal.tsx` |
| 순수 함수 모듈 | camelCase, `src/utils/` | `hubKey.ts`, `syncMerge.ts` |
| 서비스 | camelCase, `src/services/` | `storage.ts`, `cloud/backup.ts` |
| 서버리스 함수 | kebab-case, `api/` | `delete-account.ts` |
| 상수 | UPPER_SNAKE_CASE, 파일 상단 | `MAX_BACKUP_BYTES` |
| 코드 식별자 | 영어 | |
| 화면 문구 | 한국어 | |

### 4.3 값과 설정

- 키·ID·URL은 환경변수로만 받는다(`VITE_` 접두어 = 클라이언트 공개, 그 외 = 서버 전용). 코드에 비밀값을 쓰지 않는다(NFR-03).
- 반복 사용하는 숫자(제한값, 대기 시간)는 이름 있는 상수로 둔다.

### 4.4 비동기와 오류

- 비동기 작업을 하는 화면은 로딩 상태와 오류 상태를 반드시 표시한다.
- 사용자에게는 분류된 한국어 메시지를 보여주고, 원문 오류는 콘솔·서버 로그에만 남긴다(기존 `classifyProviderError` 방식).
- 서버 실패가 기기 기록을 막지 않는다(FR-CLOUD-09).

### 4.5 화면

- 모든 `<img onError>`는 `applyImageFallback`을 쓴다. 원격 대체 이미지 금지(CLAUDE.md, 무한 요청 사고 이력)
- 버튼·입력에는 접근 가능한 이름을 준다(`aria-label` 또는 보이는 글자). 테스트 셀렉터로도 쓴다.
- 가짜 데이터(가짜 후기, 실제와 무관한 이미지를 실제처럼 표시)를 만들지 않는다.

### 4.6 주석

- 코드만으로 알 수 없는 이유(제약, 사고 이력, 의도된 예외)만 짧게 적는다. 무엇을 하는지는 이름으로 드러낸다.

## 5. 스크립트 정리 (Proposed)

| 스크립트 | 변경 |
|---|---|
| `typecheck` | 신규: `tsc --noEmit` |
| `lint` | `tsc --noEmit` → `npm run typecheck && biome check .` |
| `format` | 신규: `biome format --write .` |
| `test` | 신규(PHASE 6에서 확정) |
| `clean` | `rm -rf dist server.js`는 윈도우 기본 명령창에서 동작하지 않고, `server.js`는 존재하지 않는다 → Node 한 줄 명령으로 `dist`만 삭제하도록 교체 |
