# 결정 기록 (Decision Log)

설계 질문(Question ID)에 대한 사용자 결정을 기록한다. 상태: Pending / Proposed / Accepted / Deferred / Superseded.
추측은 확정 사실로 기록하지 않으며, 확인되지 않은 내용은 TBD로 남긴다.

## 기존 전제 (설계 세션 이전에 이미 정해진 사항)

| ID | 내용 | 근거 |
|---|---|---|
| E-001 | ~~백엔드 없음. 모든 사용자 데이터는 브라우저 IndexedDB(대체: localStorage)에만 저장~~ **Superseded by D-010** | CLAUDE.md, 재방문 검증 전 비가역 투자 회피 |
| E-002 | ~~백엔드는 재방문이 검증된 뒤에만 도입. 검증 기준은 D-006~~ **Superseded by D-010** | CLAUDE.md, D-006 |
| E-003 | 1인 개발, 수익 없음 | 사용자 진술 |

## 결정 목록

| Decision ID | Question ID | 선택 | 상태 | 날짜 |
|---|---|---|---|---|
| D-001 | P1-Q01 | C. 플레이 기록과 컬렉션 관리를 동등한 두 축으로 | Accepted | 2026-10-30 |
| D-002 | P1-Q02 | A. 게임 중심 연결 (게임 상세 = 허브) | Accepted | 2026-10-30 |
| D-003 | P1-Q03 | B. 정규화한 게임 이름으로 기록을 묶어 허브 계산 | Accepted | 2026-10-30 |
| D-004 | P1-Q04 | B. Vercel Web Analytics (D-005 이후 방문 추세 용도로 범위 축소) | Accepted | 2026-10-30 |
| D-005 | P1-Q05 | C. 재방문 판정과 행동 이벤트는 GA4로 | Accepted | 2026-10-30 |
| D-006 | P1-Q06 | A. 28일 내 재기록 비율 ≥ 25%, 신규 50명 이상 | Accepted | 2026-10-30 |
| D-007 | P1-Q07 | A. 기존 기능 전부 유지 + 신규 3개, 기존 기능 확장 동결 (D-010으로 백엔드 범위 추가 예정) | Accepted | 2026-10-30 |
| D-008 | P2-Q01 | D. 공백·기호 제거 + 시드 한글명·영문명 연결로 게임 허브 키 정규화 | Accepted | 2026-10-30 |
| D-009 | P2-Q02 | C. GA4 이벤트: 판정 + 확산 + 기능별 사용 | Accepted | 2026-10-30 |
| D-010 | P2-Q03 | D. 백엔드(서버) 저장 도입 | Accepted | 2026-10-30 |
| D-011 | P2-Q04 | B. 로컬 우선 + 선택형 클라우드 백업(로그인 사용자만) | Accepted | 2026-10-30 |
| D-012 | P2-Q05 | C. 카카오 로그인 + 이메일 매직링크 | Accepted | 2026-10-30 |
| D-013 | P2-Q06 | B. 신규 로컬 회원가입 중단, 기존 로컬 계정은 유지 + 클라우드로 옮기기 권유 | Accepted | 2026-10-30 |
| D-014 | P2-Q07 | C. 위험도별 로그인 권유(아이폰 사파리 미설치는 첫 기록 후, 그 외 3회째) | Accepted | 2026-10-30 |
| D-015 | P2-Q08 | C. 서버 백업에 사진은 축소본(긴 변 400px)만 | Accepted | 2026-10-30 |
| D-016 | P2-Q09 | A. 계정 삭제 시 서버 데이터 즉시 영구 삭제(기기 사본 유지) | Accepted | 2026-10-30 |
| D-017 | P2-Q10 | D. 변경 시 묶어서 즉시 백업 + 실패 재시도 | Accepted | 2026-10-30 |
| D-018 | P2-Q11 | A. 요구사항 문서(02-requirements.md) 전체 승인 | Accepted | 2026-10-30 |
| D-019 | P3-Q01 | A. 백엔드 플랫폼 Supabase ([ADR-001](./adr/ADR-001-backend-platform.md)) | Proposed | 2026-10-30 |
| D-020 | P3-Q02 | C. 일반 백업은 브라우저 직접(RLS), 관리자 작업만 Vercel 함수. ORM 없음 | Accepted | 2026-10-30 |
| D-021 | P3-Q03 | B. npm 통일, package-lock 커밋, npm ci, engines.node 24.x | Accepted | 2026-10-30 |
| D-022 | P4-Q01 | C. 백업 묶음 + 올리기 전 합치기 + 삭제 표시 ([ADR-002](./adr/ADR-002-cross-device-merge.md)) | Accepted | 2026-10-30 |
| D-023 | P4-Q02 | A. 기록 단위 나중 수정 우선, 삭제·수정 겹침은 나중 시각 | Accepted | 2026-10-30 |
| D-024 | P4-Q03 | A. 아키텍처 초안(04-architecture.md)과 ADR-002 제안 항목 승인 | Accepted | 2026-10-30 |
| D-025 | P5-Q01 | C. React 타입 정의 + 엄격 모드, 검사 우회 금지 | Accepted | 2026-10-30 |
| D-026 | P5-Q02 | B. Biome(린트 + 포맷) | Accepted | 2026-10-30 |
| D-027 | P5-Q03 | C. PR + 자동 검사 필수 + main 보호, 커밋 메시지 규칙 | Accepted | 2026-10-30 |
| D-028 | P5-Q04 | A. 코딩 규칙·스크립트 정리 승인(05-engineering-standards.md) | Accepted | 2026-10-30 |
| D-029 | P6-Q01 | A. Vitest(단위·통합) + Playwright Test(E2E), PR마다 실행 | Accepted | 2026-10-30 |
| D-030 | P6-Q02 | B. 위험도별 커버리지 기준(순수 함수 분기 100%, 다계정·RLS 테스트, 시나리오 E2E) | Accepted | 2026-10-30 |
| D-031 | P6-Q03 | A. 로컬 Supabase(CLI + Docker)로 서버 테스트, 스키마는 마이그레이션 SQL | Accepted | 2026-10-30 |
| D-032 | P7-Q01 | B. Supabase는 프로덕션 1개, 미리보기 배포는 클라우드 기능 꺼짐 + 공개 스위치 | Accepted | 2026-10-30 |
| D-033 | P7-Q02 | A. GitHub Actions에서 PR마다 검사 6단계 전부 실행, 필수 검사 지정 | Accepted | 2026-10-30 |
| D-034 | P7-Q03 | A. 운영자가 병합 전 `supabase db push`로 수동 적용, 추가만 하는 변경으로 제한 | Accepted | 2026-10-30 |
| D-035 | P7-Q04 | C. 위험 작업 직전 수동 DB 덤프(암호화, 7일 보관) + Supabase 기본 백업 | Accepted | 2026-10-30 |
| D-036 | P7-Q05 | A. GA4로 백업 결과·오류 종류 집계, 주 1회 확인 + 연속 3회 실패 시 사용자에게 내보내기 권유 | Accepted | 2026-10-30 |
| D-037 | P7-Q06 | A. 비밀값 관리 초안 승인, `GEMINI_API_KEY`는 Preview에서 제거 | Accepted | 2026-10-30 |
| D-038 | P8-Q01 | B. AI는 명시적 지시가 있을 때만 PR·CI를 거쳐 병합, 되돌릴 수 없는 운영 작업은 사람만 | Accepted | 2026-10-30 |
| D-039 | P8-Q02 | B. `AGENTS.md`를 규칙 원본(150줄 이하), `CLAUDE.md`는 `@AGENTS.md` + Claude 전용 | Accepted | 2026-10-30 |
| D-040 | P8-Q03 | A. 변경 종류별 완료 증거, 증거 없으면 "미검증" 보고, 디자인 변경은 소유자 확인 | Accepted | 2026-10-30 |
| D-041 | P9-Q01 | C. M0 기반 정비 → M1 측정(+TBD-006 실기기 확인) → 4주 관문 → M2 결정 | Accepted | 2026-10-30 |
| D-042 | P9-Q02 | B. M0는 CI를 맨 앞에 둔 PR 5개, PR마다 검사 추가 | Accepted | 2026-10-30 |
| D-043 | P9-Q03 | C. 설계 종료, 작업 브랜치(문서 + 미배포 기능 3종) PR 병합 후 M0 PR1, 소유자는 TBD-006 시험 즉시 시작 | Accepted | 2026-10-30 |

