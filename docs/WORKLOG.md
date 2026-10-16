# 작업 로그

> 커밋/푸쉬/PR 요청 시 이 파일을 먼저 갱신한다 (`AGENTS.md` 참고).
> 새 작업 시작 시 **현재 상태 → 다음 작업**부터 이어서 진행한다.

## 현재 상태
- **단계**: 웹 서식 작성 개발 중 (`feat/contract-forms`) — 계약서 PDF형 작성 UI 1차 완성
  - **웹**: `/contracts/documents` 목록 + 「계약서 작성」모달(종류 선택 즉시 양식)·저장·인쇄. 확인설명서·영수증·기타는 초안/공유 뼈대
  - **앱**: 확정된 서식만 열람·공유 (`/f/[token]`)
  - 안드로이드 앱 1·2단계·일정 알림은 `develop` 반영 완료 (PR #2)
- **실기기 테스트 방법**: USB `adb reverse` + `npm run app:serve` / `app:usb` (기존과 동일)
- **웹**: 계약서 작성 UX 검증·인쇄 맞추기 단계. 부동산 커뮤니티·AI·결제는 미진행
- **완료**: 인증/사무소, 매물·사진·동영상·임장, 문서, 브리핑·리스트 공유, 고객·상담, 계약관리 5단계·진행 공유 링크, 설정, 대시보드 캘린더, 안드로이드 앱 1·2단계, 일정 알림
- **환경**: 원격 Supabase. 새 마이그레이션 `20261016120000_deal_forms` — **`npm run db:push` 필요**. 타입은 로컬 `database.types.ts`에 반영됨

> ⚠️ **아직 진행하지 못한 서비스**
> 1. ~~계약서·확인설명서~~ → `feat/contract-forms`에서 진행 중 (기타 서식·영수증 포함)
> 2. **부동산 커뮤니티** (중개사 간 게시판·정보 공유)
>
> 웹 작업을 이어서 할 때 커뮤니티 우선순위를 정한다.

- **다음 작업** (우선순위 순)
  0. **시작 지점**: `npm run db:push`로 `deal_forms` 마이그레이션 원격 적용 후, 계약서 작성→저장→인쇄 실사용 검증
  0. 확인설명서·영수증 작성 UI를 계약서 모달 수준으로 맞춤 / PDF 필드 더 가깝게
  0. 사용자 확인 필요: 계약 취소 시 고객 상태를 '관심 고객'으로 되돌리는 규칙 유지 여부, 개인정보처리방침의 '중개사 자격번호' 항목 삭제 여부
  0. 서류 심사 신청(`office_verification_requests`) 관리자 처리 화면 — 현재는 Supabase 대시보드에서 수동 승인
  0. 브라우저 점검: 시작하기 2단계 사무소 조회→선택→저장(등록), 미등록 상태에서 각 제한 기능(매물·고객 2건째, 문서, 계약, 구성원 초대, 브리핑 공유, 상담 기록, 고객-매물 연결) 모달 동작, 시작하기 4·5단계 잠김 표시, 설정 사무소 정보 표시
  0. 대표자 본인 확인(휴대폰 본인인증 실명 ↔ 공공데이터 대표자명 비교 또는 등록증 업로드 심사) 설계 — 공공데이터에는 대표자 이름만 있음
  1. 원격에서 가입 → 시작하기 5단계 → 매물(사진·동영상) → 캘린더 일정 흐름 직접 점검 (원격은 이메일 인증이 켜져 있어 자동 E2E 미실행). 날짜 선택기는 직접입력+달력 버튼으로 변경됨 — 다른 화면에서도 동작 확인
  2. 선택 입력 날짜를 비우는 방법 필요 여부 결정
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

### 2026-10-16 — 계약서 PDF형 작성 모달·양식 UX
**작업 요약**
- 브랜치 `feat/contract-forms`: 거래 서식 DB·공유 뼈대 + **계약서 작성 모달** 완성
- `/contracts/documents` 문서 테이블, 「계약서 작성」→ 모달에서 부동산·거래 종류 선택 즉시 양식 표시(확인 단계 제거)
- 부동산의 표시: 지목·구조·용도 드롭다운(+직접입력), 토지/건물 한 줄 레이아웃, 입력 테두리
- 계약내용: 원 단위 쉼표 입력, 잔금 한글 자동계산(수정 불가), 금액/원정은/기타 5:1:4 배치, 계약금 영수자 자필서명란
- 일반조항 제2조~제8조 전문 + 추가 특약 입력, DatePicker 직접입력·달력 분리, 모달 바깥 클릭으로 닫히지 않음
- 마이그레이션 `20261016120000_deal_forms`, 공개 `/f/[token]`, 앱은 확정본 공유만

**변경 파일/화면**
- `components/deal-forms/*`, `lib/deal-forms.ts`, `lib/contract-templates.ts`, `lib/actions/deal-forms.ts`
- `app/(app)/contracts/documents/*`, `app/(app)/contracts/[id]/forms/*`, `app/f/[token]`
- `components/form/date-picker.tsx`, `native-select.tsx`, `lib/money.ts`, `supabase/migrations/20261016120000_deal_forms.sql`

**결정 사항**
- 금액 UI는 원+쉼표, 저장값은 기존과 같이 만원 단위
- 잔금은 자동계산 한글 표시만, 작성 모달은 `disablePointerDismissal`

**남은 TODO**
- 원격 `db:push`, 작성→저장→인쇄 실사용 검증
- 확인설명서·영수증 UI를 계약서 수준으로, PDF와 더 가깝게
- 공부서류 추출값 → 확인설명서 자동 반영
- 공제증서 등 툴바 준비중 항목

### 2026-10-16 — 일정 알림 (웹·앱, 10분 전 / 계약·잔금 당일 9시)
**작업 요약**
- `/notifications`를 준비중 → **다가오는 일정 목록**으로 교체. 알림 권한 허용 UI
- 알림 대상: 미완료 할 일(`tasks`) + 계약일·잔금일. 계약·잔금은 **당일 오전 9시** 기준, 알림은 모두 일정 **10분 전**
- **앱**: `@capacitor/local-notifications`로 OS 로컬 알림 스케줄 (백그라운드 가능). `SCHEDULE_EXACT_ALARM` 등 권한
- **웹**: Notification API + 탭이 열려 있을 때 `setTimeout` (탭 닫으면 울리지 않음)
- 로그인 레이아웃에 `NotificationScheduler` 마운트. 일정·계약 저장/완료/삭제 시 스케줄 재동기화

**변경 파일**
- `lib/reminders.ts`, `lib/reminder-types.ts`, `lib/notifications-client.ts`, `lib/actions/reminders.ts`
- `components/notifications/notification-scheduler.tsx`, `app/(app)/notifications/page.tsx`, `app/(app)/layout.tsx`
- `capacitor.config.ts`, `android/.../AndroidManifest.xml`, `package.json`(`@capacitor/local-notifications`)
- 연동: `task-board`, `schedule-calendar`, `deal-steps`, `tasks`/`deals` 액션 revalidate

**결정 사항**
- 임장·상담 기록(과거 기록)은 알림 대상 아님
- 거래 단계명 '계약 준비'는 DB 값이라 변경하지 않음(이전 커밋과 동일)

**남은 TODO**
- 실기기에서 알림 권한·10분 전 발화·알림 탭 시 상세 이동 확인 (APK 재설치 후)
- 웹: 탭이 닫혀 있을 때 알림이 필요하면 Service Worker/푸시 검토

### 2026-10-15 — '계약관리' 명칭 변경, 대시보드 일정 스크롤, 날짜별 일정 상세 페이지
**작업 요약**
- 기능명 '계약 준비' → **'계약관리'** (웹·앱 공통): 사이드바·페이지 제목·뒤로가기·대시보드 카드·캘린더 안내·로그인 화면 문구·이용약관·매물 이력(`계약관리 시작`)·README
- 대시보드 캘린더 옆 날짜별 일정 목록: 큰 화면에서는 달력 높이를 넘지 않고 목록만 상하 스크롤, 작은 화면·앱은 최대 높이 후 스크롤. 일정이 있으면 '일정 자세히 보기' 버튼
- 날짜별 일정 상세 페이지 `/schedule/[date]` 신규 (사이드바 메뉴에는 추가하지 않음): 달력 날짜 칸·목록 날짜 제목 클릭 시 이동. 일정 수·할 일 완료 요약, 전날·오늘·다음날 이동, 종류별 범례(건수), 시간순 일정 목록(할 일 바로 완료 처리), 해당 날짜 10:00로 일정 추가, 뒤로가기는 해당 월 대시보드

**변경 파일**
- `components/calendar/schedule-calendar.tsx` — 날짜 칸을 링크로, 선택 상태 제거(오늘/월 1일 기준 목록), `DayEventList`·`KindLegend`·`formatDayTitle`·`dayHref` 분리 export, 목록 스크롤
- `app/(app)/schedule/[date]/page.tsx` (신규)
- `components/layout/nav-items.ts`, `app/(app)/contracts/{page,new/page,[id]/page}.tsx`, `app/(app)/dashboard/page.tsx`, `app/(auth)/layout.tsx`, `app/(legal)/terms/page.tsx`, `lib/actions/deals.ts`, `README.md`

**결정 사항**
- 거래 단계명 '계약 준비'(서류 확인→조건 협의→계약 준비→잔금 대기)는 DB 값이라 변경하지 않음
- 잘못된 날짜 주소는 404

**남은 TODO**
- 실기기에서 일정 상세 페이지·목록 스크롤 확인 (USB 재연결 후 `npm run app:usb`)

### 2026-10-15 — 안드로이드 앱: 실기기 테스트 피드백 반영 (앱 전용 UI·속도·로딩·삭제 컨펌·계약 탭)
**작업 요약**
- 앱 아이콘·스플래시: 파비콘 로고(파란 배경 + 흰 집)로 교체. `mobile/generate-assets.mjs`로 `assets/` 원본 생성 → `@capacitor/assets`로 안드로이드 리소스 생성
- 실기기 설치: 사무실 Wi‑Fi 기기 간 차단으로 LAN 접속 불가 → USB `adb reverse` 방식으로 전환. 앱 테스트는 production 서버(`app:serve`, 3100)로 — 개발 모드는 페이지마다 컴파일·프리페치 없음으로 느림
- **앱 전용 스타일**: `@custom-variant app`(`[data-app]`, MobileAppShell이 html·셸에 표시). 웹 화면은 그대로
  - 버튼 44px(아이콘 버튼 포함), 흰 버튼·입력 테두리 진하게, 입력·선택·탭·필터·날짜 선택기 확대
  - `components/form/form-actions.tsx`: 웹은 오른쪽 정렬 한 줄, 앱은 저장(위)·취소(아래) 가로 꽉 채움 — 매물·고객·임장·계약·특약·할 일·설정 폼, 상담 기록·통화 녹음 선택 버튼
  - 일정·할 일 추가 창에서 종류·일시 한 줄씩, 고객 상세 "계약 시작하기"를 큰 버튼으로
  - 날짜 선택기: 앱에서는 화면 가운데 표시(시간 선택은 달력 아래). `scrollIntoView`가 화면 전체를 밀던 문제 수정(웹 포함)
- **전체 화면 로딩**(앱 전용): `lib/busy.ts` `useBusy` + `components/busy-overlay.tsx`. 폼 저장(`useFormAction`), 삭제 확인, 연결·업로드 등 서버 작업 중 "저장 중입니다… / 삭제 중입니다… / 처리 중입니다…"
- **삭제 컨펌**: `ConfirmAction`에 `appOnly` 추가(앱은 "삭제하면 되돌릴 수 없어요" 모달, 웹은 기존처럼 바로 삭제) — 상담 기록, 할 일, 매물 사진, 문서 추출 항목·확인 사항, 계약 확인 항목·특약. 마우스 오버로만 보이던 삭제 버튼은 앱에서 항상 표시
- **속도**: 서명 URL을 서버 메모리에 재사용(같은 사진 같은 URL → 브라우저 캐시), 썸네일 lazy loading, 앱에서 올리는 매물 사진은 긴 변 1920px JPEG로 축소(`lib/image.ts`)
- 계약 준비: 앱 하단 탭에 "계약" 추가(5개), 계약 상세에서 진행 단계 카드를 위로, 상단 탭 축약
- 매물 리스트 공유 화면 좌우 스크롤 수정(그리드 `minmax(0,1fr)`), 앱 본문 가로 스크롤 차단

**변경 파일/화면**
- 공용: `app/globals.css`, `components/ui/{button,input,select,tabs,textarea,popover}.tsx`, `components/form/{form-actions,confirm-action,date-picker,native-select}.tsx`, `components/{busy-overlay,audio-attach,property-thumbnail}.tsx`, `components/layout/{mobile-app-shell,nav-items}.ts(x)`
- lib: `busy.ts`, `use-is-app.ts`, `image.ts`, `storage.ts`, `upload-client.ts`, `use-form-action.ts`
- 화면: 고객·매물·임장·사진·문서·계약·특약·설정·시작하기·브리핑·리스트 공유
- 앱: `assets/`, `mobile/generate-assets.mjs`, `android/app/src/main/res/{mipmap,drawable}-*`, `next.config.ts`(LAN IP `allowedDevOrigins`), `package.json`(`app:serve`, `app:usb`)

**결정 사항**
- 앱/웹 분기는 서버 `isAppRequest()`(UA `ZipandApp`), 클라이언트 `useIsApp()`, 스타일 `app:` 변형 세 가지로 한다. 앱 요청 사항은 웹 화면을 바꾸지 않는다
- 사진 축소는 앱 업로드에만 적용(웹 업로드·기존 사진은 원본). Supabase 이미지 변환(유료)은 미사용

**남은 TODO**
- 실기기에서 이번 변경 전체 확인(로그인 후 화면은 미확인): 버튼 크기·테두리, 날짜 선택기 가운데 표시, 전체 화면 로딩, 삭제 컨펌, 계약 탭
- 웹 업로드 사진도 축소할지, 매물·고객 "연결 해제"에도 컨펌을 붙일지 결정
- 3단계 AI 요약(제공사 선택 필요)

### 2026-10-15 — 안드로이드 앱 2단계: 녹음 업로드·백그라운드 녹음, 하단 탭 고정
**작업 요약**
- 상담 녹음: 고객 상세 상담 기록 폼에서 녹음하기 / 통화 녹음 파일 선택(시스템 파일 선택기, 갤럭시 `Recordings/Call`) → Storage 업로드 → 상담 기록 저장. 녹음만 저장 가능(내용 선택), 기록 목록에 재생기·길이 표시, 기록 삭제 시 파일도 삭제
- 공용 `components/audio-attach.tsx` + `lib/use-audio-recorder.ts`: 앱은 네이티브 녹음, 브라우저는 MediaRecorder. 업로드 실패 시 녹음 보관 후 "다시 업로드". 임장 기록 폼도 같은 컴포넌트 사용
- 네이티브 `RecorderPlugin`(AAC 64kbps 모노 m4a, 캐시 폴더) + `RecordingService`(포그라운드 서비스, microphone 타입, "집앤 녹음 중" 알림). 화면을 끄거나 다른 앱으로 가도 녹음 유지(에뮬레이터 확인). 웹은 `Capacitor.convertFileSrc`로 파일을 읽어 업로드
- 개발 앱(http://10.0.2.2)에서 `crypto.randomUUID` 없음 → 업로드 경로 생성 실패 수정(`lib/uuid.ts` `randomUuid`, 사진 업로드도 해당)
- 권한 허용 직후 알림 채널 생성이 메인 스레드를 막아 ANR → 채널은 플러그인 로드 시 백그라운드에서 생성, 녹음 시작도 백그라운드 스레드
- 앱 레이아웃: 문서 전체 대신 본문만 스크롤(`fixed inset-0` + `main overflow-y-auto`), WebView 오버스크롤 효과 끔 → 상단 바·하단 탭이 스크롤·오버스크롤에 움직이지 않음. 입력 중에는 하단 탭 숨김. 상단 바 검색 아이콘 제거(목록 화면 검색창 사용)

**변경 파일/화면**
- 마이그레이션(원격 적용·타입 재생성): `20261016100000_consultation_audio`(consultations 녹음 컬럼, `consultation-audio` 버킷 50MB, `visit-audio` 50MB·형식 확장)
- Android: `RecorderPlugin.java`, `RecordingService.java`, `MainActivity.java`, `AndroidManifest.xml`(RECORD_AUDIO, FOREGROUND_SERVICE(_MICROPHONE), POST_NOTIFICATIONS)
- 웹: `components/audio-attach.tsx`, `lib/{audio,native-recorder,use-audio-recorder,uuid}.ts`, `app/(app)/customers/[id]/*`, `visit-form.tsx`, `lib/actions/customers.ts`, `components/layout/mobile-app-shell.tsx`

**결정 사항**
- 앱이 통화 음성을 직접 녹음하지 않고 기본 전화 앱 녹음 파일을 선택해 올린다(`READ_CALL_LOG`·접근성 우회 X)
- 녹음 파일 경로는 `{office_id}/{customer_id}/{uuid}.ext`, DB 제약으로 경로 검증

**남은 TODO**
- 3단계: 업로드된 녹음 STT·요약 → 상담 기록 저장(원문·신뢰도·검토 상태 표시)
- 통화 종료 감지 후 "상담 기록 남길까요?" 알림, 오프라인 업로드 대기열, 이어 올리기(TUS)
- 새 설치 상태에서 권한 허용 → 녹음 시작 ANR 재확인

### 2026-10-15 — 안드로이드 앱 1단계: Capacitor 셸·앱 UI
**작업 요약**
- 개발 환경: JDK 21(Homebrew `openjdk@21`, Capacitor 8 요구), Android SDK(`~/Library/Android/sdk`, API 36), 에뮬레이터 `Zipand_Pixel_API_36`(Pixel 8). `~/.zshrc`에 `JAVA_HOME`·`ANDROID_HOME`·PATH
- Capacitor 8 + `android/` 프로젝트(appId `kr.zipand.app`). 정적 번들 대신 배포된 웹을 WebView로 띄움(`server.url`, 개발은 `http://10.0.2.2:3000`, 배포는 `CAP_SERVER_URL`). 연결 실패용 `mobile/www/index.html`
- 앱 판별: WebView User-Agent에 `ZipandApp` 추가 → `lib/app-mode.ts` `isAppRequest()`로 서버에서 판별
- 앱 레이아웃 `components/layout/mobile-app-shell.tsx`: 상단 바(탭 화면은 로고·사무소명, 하위 화면은 뒤로, 매물·고객 목록 검색, 알림) + 하단 탭(홈·매물·고객·상담·마이)
- 앱 홈 `app/(app)/dashboard/app-dashboard.tsx`: 매물 등록·고객 등록·일정 추가(바로 다이얼로그), 오늘 일정·등록 매물·관리 중 고객 수, 캘린더, 최근 매물·고객
- 스크립트: `npm run app:emulator`, `app:run`, `app:sync` / `next.config.ts` `allowedDevOrigins: ["10.0.2.2"]`

**결정 사항**
- 웹 코드를 유지하기 위해 Capacitor 원격 URL 방식 채택(RN·네이티브 재작성 X). 웹/앱 같은 페이지, 레이아웃만 분기
- 통화 녹음은 앱이 직접 캡처 불가(Android 10+) → 기본 전화 앱 녹음 파일을 가져오는 방식. `READ_CALL_LOG`는 쓰지 않음

**남은 TODO**
- 로그인 후 앱 화면(홈·매물·고객) 에뮬레이터 점검, 배포 URL 확정 후 릴리스 빌드·서명

### 2026-10-15 — 사업자 인증·서류 심사, 계약 준비 5단계·공유, 매물 리스트 공유 (웹 1차 마감)
**작업 요약**
- 시작하기 2단계: 중개사무소 등록 + 사업자 인증(`registered_at`)까지 마쳐야 다음 진행. 직접 입력 제거. 조회가 안 되면 "서류로 등록 신청하기" 모달에서 중개사무소 등록증·사업자등록증 업로드 → 관리자 심사(대기·반려 사유 표시). 인증 완료 카드에 사업자 정보 표시
- 등록된 사무소에서 "다른 사무소 찾기" → 컨펌 모달 → 등록·사업자 정보 삭제 후 재등록(대표 전용 RPC `unregister_office`)
- 매물 사진 최대 10장(DB·서버·화면 모두 제한), 브리핑 사진은 좌우 슬라이드로 전부 표시, 잘림 없이 원본 비율(`object-contain`)
- 임장 기록 저장 후 입력·체크 초기화, 계약 체크리스트 체크 즉시 반영(optimistic)
- 계약 준비 5단계: 서류 확인 → 조건 협의(거래대금·입주일·기타) → 계약 준비(계약금·잔금일·중개수수료·당사자 인적사항·계좌·대출 확인) → 잔금 대기(잔금·수수료 입금) → 거래 완료. 단계별 왼쪽 화면 전환, 다음/저장 버튼
- 계약 취소: 헤더 삭제 옆 버튼 → 사유 입력 후 취소(매물 '광고 중' 복귀, 공유 링크 삭제)
- 임대인·임차인 공유 링크 `/d/[token]`: 진행 단계·조건·일정·체크리스트·특약 열람(당사자 연락처·수수료·내부 메모 제외)
- 고객 상태 자동 연동: 진행 중 거래 → 진행 중, 잔금 대기 → 계약 완료, 완료만 → 중개 완료, 거래 없어지면 관심 고객. 상담 기록 추가 시 연락 전 → 연락 완료
- `README.md` 새로 작성(기능·스택·환경변수·구조·업데이트 내역·로드맵). `develop` PR마다 README 업데이트 내역을 추가하도록 `AGENTS.md`·PR 템플릿에 규칙 추가
- 매물 리스트 공유 `/properties/share`: 고객 선택 시 희망 조건(거래 유형·지역·예산)으로 필터 → 매물 선택 → 제목·메시지·유효 기간 → 링크 생성·복사, 보낸 리스트 관리. 공개 화면 `/l/[token]`(사진 슬라이드·가격·스펙·특징·문의하기). 진입: 매물 관리 헤더, 고객 상세 "매물 리스트 보내기"

**변경 파일/화면**
- 화면: `/setup`, `/office/register`, `/properties`, `/properties/[id]`(사진), `/properties/[id]/visit`, `/properties/share`(신규), `/contracts/new`, `/contracts/[id]`, `/customers/[id]`, 공개 `/b/[token]`, `/d/[token]`(신규), `/l/[token]`(신규)
- 마이그레이션(원격 적용·타입 재생성): `20261015110000_office_registration_verify`, `20261015130000_office_verification_requests`, `20261015150000_office_unregister`, `20261015170000_property_photo_limit`, `20261015190000_deal_steps`, `20261015210000_deal_shares`, `20261015230000_customer_status_sync`, `20261016090000_property_lists`
- 신규: `components/office-document-request.tsx`, `office-register-form.tsx`, `office-unregister-button.tsx`, `photo-slider.tsx`, `deal-share-view.tsx`, `app/(app)/contracts/[id]/deal-steps.tsx`, `lib/business-registry.ts`, `lib/customer-status.ts`, `lib/deal-steps.ts`, `lib/actions/property-lists.ts`
- 수정: `lib/actions/{office,deals,customers,properties,settings,setup}.ts`, `lib/constants.ts`(계약 단계·체크리스트 단계), `lib/use-form-action.ts`(submitter 포함), `lib/supabase/proxy.ts`(`/d`, `/l` 공개), `lib/storage.ts`

**결정 사항**
- 사무소 등록은 서버 비밀값 해시 RPC로만 가능, 해제는 대표 전용(비밀값 불필요). 서류 심사는 관리자 화면 없이 대시보드에서 처리
- 공개 링크(브리핑·계약·매물 리스트)는 모두 security definer RPC로 필요한 필드만 노출, 사진은 유효 링크 기준 Storage 공개 정책
- 계약 공유 링크에는 계좌번호가 포함되므로 짧은 유효 기간 권장
- 웹 1차 개발은 여기서 마감. 미진행: 계약서, 확인설명서, 부동산 커뮤니티

**남은 TODO**
- 계약서·확인설명서·부동산 커뮤니티 개발(웹 재개 시 사용자에게 안내)
- 계약 취소 시 고객 상태 규칙, 처리방침 자격번호 항목 사용자 확인
- 브라우저 점검: 매물 리스트 생성·공개 화면, 계약 5단계·공유 링크

### 2026-10-15 — 사무소 조회를 시작하기에 연결, 등록 전 제한 확대, 공통 모달
**작업 요약**
- 공공데이터 API 실제 키로 동작 확인(전국 76,714건). 실제 응답이 `{ header, body }` 최상위 구조라 파서 수정(기존엔 모든 조회가 실패 처리됐을 것), 키 오류 JSON(`OpenAPI_ServiceResponse`)도 처리. 검색은 정확 일치만 됨(부분 검색 불가)
- 시작하기 2단계 사무소 정보: 공공데이터 조회 → 사무소 선택 → 대표 전화 확인 후 저장. 저장 시 서버에서 등록번호로 재조회한 값만 저장하고 등록 처리. 검색 안 될 때 "직접 입력"(미등록으로 저장) 유지
- 개설등록번호 입력칸에 "등록증에 적힌 그대로 '-'까지 입력" 안내
- 등록 전 제한 확대: 구성원 초대, 고객 브리핑 공유, 상담 기록, 고객-매물 연결 불가(기존: 매물·고객 1건, 문서·계약 불가). DB 트리거 + 화면 모달
- 공통 모달 `components/dialogs.tsx`: `NoticeDialog`(확인 모달, 확인 버튼 하나), `ConfirmDialog`(컨펌 모달, 취소/실행). `ConfirmAction`·사무소 등록 안내 모달이 이를 사용. 대표는 컨펌(취소/등록하기), 구성원은 확인 모달
- 링크가 아닌 동작용 `useOfficeGuard(kind, gate)` 훅(guard(fn) + dialog)
- 시작하기: 미등록이면 4단계(브리핑)·5단계(초대)를 잠김(자물쇠)으로 표시하고 건너뛰기 가능
- 설정 사무소 정보: 입력 폼 제거 → 등록된 값 읽기 전용 표시 + 다시 조회, 미등록이면 "사무소 등록하기"만. 내 정보(설정·시작하기 1단계)의 중개사 자격번호는 사무소 등록 후에만 표시(숨김 상태로 저장해도 기존 값 유지)

**변경 파일/화면**
- 화면: `/setup`(1·2·4·5단계), `/office/register`, `/settings`(사무소 정보·구성원·계정), `/customers/[id]`, `/properties/[id]`, `/properties/[id]/briefing`, 대시보드 시작하기 카드
- 마이그레이션(원격 적용): `20261015090000_office_registration_more`(`enforce_office_registration` 메시지 확장, `office_invites`·`briefings`·`consultations`·`customer_properties` 트리거)
- 신규: `components/dialogs.tsx`, `components/office-search.tsx`(검색 UI, 시작하기·사무소 등록 공용)
- 수정: `lib/office-registry.ts`(파서, `verifiedOfficeUpdate`), `lib/actions/setup.ts`, `lib/actions/office.ts`, `lib/actions/settings.ts`(`updateOffice` 제거, 자격번호 조건부 저장), `lib/office-gate.ts`(제한 종류 추가, `gateFor`), `lib/setup.ts`(`locked`), `components/office-gate.tsx`, `components/form/confirm-action.tsx`

**결정 사항**
- 사무소 정보는 공공데이터 조회·등록으로만 입력(설정에서 직접 수정 불가, 대표 전화도 재조회/시작하기에서만 변경)
- 공공데이터에는 대표자 이름만 있고 연락처·생년월일 없음 → 대표자 본인 확인은 별도 인증 필요

**남은 TODO**
- 원격 트리거 적용 여부 조회 확인(`supabase db query`가 응답 없이 멈춰 미확인, push는 성공)
- 대표 전화만 따로 수정하는 기능 필요 여부 결정
- `office_name` 수정 경로(`CompleteProfileDialog`)는 이제 초대 전 사무소 등록이 필수라 사실상 미사용 — 정리 검토

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
