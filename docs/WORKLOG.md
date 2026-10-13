# 작업 로그

> 커밋/푸쉬/PR 요청 시 이 파일을 먼저 갱신한다 (`AGENTS.md` 참고).
> 새 작업 시작 시 **현재 상태 → 다음 작업**부터 이어서 진행한다.

## 현재 상태
- **단계**: Phase 2 — Supabase 연동 완료 (AI·앱·결제 제외 전 기능 동작), 가입·온보딩 UX 개선, 대시보드 캘린더
- **완료**: 인증/사무소(간단 가입·단계별 시작하기), 매물·사진·동영상·임장 기록, 문서 보관·수동 검토, 고객 브리핑 공유 링크, 고객·상담·후속 일정, 계약 준비(체크리스트·특약), 설정(사무소·구성원 초대·계정·구독 안내), 대시보드(일정 캘린더)
- **환경**: 원격 Supabase 프로젝트(`ocwvlgeasfkubzasjutx`, 서울) 연결, 마이그레이션 `20261013130000`까지 원격 적용. `.env.local`은 원격을 가리킴(로컬 Docker DB 미사용, `npm run db:types`도 `--linked`). 사무소 조회용 `DATA_GO_KR_SERVICE_KEY`(공공데이터포털 인증키, 서버 전용) 필요
- **다음 작업** (우선순위 순)
  0. `.env.local`에 `DATA_GO_KR_SERVICE_KEY` 넣고 `/office/register`에서 실제 조회·등록 확인 (API 응답 필드명·정확 일치 검색 여부 검증). 미등록 상태에서 매물·고객 2건째, 문서·계약 진입 시 모달/안내 동작 점검
  1. 원격에서 가입 → 시작하기 5단계 → 매물(사진·동영상) → 캘린더 일정 흐름 직접 점검 (원격은 이메일 인증이 켜져 있어 자동 E2E 미실행). 새 날짜 선택기(`components/form/date-picker.tsx`)는 브라우저 미확인 — 모든 날짜 입력 화면에서 확인·취소, 시간 선택, 폼 초기화 동작 점검
  2. 선택 입력 날짜(입주 희망일·계약일·잔금일·발급일)를 비우는 방법 필요 여부 결정 (현재 날짜 선택기에 확인·취소만 있음)
  2. 모바일 레이아웃 점검 — 특히 임장 기록·사진·동영상 업로드, 캘린더 (현장 사용)
  3. 공개 브리핑에 동영상 노출 (`get_briefing` RPC·Storage 공개 정책 확장)
  3. 목록 페이지네이션(현재 전체 조회), 비밀번호 재설정(이메일) 흐름
  4. 약관·처리방침의 사업자 정보(회사명, 보호책임자, 국외 이전 항목) 확정 후 반영
  5. 소셜 로그인(카카오·네이버·구글) — 현재 "서비스 준비중"
  6. AI 기능(임장 STT·정리, 문서 OCR·추출, 브리핑 작성, 상담 요약, 특약 추천) 및 결제 연동

## 로컬 개발
```bash
npm run dev        # .env.local = 원격 Supabase
npm run db:push    # 새 마이그레이션 원격 적용
npm run db:types   # 원격(--linked) 기준 lib/supabase/database.types.ts 재생성
```
- `.env.local`은 `.env.example`을 복사하고 원격 프로젝트 URL·publishable key를 넣는다.
- 로컬 Docker DB(`npm run db:start`/`db:reset`)는 선택 사항. 쓰려면 `.env.local`을 `npx supabase status` 값으로 바꾸고, 타입은 `supabase gen types typescript --local`로 생성한다.