### D-001 두 축 동등
- **Question:** P1-Q01 보드로그가 가장 먼저 해결해야 할 사람
- **Selected:** C. 플레이 기록(모임 기록 담당자)과 컬렉션 관리(개인 컬렉터)를 동등하게
- **Rationale:** 두 축 모두 구현된 기능이 있고 지금 어느 쪽도 버리지 않기로 함
- **Alternatives:** A 모임 기록 담당자(AI 권장안, 처음 선택 후 변경), B 개인 컬렉터, D 카페·동호회 운영자(B2B)
- **Consequence:** 요구사항과 지표를 두 축으로 정의. 두 축의 연결 방식이 중요해짐 → D-002
- **Impacted:** 01-product-discovery.md

### D-002 게임 중심 연결
- **Question:** P1-Q02 두 축을 무엇을 중심으로 연결할지
- **Selected:** A. 게임 상세 화면이 소장 정보, 플레이 이력, 승률, 함께한 사람의 허브
- **Rationale:** 기록은 이미 `gameId`로 게임과 연결되어 저장 구조 변경 없이 두 축이 서로를 채움
- **Alternatives:** B 사람 중심(사람 데이터 구조 신설 필요), C 시간 중심(이벤트 로그 신설 필요), D 연결 안 함
- **Impacted:** 01-product-discovery.md, (예정) 요구사항 문서

### D-003 이름 기준 허브
- **Question:** P1-Q03 소장하지 않은 게임의 기록을 어디에 모을지
- **Selected:** B. 정규화한 게임 이름으로 기록을 묶어 허브를 계산. 컬렉션은 소장 게임만, 게임 탭에 "기록만 있는 게임" 구역
- **Rationale:** 저장 구조 변경 없음(가역). 카페 게임이 컬렉션에 섞이지 않음. 구입 전후 기록과 공유 링크 기록이 같은 허브에 모임
- **Alternatives:** A 자동 추가 + '미소장' 상태 신설, C 허브 없음, D 기록마다 묻기
- **Open:** TBD-001, 정규화 규칙은 PHASE 2에서 확정
- **Impacted:** 01-product-discovery.md, (예정) 데이터 흐름 문서

### D-004 Vercel Web Analytics
- **Question:** P1-Q04 MVP 성공 판정 수단
- **Selected:** B. Vercel Web Analytics. D-005 이후 **방문 추세 확인용으로 범위 축소**
- **Rationale:** 이미 Vercel 사용 중, 쿠키 없음
- **Alternatives:** A GA4 + 인터뷰(AI 권장안), C 인터뷰만, D 직접 집계 서버
- **Confirmed (Vercel 문서):** 사용자 정의 이벤트(`track()`) 지원, 이벤트 이름·이벤트 데이터별 집계, 프로덕션만 집계, React 패키지 `@vercel/analytics/react`
- **Not confirmed:** 요금제별 사용자 정의 이벤트 가능 여부와 한도(TBD-002), 방문자 식별값 유지 기간(TBD-003). 문서의 집계 차원에 신규/재방문 구분이 없음

