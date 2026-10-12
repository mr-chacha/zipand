# 작업 로그

> 커밋/푸쉬/PR 요청 시 이 파일을 먼저 갱신한다 (`AGENTS.md` 참고).
> 새 작업 시작 시 **현재 상태 → 다음 작업**부터 이어서 진행한다.

## 현재 상태
- **단계**: Phase 2 — Supabase 연동 완료 (AI·앱·결제 제외 전 기능 동작)
- **완료**: 인증/사무소, 매물·사진·임장 기록, 문서 보관·수동 검토, 고객 브리핑 공유 링크, 고객·상담·후속 일정, 계약 준비(체크리스트·특약), 설정(사무소·구성원 초대·계정·구독 안내), 대시보드
- **환경**: 원격 Supabase 프로젝트(`ocwvlgeasfkubzasjutx`, 서울) 연결·마이그레이션 적용 완료. `.env.local`은 원격을 가리킴. 로컬 Docker Supabase는 스키마 변경 검증용
- **다음 작업** (우선순위 순)
  1. 대시보드 Auth 설정 확인(Site URL, Redirect URL `/auth/confirm`, Confirm email, 최소 비밀번호 8자) 후 원격에서 가입·주요 흐름 점검
  2. 모바일 레이아웃 점검 — 특히 임장 기록·사진 업로드 (현장 사용)
  3. 목록 페이지네이션(현재 전체 조회), 비밀번호 재설정(이메일) 흐름
  4. 약관·처리방침의 사업자 정보(회사명, 보호책임자, 국외 이전 항목) 확정 후 반영
  5. 소셜 로그인(카카오·네이버·구글) — 현재 "서비스 준비중"
  6. AI 기능(임장 STT·정리, 문서 OCR·추출, 브리핑 작성, 상담 요약, 특약 추천) 및 결제 연동

## 로컬 개발
```bash
npm run db:start   # Docker 필요. 최소 서비스만 실행 (auth, rest, storage, db)
npm run db:reset   # 마이그레이션 재적용 (데이터 초기화)
npm run db:types   # lib/supabase/database.types.ts 재생성
npm run dev
```
- `.env.local`은 `.env.example`을 복사하고 `npx supabase status`의 URL·publishable key를 넣는다.
- 로컬은 이메일 인증이 꺼져 있어 가입 즉시 로그인된다.

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