## 원격 연결 방법
1. supabase.com에서 프로젝트 생성 → `npx supabase login` → `npx supabase link --project-ref <ref>`
2. `npm run db:push`로 마이그레이션 적용
3. 배포 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`
4. 대시보드 Auth 설정: Site URL, Redirect URL에 `<SITE_URL>/auth/confirm` 추가, 최소 비밀번호 8자. 이메일 인증을 켜면 가입 후 "메일 확인" 안내가 뜨고 링크가 `/auth/confirm`으로 돌아온다.

## 구조 메모
- `app/(auth)/` 로그인·회원가입 / `app/(app)/` 로그인 필요 화면 / `app/b/[token]` 공개 브리핑 / `app/auth/confirm` 이메일 인증 콜백
- `proxy.ts` + `lib/supabase/proxy.ts` 세션 갱신·보호 경로 리다이렉트
- `lib/auth.ts` `getSession()` / `lib/queries.ts` 공통 조회 / `lib/actions/*` 서버 액션
- `lib/storage.ts` signed URL, `lib/upload-client.ts` 브라우저 직접 업로드
- `lib/constants.ts` enum·프리셋(문서 항목, 계약 체크리스트, 플랜) / `lib/clauses.ts` 특약 예시 문구
- `components/coming-soon.tsx` 서비스 준비중 표시 / `components/tasks/task-board.tsx` 할 일 / `components/briefing-view.tsx` 브리핑 화면(미리보기·공개 공용)
- 브랜드 컬러 `--primary` (oklch 0.52 0.19 262), 토큰 `--success`, `--warning` / 폰트 Noto Sans KR

## 기록

### 2026-10-13 — 매물 연락처·금액/면적 입력, 관리비 항목, 파비콘, 사무소 등록 제한·공공데이터 조회
**작업 요약**
- 매물 관계자 연락처: 임대인·관리인·세입자 전화번호(이름 없음). 매물 상세 "관계자 연락처" 카드(`tel:` 링크), 공개 브리핑에는 미노출
- 전화번호 입력 자동 포맷(010-0000-0000, 02·1588 대응) — `components/ui/input.tsx`의 `type="tel"` 공통 처리
- 금액 입력: 콤마 포맷 + 입력칸 끝에 한글 금액(만원 단위, 10,000 → 일억원). 면적 입력: 끝에 평수(소수 둘째 자리) — `components/form/number-input.tsx`(`MoneyInput`, `AreaInput`)
- 관리비: 있음/없음 드롭다운, 있음이면 금액 + 포함 항목 체크박스 복수 선택(전기·수도·가스·인터넷·TV·주차·공용관리비·직접 입력). 상세·브리핑에 "25만원 (전기·수도 포함)" 형식 표시
- "거래 시작" → "계약 시작" 명칭 변경
- 체크박스 선택 시 레이아웃 흔들림 수정(숨김 input이 `space-y` 마지막 자식이 되던 문제), 드롭다운 팝업이 항상 버튼 아래에 열리도록(`alignItemWithTrigger=false`)
- 파비콘: lucide house 아이콘(`app/icon.svg`, `app/apple-icon.tsx`), 기존 `favicon.ico` 제거
- 대시보드 첫 통계 "광고 중 매물" → "등록 매물"
- **사무소 등록 제한**: 미등록 사무소는 매물·고객 1건까지, 문서·계약 등록 불가. DB 트리거(`enforce_office_registration`)로 강제하고, 화면에서는 진입 버튼에 확인 모달(취소 / 등록하기 → `/office/register?next=…`), 직접 URL 진입 시 안내 카드
- **사무소 조회·등록** `/office/register`: 공공데이터포털 「전국공인중개사사무소표준데이터」 API로 사무소명·개설등록번호·대표자명 조회 → "이 사무소로 등록" 시 서버에서 등록번호로 재조회해 확인된 값으로 저장(대표만). 설정 사무소 탭에 등록 상태 표시, 등록 후 등록번호·대표자는 읽기 전용

**변경 파일/화면**
- 화면: `/properties/new`·`edit`·`[id]`, 공개 브리핑, `/customers`, `/customers/new`·`[id]`, `/contracts`, `/contracts/new`, `/documents`, `/dashboard`, `/settings`(사무소), `/office/register`(신규)
- 마이그레이션(원격 적용·타입 재생성): `20261013100000_property_contacts`, `20261013110000_drop_property_contact_names`, `20261013120000_maintenance_items`(`get_briefing` 재정의), `20261013130000_office_registration`(`offices.registered_at`, `registry_data`, 등록 제한 트리거)
- 신규: `lib/office-registry.ts`(API 클라이언트, server-only), `lib/actions/office.ts`, `lib/office-gate.ts`, `components/office-gate.tsx`(`GatedLink`, `OfficeRequiredDialog`, `OfficeRequiredNotice`), `components/form/number-input.tsx`, `lib/money.ts`, `lib/phone.ts`, `app/(app)/properties/maintenance-field.tsx`
- 수정: `lib/actions/properties.ts`, `lib/actions/settings.ts`(등록 후 등록번호·대표자 덮어쓰기 금지), `lib/format.ts`(`formatMaintenance`), `lib/constants.ts`, `components/ui/select.tsx`, `proxy.ts`(matcher에 `apple-icon` 제외), `.env.example`(`DATA_GO_KR_SERVICE_KEY`)

**결정 사항**
- 사무소 정보 출처는 data.go.kr 표준데이터 API(VWorld는 도메인 등록 필요·명세 불명확으로 보류). 인증키는 서버 전용 환경변수
- 제한 규칙은 UI가 아니라 DB 트리거가 기준(`lib/office-gate.ts`는 같은 규칙을 화면 표시용으로 계산)
- 자격·대표자 인증은 추후 개발("준비중" 표시)

**남은 TODO**
- 실제 인증키로 API 조회 검증
- 현재 offices UPDATE RLS상 대표가 `registered_at`을 직접 설정할 수 있음 → 인증 기능 개발 시 등록 처리를 security definer RPC로 옮기고 컬럼 직접 수정 차단
- 기존 사무소는 모두 미등록 상태라 매물·고객이 이미 있으면 추가 등록이 막힘(사무소 등록 필요)

### 2026-10-12 — 임장 현장 정보 반영, 페이지별 검색, 고객 상태, 날짜 선택기
**작업 요약**
- 임장 기록 현장 정보: 항목은 드롭다운(목록 + 직접 입력), 내용은 항목별 예시 placeholder가 있는 텍스트 입력. 출처·메모 칸 제거. 저장 시 방향·입주 가능일(날짜 또는 "협의")을 매물 정보에 반영 — 기존엔 임장 기록에만 저장돼 매물 상세 방향이 "-"로 보였음
- 상단 검색창: 현재 페이지 목록만 검색(매물·고객·문서·계약 준비, `?q=`), 목록 없는 화면에서는 숨김
- 고객 상태: 연락 전 / 연락 완료 / 진행 중 / 관심 고객 / 계약 완료 / 중개 완료 / 종료 (보류 제거, 기본값 연락 전). 고객 목록 기본 필터 전체, 대시보드 "관리 중 고객"은 종료 계열 제외 집계
- 매물 등록·수정 폼 placeholder를 "예) …" 형식으로 통일
- 입주 가능일: 선택 안 함 / 협의 가능 / 날짜 선택(선택 시 날짜 선택기). `properties.available_negotiable` 추가, 상세·공개 브리핑에 "협의 가능" 표시
- outline 버튼 테두리 진하게(`border-foreground/20`, 그림자) — 배경과 구분
- 날짜 선택기 `components/form/date-picker.tsx`: 네이티브 date/datetime-local 대체, 달력 + (선택) 시·분·오전/오후, 확인·취소 버튼만. 제출 값 형식은 기존과 동일, 폼 reset 시 기본값 복원

**변경 파일/화면**
- 화면: `/properties/[id]/visit`, `/properties/new`·`edit`, `/properties/[id]`, `/customers`, `/customers/[id]`, `/documents`, `/documents/[id]`, `/contracts`, `/dashboard`, 공개 브리핑
- 마이그레이션: `20261012190000_customer_statuses`, `20261012200000_available_negotiable`(`get_briefing` 재정의 포함) — 원격 적용, 타입 재생성
- 공통: `components/layout/app-header.tsx`, `components/form/date-picker.tsx`, `components/ui/button.tsx`, `lib/constants.ts`(`VISIT_FIELD_PLACEHOLDERS`, `CUSTOMER_CLOSED_STATUSES`), `lib/format.ts`(`formatAvailableFrom`), `lib/actions/visits.ts`, `lib/actions/properties.ts`

**결정 사항**
- 방향·입주 가능일만 매물 컬럼과 동기화, 나머지 현장 정보는 임장 기록(최근 임장 정보)에만 보관
- 날짜 선택기에 "오늘"·"삭제" 없음(요청 사항)

**남은 TODO**
- 날짜 선택기 브라우저 점검, 선택 날짜 비우기 방법 결정

### 2026-10-12 — 간단 가입·단계별 시작하기, 매물 동영상, 대시보드 캘린더
**작업 요약**
- 회원가입 간소화: 이메일·비밀번호·필수 약관만 입력(선택 동의 제거), 비밀번호 확인칸·규칙 실시간 체크(8자 이상, 영문·숫자 포함), 비밀번호 보기/숨기기(`components/form/password-input.tsx`, 로그인·설정 공용), 인증 메일 발송 시 "회원가입 완료" 화면
- 가입 직후 `/onboarding`(이름·사무소명·휴대폰, 건너뛰기 가능, `profiles.onboarded_at`)
- 단계별 시작하기 `/setup?step=N`: 내 정보 → 사무소 정보 → 첫 매물 → 고객 브리핑 → 구성원 초대(대표 5단계, 구성원 3단계). 순서대로만 진행, 이전 버튼으로 재입력, 대시보드에는 현재 단계 하나만 안내. 완료 후 `/setup`은 마이페이지로 이동(`profiles.setup_completed_at`), 마이페이지 메뉴에서 내 정보·사무소 정보·구성원 관리 수정
- 기능 사용 중 부족한 정보 보완 다이얼로그(`components/complete-profile-dialog.tsx`): 브리핑 연락처 없을 때 휴대폰, 초대 시 기본 사무소명이면 사무소명
- 오류 메시지 한국어화: `lib/errors.ts` `toErrorMessage`가 Supabase Auth·Postgres·Storage·네트워크 오류를 한국어로 변환, 미지정 영어 오류는 기본 문구로 대체(원문은 서버 로그 `[unmapped error]`)
- 매물 사진·동영상: 등록 폼에서 함께 선택(`app/(app)/properties/media-picker.tsx`), 저장 시 브라우저가 매물 id를 먼저 만들고 Storage 업로드 후 경로 전달. 상세에 동영상 카드(`video-manager.tsx`) 추가·재생·삭제. 버킷 `property-videos`(비공개, 50MB, mp4/mov/webm), 테이블 `property_videos`
- 대시보드 할 일 → 월간 캘린더(`components/calendar/schedule-calendar.tsx`, `lib/calendar.ts`): 일정(할 일)·임장 기록·중개 상담·계약일·잔금일 표시, 날짜 선택 시 일정 목록·일정 추가, 연·월 선택 팝오버, 종류별 필터(localStorage 유지). 할 일 종류에 중도금·잔금 추가
- `.env.local`을 원격 Supabase로 전환

**변경 파일/화면**
- 화면: `/signup`, `/login`, `/onboarding`, `/setup`, `/dashboard`, `/mypage`, `/settings`, `/properties/new`, `/properties/[id]`, `/properties/[id]/briefing`
- 마이그레이션: `20261012150000_onboarding`, `20261012160000_setup_progress`, `20261012170000_property_videos`, `20261012180000_task_types_calendar` (모두 원격 적용)
- 공통: `lib/errors.ts`, `lib/password.ts`, `lib/profile.ts`, `lib/setup.ts`, `lib/calendar.ts`, `lib/actions/setup.ts`, `lib/use-form-action.ts`(`prepare` 옵션), `components/ui/popover.tsx`

**결정 사항**
- 시작하기 단계 완료 여부는 데이터(이름·휴대폰, 사무소명·대표 번호, 매물·브리핑·초대 수)로 판단, 마지막 단계 완료/건너뛰기만 `setup_completed_at`으로 저장
- 구성원 초대 단계만 "나중에 초대할게요" 허용(1인 사무소)
- 사용자에게 영어 오류 원문을 노출하지 않는다. 새 오류 코드는 `lib/errors.ts` 매핑에 추가
- 동영상 50MB 제한은 Supabase 무료 플랜 업로드 한도 기준

**남은 TODO**
- 공개 브리핑 동영상, 동영상 썸네일·순서 변경
- 원격 환경 수동 점검(위 다음 작업 1)

### 2026-10-12 — 원격 Supabase 연결
**작업 요약**
- 원격 프로젝트 link 후 `db push`로 초기 마이그레이션 적용 (`supabase migration list`로 로컬·원격 일치 확인)
- 원격 `db push` 실패 수정: 원격은 pgcrypto가 `extensions` 스키마에 있어 `gen_random_bytes`를 찾지 못함 → `create extension ... with schema extensions`, `extensions.gen_random_bytes(...)`로 스키마 명시 (원격 미적용 상태였으므로 init 파일 직접 수정)

**결정 사항**
- 확장 함수는 항상 `extensions.` 스키마를 붙여 호출한다 (로컬은 search_path 차이로 오류가 드러나지 않음)
- 스키마 변경 흐름: 새 마이그레이션 파일 → 로컬 `db:reset` 검증 → `db:types` → `db:push`

**남은 TODO**
- 대시보드 Auth 설정, 원격 환경에서 E2E 점검, 배포 환경변수 설정

### 2026-10-12 — 공통 화면 UI (로딩·404·오류·준비중·약관·마이페이지)
**작업 요약**
- 로딩: `app/(app)/loading.tsx`(스켈레톤), `app/b/[token]/loading.tsx`, `components/ui/skeleton.tsx`
- 404: `app/not-found.tsx`(전체 화면), `app/(app)/not-found.tsx`(사이드바 안, 없는/다른 사무소 데이터)
- 오류: `app/(app)/error.tsx`, `app/global-error.tsx` (Next 16 `unstable_retry` 사용)
- 공용 안내 화면 `components/status-screen.tsx`, 준비중 화면 `ComingSoonScreen`(대체 기능 링크 포함)
- 준비중 페이지: `/notifications`(알림), `/help`(고객센터: 공지·FAQ·1:1 문의 준비중), `/assistant` 개편(기능별 "지금은 이렇게" 안내)
- 약관: `/terms`, `/privacy` (공개 경로, `app/(legal)` 레이아웃, `components/legal-document.tsx` 목차형). 회원가입 동의 항목·인증 화면 하단에 링크
- 마이페이지 `/mypage`: 프로필·자격 인증 상태, 담당 매물/고객 수·남은 할 일·이번 달 상담, 내 할 일, 담당 매물·고객, 최근 활동, 설정·지원 메뉴, 로그아웃
- 헤더: 알림 아이콘, 사용자 메뉴에 마이페이지·고객센터 추가 / 사이드바 하단 프로필 카드 → 마이페이지

**결정 사항**
- 약관·처리방침은 초안(사업자 정보·보호책임자·국외 이전은 "출시 전 지정/고지"로 표기)
- 회원 탈퇴는 준비중(고객센터 문의 안내)
- `loading.tsx` 때문에 상세 페이지 `notFound()`는 스트리밍 후 404 화면을 그려 HTTP 상태가 200일 수 있음(화면·noindex는 정상)

**확인**
- tsc, lint, build 통과 / 신규 화면 데스크톱·모바일(390px) 스크린샷 확인

### 2026-10-12 — Supabase 연동 및 전체 기능 구현
**작업 요약**
- 서비스명 "집앤드" → "집앤" (코드·문서. 원본 PDF 파일명은 유지)
- Supabase(@supabase/ssr) 연결, CLI 마이그레이션 `supabase/migrations/20261012120000_init.sql`
  - 테이블: offices, profiles, office_invites, properties(+photos, visits, events), documents(+fields, signals), customers, consultations, customer_properties, tasks, deals(+checklist_items, clauses), office_clauses, briefings
  - RLS: 사무소(office_id) 단위 격리, `current_office_id()` security definer
  - 가입 트리거 `handle_new_user`: 일반 가입은 사무소 생성 후 대표(owner), 초대 토큰 가입은 해당 사무소 구성원
  - RPC: `get_invite`, `get_briefing`(공개 필드만, 조회수 증가), `update_member`(대표 전용)
  - Storage 비공개 버킷: property-photos(10MB), visit-audio(25MB), documents(20MB). 브리핑 사진만 유효 링크 기준 공개 조회 허용
- 목업(`lib/mock`) 제거, 모든 화면 실데이터 연동

**화면 / 기능**
| 경로 | 기능 |
| --- | --- |
| `/signup`, `/login` | 이메일 가입(사무소 생성)·초대 가입·로그인. 소셜 로그인은 준비중 |
| `/dashboard` | 빠른 실행, 현황 수치, 할 일(지연·오늘·예정·완료), 검토 필요 문서, 진행 중 거래, 최근 매물 |
| `/properties` (+new, [id], edit) | 매물 CRUD, 사진 업로드·대표 사진·삭제, 상태 변경, 고객 연결, 변경 이력 |
| `/properties/[id]/visit` | 임장 기록: 녹음/음성 파일 업로드, 구조화 항목, 체크리스트, 추가 확인 사항. STT·AI 정리는 준비중 |
| `/properties/[id]/briefing` | 포함 항목 선택, 설명 편집, 미리보기, 공유 링크(3~30일) 생성·복사·삭제, 인쇄/PDF |
| `/b/[token]` | 공개 브리핑(내부 메모·상세 주소 제외), 인쇄·PDF 저장 |
| `/documents` (+[id]) | 서류 업로드(매물 연결), 원문 뷰어, 추출 항목·확인 사항 수동 입력(페이지·원문 근거), 항목별 확인 후 검토 완료. AI 자동 추출은 준비중 |
| `/customers` (+new, [id], edit) | 고객 조건, 상담 기록 타임라인, 후속 일정, 매물 연결, 조건 기반 추천 매물. 통화 요약은 준비중 |
| `/contracts` (+new, [id]) | 거래 생성 시 기본 체크리스트 12개 생성·매물 '계약 진행', 단계 변경('완료' 시 매물 '계약 완료'), 체크리스트 추가·삭제, 특약(라이브러리/직접 입력/수정), 사무소 특약 저장. AI 초안은 준비중 |
| `/settings` | 사무소 정보(대표만 수정), 구성원 역할·활성 관리, 초대 링크(7일), 계정 정보·비밀번호 변경, 플랜 안내(결제 준비중) |
| `/assistant` | AI·모바일 앱 기능 안내(준비중) |

**결정 사항**
- 인증은 이메일/비밀번호만. 자격 인증 심사·초대 메일 발송은 준비중(초대는 링크 복사 방식)
- 파일은 브라우저 → Storage 직접 업로드(서버 액션 본문 크기 제한 회피), 표시는 1시간 signed URL
- 폼은 `useFormAction` 훅(오류 시 입력 유지)
- 추천 매물은 규칙 기반(거래 유형·예산·희망 지역)

**확인**
- `npx tsc --noEmit`, `npm run lint`, `npm run build` 통과
- 로컬 Supabase 대상 브라우저 E2E(Playwright, 18단계) 통과: 가입 검증 → 매물·사진 → 임장 → 문서 업로드·검토 → 고객·상담·추천 연결·할 일 → 거래·체크리스트·특약·단계 → 브리핑 링크·비로그인 열람(내부 메모·상세 주소 미노출, 사진 로드) → 사무소 정보·초대 → 초대 가입(같은 사무소 데이터 조회, 사무소 정보 수정 불가) → 다른 사무소 404 격리 → 비밀번호 변경 후 재로그인 → 삭제

**남은 TODO**
- 원격 프로젝트 연결, 모바일 점검, 로딩/에러 화면, 페이지네이션, 약관 페이지, 비밀번호 재설정

### 2026-10-12 — 프로젝트 가이드 및 MVP 웹 UI
**작업 요약**
- 기획서(PDF) 분석 후 `docs/PLANNING.md`로 요약
- `AGENTS.md` 작업 규칙(커밋/푸쉬/PR 시 WORKLOG 갱신, PR 템플릿, 브랜치·코드 규칙), `.github/pull_request_template.md` 생성
- shadcn/ui 초기화(`base-nova`, Base UI) 및 MVP 화면 9종 목업 구현 (로그인·가입, 대시보드, 매물 목록·등록·상세, 임장, 브리핑, 문서 목록·결과)