### D-005 GA4로 재방문 판정
- **Question:** P1-Q05 Vercel Web Analytics로 재방문을 어떻게 판정할지
- **Selected:** C. 재방문 판정과 행동 이벤트는 GA4를 추가로 사용
- **Rationale:** 백엔드 도입 판단에 정확한 재방문율(코호트)이 필요
- **Alternatives:** A 앱이 재방문 구간을 계산해 전송(AI 권장안), B 방문 추세 + 인터뷰, D 보류
- **Consequences:**
  - 개인정보 처리 고지 문구 필요(구글 쿠키 사용 명시)
  - 환경변수 `VITE_GA_MEASUREMENT_ID`. 값이 없으면 아무 데이터도 보내지 않음
  - 이벤트에 개인 정보(이름, 게임명, 장소) 미포함
  - GA4 속성 생성은 소유자 본인 작업(TBD-004)
  - 고지 문구의 법적 충분성 미확인(TBD-005)
  - TBD-002는 더 이상 구현을 막지 않음

### D-006 재방문 판정 기준
- **Question:** P1-Q06 "재방문 확인"의 정의와 기준
- **Selected:** A. 첫 방문 후 **28일 안에 다시 와서 기록을 1회 이상 남긴 비율 ≥ 25%**, 신규 사용자 **50명 이상**에서 판정
- **Rationale:** "다시 열기"가 아닌 "다시 기록"으로 정의해 공유 링크 구경을 제외. 28일은 격주~월 단위 모임 주기를 한 번 포함(가정)
- **Known limits:** 25%는 가정값(비교 데이터 없음). 50명 기준 95% 신뢰 오차 ±11%p(계산값)
- **역할 변경(D-010):** 백엔드 도입 관문이 아니라 MVP 성공 기준으로만 사용
- **판정 후 행동:**

  | 결과 | 행동 |
  |---|---|
  | ≥ 25% | MVP 가설 유지, 다음 기능 확장 검토 (기존 "백엔드 설계 시작"은 D-010으로 삭제) |
  | 10~25% | 지인 인터뷰로 이탈 이유 확인 후 재측정 |
  | < 10% | "플레이 직후 기록" 전제 재검토 (10%는 가정 보조 기준) |

### D-007 MVP 범위
- **Question:** P1-Q07 MVP에 넣을 것과 동결·제외할 것
- **Selected:** A. 기존 기능 전부 유지 + 신규 3개(게임 허브, 측정, 개인정보 고지). 기존 기능은 확장 동결
- **Rationale:** 기능별 사용 근거가 없는 상태에서 제거는 추측. 측정 후 숫자로 정리. D-001과 일관
- **Alternatives:** B 근거 약한 기능 숨김, C 축소 MVP, D 측정 먼저·허브 보류
- **Note:** "측정 먼저" 순서는 PHASE 9 작업 순서에서 반영

### D-008 게임 허브 키 정규화
- **Question:** P2-Q01 "같은 게임" 판정 규칙
- **Selected:** D. 공백·기호를 제거한 뒤 비교하고, 시드 DB의 한글명과 영문명을 같은 게임으로 연결
- **Verification (실측):** 시드 300개 전수 검사, 정규화 키 충돌 0건
- **Sub-rule (Accepted, 이견 없음):** 괄호 앞부분과 괄호 안부분을 각각 별칭으로 등록(디아망, 아캄 호러 (3판), 갠츠쇤클레버). 콜론으로 이어진 이름은 별개 게임으로 유지(예: 아줄 / 아줄: 서머 파빌리온)
- **Consequences:** 백업 복원과 공유 링크의 중복 판정도 같은 키 함수로 통일(띄어쓰기만 다른 이름도 중복으로 판정). 시드 변형판 5쌍과 괄호 항목 3개를 단위 테스트로 고정
- **Limits:** 언어 연결은 시드 DB 게임에만 적용. 시드 영문명 정확도는 추정치 포함
- **Alternatives:** A 공백 제거·소문자, B 공백·기호 제거(AI 권장안), C 유사도 매칭

### D-009 측정 이벤트
- **Question:** P2-Q02 GA4로 측정할 행동
- **Selected:** C. `play_saved`, `share_sheet_opened`, `share_link_opened`, `share_link_added`, `game_added`(method: manual/seed/scan), `game_hub_viewed`, `catalog_exported`, `kakao_list_shared`, `backup_exported`, `backup_restored` + GA4 자동 수집
- **Privacy rule:** 이름, 게임명, 장소, 점수 미전송. 매개변수는 정해진 값 목록만
- **Rationale:** D-007 정리 판단과 D-001 두 축 비교의 근거
- **Alternatives:** A 판정 최소, B 판정+확산, D 자동 수집만

### D-010 백엔드 도입
- **Question:** P2-Q03 아이폰 사파리 7일 저장 제한 대응
- **Selected:** D. 백엔드(서버) 저장 도입
- **Rationale:** 브라우저 저장소 삭제로 기록이 사라질 위험을 근본적으로 해결
- **Alternatives:** A 안내만, B 홈 화면 설치 유도 + 영구 저장 요청(AI 권장안), C 판정에서만 보정
- **Reversibility:** 비가역. 서버에 저장된 개인 데이터는 보관·보안·삭제 의무와 운영비가 계속 따른다
- **Evidence gap:** 계기가 된 웹킷 정책(2020년 3월 발표: 7일간 방문이 없으면 스크립트 저장소 삭제 가능, 홈 화면 앱은 별도 기준, 스크립트 쿠키 7일 제한)이 최신 iOS에서 유지되는지 미확인(TBD-006)
- **Supersedes:** E-001, E-002
- **Modifies:** D-006(역할을 MVP 성공 기준으로 변경), D-007(백엔드를 MVP 범위로 이동, 범위는 후속 질문)
- **New obligations:** 기록에 포함된 제3자(함께한 친구) 이름의 서버 저장 → 처리 근거·보관 기간·삭제 절차 필요(TBD-005 확대), 운영비 산정(PHASE 3)

### D-011 클라우드 백업 범위
- **Question:** P2-Q04 서버에 무엇을, 누구의 것을 저장할지
- **Selected:** B. 기본 저장소는 기기(IndexedDB) 유지. 로그인한 사용자만 서버에 자동 백업·복원. 기기 간 실시간 동기화 없음
- **Rationale:** D-010 목적(소실 방지)을 최소 범위로 달성. 게스트·공유 링크 흐름 유지. 서버는 사본이라 되돌리기 비용 최소. 기존 백업·복원 로직(id 재발급, 중복 판정, 필드 화이트리스트) 재사용
- **Alternatives:** A 전면 서버 + 동기화, C 익명 기기 백업 + 복구 코드, D 보류
- **Limit:** 게스트로만 쓰는 아이폰 사파리 사용자는 위험 잔존 → D-014로 보완

### D-012 로그인 방식
- **Question:** P2-Q05 클라우드 백업용 로그인 방식
- **Selected:** C. 카카오 로그인 + 이메일 매직링크
- **Rationale:** 한국 사용자 대상 최단 경로(카카오, 가정)와 대체 수단. 비밀번호를 서버에 보관하지 않음
- **Alternatives:** A 카카오만, B 구글만, D 이메일+비밀번호 서버 이전
- **Owner tasks:** 카카오 개발자 앱 등록·검수(TBD-007), 메일 발신 도메인(TBD-008)
- **Verify in PHASE 3:** 서버 서비스의 카카오 로그인 지원 여부, 이메일 없이 회원 식별만 받을 때 카카오 사업자 인증 필요 여부

### D-013 기존 로컬 계정
- **Question:** P2-Q06 브라우저 안 이메일+비밀번호 계정 처리
- **Selected:** B. 신규 로컬 회원가입 중단. 기존 로컬 계정 로그인은 유지하고 "클라우드로 옮기기" 권유(D-011 백업 기능 재사용)
- **Rationale:** 데이터 병합·삭제 같은 비가역 작업 없음. 새 사용자에게 로그인 개념은 하나
- **Alternatives:** A 기기 내 프로필로 유지, C 즉시 폐지·게스트로 병합, D 공존
- **Open:** TBD-009 로컬 계정 코드 제거 시점

### D-014 로그인 권유 시점
- **Question:** P2-Q07 게스트에게 클라우드 로그인을 언제 권할지
- **Selected:** C. 아이폰 사파리에서 설치하지 않고 쓰는 사용자는 첫 기록 후, 그 외는 기록 3회째
- **Common rules (Accepted, 이견 없음):** 공유 시트를 닫은 뒤 표시. 닫으면 기록 5회마다 재권유, 최대 3회. D-009에 `backup_prompt_shown`(위험군/일반), `backup_login_completed` 추가
- **Assumptions:** 1회·3회·5회·최대 3회는 가정값. 이벤트로 효과 확인 후 조정
- **Alternatives:** A 첫 기록 후 전원, B 3회째 전원, D 권유 안 함

### D-015 사진 백업
- **Question:** P2-Q08 서버 백업에 포함할 데이터
- **Selected:** C. 게임·기록·이름·점수 + 사진은 축소본(긴 변 400px)만
- **Facts (코드):** 기기 저장 사진은 긴 변 1600px, JPEG 0.7, 장당 최대 2MB, 기록당 최대 6장
- **Estimates:** 텍스트 기록 1건 약 1KB, 원본 사진 1장 약 200~400KB, 축소본 1장 약 20~40KB
- **Consequences:** 파일 저장소 필요. 축소본 생성 작업. 친구 얼굴이 담긴 사진의 서버 보관 → 개인정보 고지에 사진 항목 포함(TBD-005). 백업 화면에 "사진은 작은 크기로만 백업" 안내
- **Proposed:** D-009에 `play_photo_added`(첨부 수만) 추가
- **Alternatives:** A 원본 전부, B 사진 제외(AI 권장안), D 사용자 선택

### D-016 서버 데이터 삭제
- **Question:** P2-Q09 서버 데이터를 언제, 어떻게 지울지
- **Selected:** A. 계정 삭제 시 서버의 기록·게임·사진 축소본을 즉시 영구 삭제. 기기 데이터는 유지
- **Rationale:** 서버가 사본(D-011)이라 유예의 가치가 작음. 삭제 요청에 즉시 응함. 작업량 최소
- **Alternatives:** B +1년 미사용 자동 삭제, C 30일 유예, D +서버 백업만 지우기
- **Open:** TBD-010, TBD-011

### D-017 자동 백업 시점
- **Question:** P2-Q10 로그인 사용자 데이터를 언제 서버에 백업할지
- **Selected:** D. 저장 후 몇 초간 묶어서 즉시 전송, 실패 시 "대기 중" → 앱 열기·연결 복구 시 재시도. 상태 3종(완료·대기 중·실패)
- **Rationale:** 기록 직후 미백업 구간 제거, FR-CLOUD-09 충족
- **Alternatives:** A 즉시(재시도 없음), B 앱 열 때 + 하루 1회, C 수동
- **Resolves:** TBD-012

### D-018 요구사항 기준선
- **Question:** P2-Q11 02-requirements.md 승인
- **Selected:** A. 전체 승인(NFR-05 번들 +15% 이내, NFR-06 지원 환경, NFR-07 두 번째 기록 30초 이내 포함)

### D-019 백엔드 플랫폼
- **Question:** P3-Q01 클라우드 백업 서버(인증 + DB + 파일)
- **Selected:** A. Supabase. 상세는 ADR-001
- **Conditions:** SDK 지연 로딩, TBD-013 확인 후 Accepted
- **Alternatives:** B Firebase, C Vercel 조합 + Auth.js, D 직접 서버

### D-020 데이터 접근 방식
- **Question:** P3-Q02 앱이 Supabase에 접근하는 경로
- **Selected:** C. 백업·복원·사진 축소본은 브라우저에서 supabase-js로 직접(RLS가 격리 강제). 계정 삭제처럼 관리자 권한이 필요한 작업만 Vercel 서버리스 함수. ORM 없음
- **Rules:** 서비스 역할 키는 서버 함수에만. 서버 함수는 요청자 토큰을 검증해 본인 계정만 처리
- **Pending:** 계정 삭제에 관리자 권한이 필요한지 확인(TBD-013)
- **Alternatives:** A 전부 직접, B 전부 서버 함수 + ORM, D Supabase Edge Functions

### D-021 패키지 관리와 버전 정책
- **Question:** P3-Q03 패키지 관리자와 버전 고정
- **Selected:** B. npm 통일. `bun.lock` 삭제, `package-lock.json` 커밋, 설치는 `npm ci`, `engines.node = 24.x`
- **Rationale:** 로컬 작업 도구(npm)와 배포 설치 도구를 일치시켜 버전 차이 제거
- **Timing:** 잠금 파일 전환은 구현 단계 첫 작업
- **Alternatives:** A bun, C pnpm, D 현 상태 유지

### D-022 기기 간 백업 충돌 방지
- **Question:** P4-Q01 두 기기의 백업이 서로 덮어쓰는 문제
- **Selected:** C. 백업 묶음 + 올리기 전 합치기 + 삭제 표시. 상세는 ADR-002
- **Required structure change (기존 "저장 구조 무변경" 원칙의 첫 예외):** 게임·기록에 `syncId`(UUID), `updatedAtMs` 추가, 삭제 표시 저장소 신설, 서버 버전 확인
- **Alternatives:** A 마지막 백업 우선, B 백업 기기 한 대 규칙(AI 권장안), D 기록 단위 서버 저장

### D-023 같은 기록 동시 수정
- **Question:** P4-Q02 두 기기에서 같은 기록을 고쳤을 때
- **Selected:** A. `updatedAtMs`가 큰 쪽 우선. 삭제와 수정이 겹치면 나중 시각을 따름
- **Monitoring:** `backup_merge_conflict` 이벤트, 잦으면 칸 단위 합치기 재검토
- **Alternatives:** B 칸 단위, C 둘 다 보존, D 서버 우선

### D-025 타입 검사
- **Selected:** C. `@types/react`, `@types/react-dom` 추가 + `strict: true`. 검사 우회 주석 금지
- **Measured:** React 타입이 없어 화면 코드가 사실상 미검사 상태였음. 추가 시 엄격 모드 오류 4건, 타입 없이 엄격 모드 2,495건. **정정(2026-10-30, M0 PR2):** 4건은 "전부 실제 버그"로 기록했으나 수정 시 확인해 보니 동작 차이 없는 타입 불일치(존재하지 않는 prop, 도달 불가능한 값)였음. 결정 자체(React 타입 + strict)는 유효: 이후 실제 버그를 막는 장치
- **Alternatives:** A 현 상태, B 타입만, D 일부 엄격 옵션

### D-026 린트·포맷
- **Selected:** B. Biome 2.6.4
- **Measured:** 오류 74, 경고 117, 정보 4. 훅 의존성 누락 3건, 쓰지 않는 코드 18건
- **Rules:** 현재 스타일에 맞춘 포맷 설정, 전체 포맷 별도 커밋, 위반 시 실패, 예외는 위치별 + 사유
- **Result (M0 PR3, 2026-10-30):** 적용 범위는 코드 파일만(`src`, `api`, `scripts`, `vite.config.ts`; Markdown·CSS 제외). 오류 114·경고 117 → 0. 자동 수정(import 타입 분리, 미사용 import, 템플릿 문자열 등), 수동 수정(`isNaN`→`Number.isNaN` 9곳은 모두 숫자 입력이라 동작 동일, `forEach` 콜백 중괄호 12, 미사용 변수·상태 제거 등), 위치별 예외 62건(접근성 54 → TBD-018, 훅 의존성 트리거 3, 정적 목록 index key 5). `npm run lint`는 경고도 실패 처리(`--error-on-warnings`)
- **Alternatives:** A ESLint + Prettier, C 포매터만, D 도입 안 함

### D-027 Git 정책
- **Selected:** C. 작업 브랜치 → PR → 자동 검사 통과 필수 → main 병합, main 브랜치 보호
- **Commit rules:** `종류: 설명`, 기계적 변경 분리
- **Owner task:** TBD-014
- **Alternatives:** A main 직접, B 현행(PR 없음), D +릴리스 태그

### D-032 미리보기 배포와 Supabase 분리
- **Question:** P7-Q01 미리보기 배포가 연결할 Supabase
- **Selected:** B. Supabase 프로젝트는 프로덕션 1개. Preview·Development 환경에는 Supabase 변수를 넣지 않아 클라우드 기능이 꺼진 채 배포
- **Rationale:** 검증 안 된 코드가 실사용자 백업에 쓰는 것은 되돌릴 수 없음(C 배제). 매출 0에서 운영 대상 2배(A)·유료 기능(D)은 근거 없는 지출. RLS·합치기·계정 삭제는 로컬 Supabase(D-031)가 PR마다 검증
- **Consequences:** 공개 스위치 `VITE_CLOUD_PUBLIC`(빌드 시 주입, 변경 시 재배포). 스위치 꺼진 프로덕션에서 운영자가 카카오·매직링크 확인 후 공개. 리디렉션 URL은 프로덕션 도메인만
- **Revisit:** PR이 잦아져 프로덕션 확인이 병목이 되면 A로 전환(가역)
- **Alternatives:** A 프로젝트 2개, C 미리보기도 프로덕션 연결, D Supabase 브랜칭

### D-033 CI 실행 위치와 범위
- **Question:** P7-Q02 PR 검사 6단계를 어디서, 어떤 범위로
- **Selected:** A. GitHub Actions, PR마다 전체(타입·Biome·단위통합·로컬 Supabase·빌드·E2E). main 브랜치 보호의 필수 검사로 지정
- **Rationale:** 경로 필터(B)가 놓치는 것은 데이터 노출 결함(비가역), 아끼는 것은 PR당 몇 분(가역). C는 D-031, D는 D-027과 충돌
- **Cost control:** 의존성·Docker 이미지 캐시, 같은 PR 새 푸시 시 이전 실행 취소
- **Revisit:** 월 사용 시간이 무료 한도의 70% 초과 시 B 전환(가역). 실행 시간·월 사용량은 구현 시 실측
- **Alternatives:** B 경로별 선택 실행, C Vercel 빌드 안에서, D 로컬 hook만

### D-034 프로덕션 DB 스키마 변경 절차
- **Question:** P7-Q03 마이그레이션을 프로덕션에 적용하는 방법
- **Selected:** A. 운영자가 PR 병합 **전에** `supabase db push`로 직접 적용. 추가만 하는 변경(컬럼·테이블·정책·인덱스 추가)만 허용
- **Rationale:** 삭제·이름 변경은 사용자 백업 손실로 이어질 수 있음(비가역). 추가만 하면 옛 앱과 새 앱이 모두 동작해 배포 순서 문제가 없어짐. 프로덕션 DB 권한을 GitHub에 두지 않음(D-033 원칙). 변경 빈도는 연 수 회 이하로 추정
- **Safeguards:** CI가 마이그레이션의 `DROP`, `RENAME`, `ALTER ... TYPE` 구문을 차단. PR 템플릿 점검 항목. 삭제가 필요하면 2단계(앱에서 사용 중단 배포 → 다음 PR에서 삭제, 해당 PR에서만 사유와 함께 차단 해제)
- **Residual risk:** 적용을 잊고 병합하면 새 앱의 백업이 실패. FR-CLOUD-09에 따라 기기 기록은 유지되고 백업은 "대기 중"
- **Alternatives:** B 병합 시 Actions 자동 적용, C Supabase GitHub 연동(TBD-013), D 대시보드 SQL 편집기

### D-035 서버 데이터 백업·복구
- **Question:** P7-Q04 프로덕션 Supabase 데이터 손실·손상 시 복구
- **Selected:** C. 위험 작업(마이그레이션 적용, 대량 수정, 요금제·프로젝트 설정 변경) 직전 운영자 수동 `supabase db dump`. 운영자 PC에 암호화 보관, 7일 후 삭제. 그 외 사고는 Supabase 기본 백업
- **Rationale:** 손상 원인으로 운영자 변경이 가장 흔하다고 가정하고 그 순간을 덮음. 일일 자동 덤프(B)는 DB 권한을 CI에 두고, 삭제된 계정의 개인정보가 덤프에 쌓여 삭제 의무와 충돌
- **Launch blocker:** TBD-013에서 Supabase 기본 백업 유무·보관 기간 확인 전에는 클라우드 백업을 공개하지 않음. 없으면 이 결정 재검토(주 1회·30일 보관 축소형 B 또는 D)
- **Gap (명시):** 사진 축소본은 덤프 범위 밖. 아이폰에서 기기 데이터가 지워진 사용자는 원본 사진도 없으므로 Storage 손실 시 해당 사진은 복구 불가. 기록 데이터(DB)는 영향 없음
- **Alternatives:** A 기본 백업만, B 일일 자동 덤프, D 유료 시점 복구(PITR)

### D-036 장애 감지
- **Question:** P7-Q05 운영자가 백업의 조용한 실패를 알아차리는 방법
- **Selected:** A. GA4 이벤트 `backup_upload_result`(result 분류), `app_error`(종류만)로 집계. 운영자가 주 1회 확인. 보완: 앱이 백업 연속 3회 실패 시 사용자에게 파일 내보내기 권유(FR-CLOUD-11)
- **Rationale:** 새 도구·위탁처 0개. 주 1회 확인이면 아이폰 7일 제한 안에 발견. 운영자 발견 전의 공백은 사용자 알림으로 줄임
- **Thresholds (시작값, 근거 없음):** 주간 실패 비율 5% 초과, 또는 `auth`·`server` 실패 1건 이상이면 조사. 4주 실측 후 조정
- **Weakness:** 광고 차단기로 일부 이벤트 누락(비율 미확인) → 절대값이 아닌 추세로 판단. 오류 원문 없음 → 원인 분석은 재현에 의존
- **Revisit:** 재현 불가 오류가 반복되면 B(오류 추적 서비스) 재검토, 개인정보 필터·위탁처 고지 포함
- **Alternatives:** B 오류 추적 서비스, C 매일 자동 점검, D 사용자 신고만

### D-037 비밀값 관리
- **Question:** P7-Q06 비밀값 관리 초안 확정, 미리보기의 Gemini 키
- **Selected:** A. 07 §7 승인. `GEMINI_API_KEY`는 Production·Development에만. 미리보기의 사진 인식은 꺼지고, 앱 쪽 동작은 E2E 가짜 응답으로, 실제 호출은 출시 전 프로덕션 수동 점검으로 검증
- **Rationale:** D-032(미리보기는 외부 서비스 끔)와 같은 원칙. 공개 URL로 운영자 Gemini 사용량을 소모하는 경로 제거. 환경변수 삭제라 가역
- **Weakness:** `api/scan-games.ts` 수정 PR은 병합 후 프로덕션에서만 실제 동작 확인 가능. 잦아지면 B(배포 보호 + 키 유지) 재검토
- **Owner task:** TBD-016
- **Alternatives:** B 배포 보호 후 유지, C 현행 유지, D 초안 수정

### D-038 AI 에이전트 권한 경계
- **Question:** P8-Q01 AI 에이전트에게 허용할 작업 범위
- **Selected:** B. 작업 브랜치 커밋·푸시는 자유. `main` 병합은 소유자가 해당 세션에서 명시적으로 지시하고, PR + 필수 검사 `ci` 통과 + 충돌 없음일 때만, PR을 통해. 병합 전 3줄 보고(변경 요약 / 되돌릴 수 없는 영향 / CI 결과)
- **Forbidden for AI:** `main` 직접 푸시·강제 푸시·이력 재작성, 프로덕션 마이그레이션 적용, Vercel·Supabase·GitHub 설정과 환경변수 변경, 데이터·배포 삭제, 검사 우회, 비밀값 읽기·출력, 설계 문서에 없는 기능 선행 구현
- **Rationale:** 채팅 지시로 배포하는 실제 작업 방식을 D-027 안으로 들임. 프로덕션 권한은 운영자 PC에만(D-033~D-035)
- **Known violation (이전):** 이 세션 초반 "main에 머지해서 배포해줘"에 따라 `main`에 직접 푸시함. 이 결정 이후 금지
- **Weakness:** TBD-014 전까지는 규칙으로만 강제. 소유자가 PR을 읽지 않으면 사람 검토가 없음 → 3줄 보고로 완화
- **Alternatives:** A 병합은 항상 소유자, C 설정·마이그레이션까지 AI, D 제안만

### D-039 AI 규칙 파일 구조
- **Question:** P8-Q02 AI 규칙을 둘 파일
- **Selected:** B. 루트 `AGENTS.md`가 원본(명령, 불변 규칙, 권한 경계, 결정 변경 규칙, 설계 문서 링크). `CLAUDE.md`는 `@AGENTS.md` 가져오기 + Claude 전용(로컬 함수 실행, Vercel 정보, 현재 상태)
- **Rationale:** 금지 목록(D-038)이 도구와 무관하게 적용돼야 함. TBD-014 전에는 이 파일이 유일한 강제 수단. 원본 1개로 어긋남 방지
- **Limit:** `AGENTS.md` 150줄 이하(시작값, 근거 없음). 근거는 설계 문서 링크로
- **Update rule:** 규칙에 영향 주는 결정은 같은 PR에서 `AGENTS.md` 수정
- **Done at decision time:** 기존 CLAUDE.md 내용을 이전하며 Known state를 D-039 기준으로 갱신
- **Alternatives:** A CLAUDE.md만, C 두 파일 복사, D 링크만

### D-040 AI 작업 완료 증거
- **Question:** P8-Q03 AI가 "완료"라고 보고하기 위한 증거
- **Selected:** A. 존재하는 검사 전부 통과 + 변경 종류별 증거(08 §3). 증거를 만들 수 없는 항목은 "미검증"으로 명시. 화면 디자인 변경은 스크린샷 + 소유자 확인
- **Rationale:** 이 세션에서 검사 통과가 화면 코드를 사실상 검사하지 않던 사례(D-025. 드러난 4건은 나중에 동작 영향 없는 타입 불일치로 정정)와 종류별 Playwright 검증이 실제 결함을 잡은 사례(공유 링크 hashchange, 예시 데이터 배너)가 있음. 디자인은 테스트로 판정 불가(재디자인 되돌림 사례)
- **Interim:** Vitest·Playwright Test 도입 전에는 `docs/design/qa-evidence/` 방식 스크립트로 증거 대체
- **Cost (추정):** 작업당 +20~40% 시간
- **Alternatives:** B CI 통과만, C PR마다 소유자 미리보기 확인, D 규칙 없음

### D-041 구현 순서
- **Question:** P9-Q01 무엇부터 만들 것인가
- **Selected:** C. M0 기반 정비 → M1 측정(TBD-006 실기기 확인 병행) → 4주 관찰 관문 → 관문 결과로 M2(클라우드 백업 / 게임 허브 / 확산 개선) 결정
- **Rationale:** 사용자 수·재방문·확산 데이터 0, 백엔드 전제(TBD-006) 미확인. 측정은 작업 약 3개·비용 0, 클라우드는 15개 이상·외부 의존 3건. M0 없이는 D-033·D-038·D-040이 작동하지 않음
- **Gate (시작값, 근거 없음):** 4주간 `play_saved` 사용자 30 이상 AND iOS Safari 비율 30% 이상 AND 실기기에서 7일 삭제 확인 → 클라우드 우선. 판단 불가 시 확산 우선
- **Does not change:** D-010(백엔드 추가)은 유지. 순서만 정함
- **Risk accepted:** 클라우드 착수 최소 4주 지연, 그동안 아이폰 사용자 유실 가능성은 JSON 내보내기로만 대응
- **Alternatives:** A 문서 순서대로 전부, B 클라우드 우선, D M0 생략

### D-042 M0 순서와 PR 단위
- **Question:** P9-Q02 M0 작업 9개의 순서·PR 단위
- **Selected:** B. PR1(잠금 파일·의존성·스크립트·`.env.example`·최소 CI) → PR2(React 타입·strict·타입 오류 4건) → PR3(Biome: 설정 / 전체 포맷 / 오류 정리 3커밋) → PR4(Vitest) → PR5(Playwright Test). PR마다 해당 검사를 CI에 추가
- **Rationale:** 검사 없이 병합되는 PR 0개(PR1 제외). PR1 직후 TBD-014로 D-038 기술적 강제. 사용자 영향 있는 버그 수정을 앞에. 포맷을 테스트 추가 전에 해 충돌 방지
- **Constraint:** M0 기간에는 다른 기능 작업 병행 안 함(PR3 전체 포맷 충돌)
- **Alternatives:** A PR 1개, C CI 마지막, D 작업별 PR 9개

### D-043 설계 종료와 구현 시작
- **Question:** P9-Q03 설계 세션 종료 후 시작 순서
- **Selected:** C. 설계 세션 종료(= 구현 시작 명시). 작업 브랜치 전체(설계 문서, `AGENTS.md`, 미배포 기능 3종: 새 계정 빈 시작·예시 데이터 삭제, PWA, 공유 링크)를 PR로 병합 → M0 PR1. 소유자는 TBD-006 실기기 시험을 즉시 시작, TBD-004 GA4 속성을 M0 기간에 준비
- **D-038 exception (1회, 마지막):** CI가 없어 조건 2(`ci` 통과)를 충족할 수 없음. 대체 증거: `npm run lint`, `npm run build`, qa-evidence 4개 재실행(2026-10-30, 97/97 통과) + 병합 직전 3줄 보고. 병합은 소유자의 별도 명시 지시가 있어야 함. M0 PR1부터 예외 없음
- **Irreversible note:** 공유 링크(`#play=`) 형식은 배포 후 보낸 링크를 계속 읽어야 하는 호환 약속이 됨
- **Alternatives:** A 병합 후 PR1(소유자 작업 병행 없음), B 문서만 먼저, D 설계 계속

## 미결 항목 (TBD)

| ID | 내용 | 해결 조건 / 담당 |
|---|---|---|
| TBD-001 | 이름 표기가 달라 갈라진 게임 허브를 합치는 기능 | 실제 문제 보고 시 결정 |
| TBD-002 | Vercel 현재 요금제의 사용자 정의 이벤트 가능 여부·한도 | 소유자가 Vercel 대시보드 Analytics 탭 확인 (우선순위 낮음) |
| TBD-003 | Vercel Web Analytics 방문자 식별값 유지 기간 | 문서 확인 (우선순위 낮음) |
| TBD-004 | GA4 속성 생성, 측정 ID 발급 | 소유자 구글 계정으로 직접 |
| TBD-005 | 개인정보 고지 문구의 법적 충분성. D-010 이후 서버 저장(제3자 이름 포함)에 따른 처리방침·보관 기간·삭제 절차까지 확대. 운영 덤프 최대 7일 보관(D-035) 포함 | 확인 전까지 가정으로 표기 |
| TBD-007 | 카카오 개발자 앱 등록·검수, 회원 식별만 받을 때 사업자 인증 필요 여부 | 소유자 작업 + PHASE 3 확인 |
| TBD-008 | 매직링크 메일 발신 도메인·발송 서비스 | PHASE 3 |
| TBD-009 | 기존 로컬 계정 코드 제거 시점 | 클라우드 백업 출시 후 결정 |
| TBD-010 | 개인정보 유효기간제(1년 미이용 시 파기) 폐지 여부 | 법령 확인 후 미사용 자동 삭제 재검토 |
| TBD-011 | 기록 속 제3자(친구)의 삭제 요청 절차 | 고지에 문의처 표기, 절차는 추후 |
| TBD-012 | ~~클라우드 자동 백업 시점~~ 해결: D-017 | — |
| TBD-013 | Supabase 카카오 로그인 지원·요건, 무료 플랜 일시정지·한도, 유료 요금, 계정 삭제에 관리자 권한 필요 여부 (ADR-001, D-020) | 세션 네트워크에서 supabase.com 허용 또는 소유자 확인 |
| TBD-014 | ~~GitHub `main` 브랜치 보호~~ **해결 2026-10-30:** 저장소 ruleset `main-protection`(active, 기본 브랜치). 삭제 금지, 강제 푸시 금지, PR 필수(승인 0), 필수 검사 `ci`(GitHub Actions). 공개 API `/rules/branches/main`로 확인 | — |
| TBD-015 | ~~저장소 공개 여부, Actions 한도~~ **해결 2026-10-30:** 저장소는 Public. 브랜치 규칙 무료 적용 확인. Actions 표준 러너 한도는 공개 저장소 기준 무료(2026-06 지식, 요금 페이지 미확인). 코드·설계 문서가 공개 상태임을 소유자가 인지 | — |
| TBD-016 | Vercel Preview 환경에서 `GEMINI_API_KEY` 제거(D-037). 대상은 프로덕션 프로젝트 `board-log`(TBD-017) | 소유자 작업(Vercel 프로젝트 설정) |
| TBD-019 | **한 글자 시드 게임 제목 인식 불가**: 사진 인식 결과의 제목이 정규화 후 2글자 미만이면 시드 목록 매칭을 건너뜀(`findSeedMatch`의 `query.length < 2` 가드). 시드 300개 중 "뱅!", "라" 2개가 해당. 영문 제목(BANG!)으로 읽히면 매칭됨. M0 PR4 테스트가 발견, `it.fails`로 표시 | 동작 변경이라 M0 범위 밖. 사용자 영향이 작아 M1 이후 |
| TBD-018 | **접근성 정리 54건**: 입력과 연결되지 않은 label 36, 키보드 처리 없는 클릭 요소 16(`useKeyWithClickEvents` 8 + `noStaticElementInteractions` 8), `role="radio"` 버튼 1(`useSemanticElements`), autoFocus 1. M0 PR3에서 Biome 오류로 드러났고, UI 동작을 바꾸는 수정이라 위치별 `biome-ignore`(사유 `TBD-018`)로 표시만 함. `grep -rn "TBD-018" src`로 위치 확인 | M0 이후. 우선순위는 사용자 영향 데이터 후(M1 이후) 결정 |
| TBD-017 | 같은 저장소에 Vercel 프로젝트 2개 연결: 실제 서비스는 `board-log`(계정 `pickjin1`, `board-log.vercel.app`, 소유자 확인 2026-10-30). `boardlog`(팀 `wlstkden-6327s-projects`, `boardlog-blush.vercel.app`)는 미사용인데 푸시마다 빌드되고 `GEMINI_API_KEY`를 가질 수 있음 → 연결 해제 또는 삭제 여부 | 소유자 작업(Vercel 설정) |
| TBD-006 | 최신 iOS 사파리의 7일 저장 제한, 홈 화면 앱 예외, `navigator.storage.persist()` 효과, GA4 쿠키 유효기간 제한 | 실제 아이폰으로 확인. **M1 기간 소유자 작업, 관문 지표(D-041)** |
