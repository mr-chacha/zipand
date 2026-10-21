# 집앤

공인중개사 전용 업무 비서 웹앱. 임장, 매물 관리, 고객 상담, 공부서류 검토, 계약관리처럼 반복되는 중개 업무를 한곳에서 기록하고 고객에게 링크로 공유한다.

> AI(임장 STT·문서 OCR·브리핑 작성 등)·결제는 **서비스 준비중**이며, 같은 작업을 수동으로 할 수 있는 흐름을 제공한다. 안드로이드 앱(Capacitor)은 웹과 같은 서버를 띄워 사용한다.

- 기획 요약: [`docs/PLANNING.md`](docs/PLANNING.md)
- 작업 로그 / 다음 작업: [`docs/WORKLOG.md`](docs/WORKLOG.md)
- 작업 규칙: [`AGENTS.md`](AGENTS.md)

## 주요 기능

| 메뉴 | 기능 |
| --- | --- |
| 가입·시작하기 | 이메일 가입, 단계별 시작하기(내 정보 → 사무소 → 첫 매물 → 브리핑 → 구성원 초대), 공공데이터 중개사무소 조회 + 사업자 진위 확인, 조회 실패 시 등록증 서류 심사 신청 |
| 대시보드 | 일정 캘린더(할 일·임장·상담·계약일·잔금일), 날짜별 일정 상세 `/schedule/[date]`, 현황 수치, 진행 중 거래 |
| 매물 관리 | 매물 등록·수정(카카오 주소검색, 동·호·구조·주용도), 사진(최대 10장)·동영상, 관계자 연락처, 관리비, 임장 기록, 변경 이력 |
| 고객 브리핑 | 매물 1건 소개 공유 링크 `/b/[token]`(사진 슬라이드, 인쇄/PDF) |
| 매물 리스트 공유 | 고객 조건으로 매물을 골라 리스트 링크 `/l/[token]` 하나로 전달 |
| 고객 및 상담 | 고객 조건, 상담 기록(앱: 통화 녹음 선택·앱 녹음), 후속 일정, 매물 연결·추천, 거래 단계와 고객 상태 자동 연동 |
| 문서 | 공부서류 업로드(매물×종류 표), 텍스트 PDF 자동 추출·원문 크게 보기·다운로드·인쇄, 추출 항목·확인 사항 검토 |
| 계약관리 | 작성된 계약서·확인설명서 목록(`/contracts`, 유형 필터), 일반/표준임대차 계약서·확인설명서 작성·저장·인쇄(매물 서류·건축HUB로 칸 채우기), 등기·공부 발급 안내, 5단계 거래·체크리스트·특약·공유 링크 `/d/[token]` |
| 알림 | 등록 일정 10분 전 알림(웹·안드로이드). 계약일·잔금일은 당일 오전 9시 기준 |
| 안드로이드 앱 | Capacitor WebView, 하단 탭(홈·매물·고객·상담·계약·마이), 백그라운드 녹음, 로컬 알림 |
| 설정 | 사무소 정보, 구성원 초대·권한, 계정, 요금제 안내 |

공개 링크(브리핑·매물 리스트·계약 공유)는 내부 메모·개인정보·상세 주소를 노출하지 않으며 유효 기간이 지나면 열리지 않는다.

## 기술 스택

- **Next.js 16** (App Router, Turbopack, `proxy.ts`) · React 19 · TypeScript
- **UI**: Tailwind CSS v4, shadcn/ui(`base-nova`, Base UI), lucide-react, sonner
- **백엔드**: Supabase(Postgres + RLS, Auth, Storage), 서버 액션
- **외부 API**: 공공데이터포털 전국공인중개사사무소표준데이터, 국세청 사업자등록 상태조회

## 시작하기

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev                  # http://localhost:3000
```

### 환경변수

| 이름 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `NEXT_PUBLIC_SITE_URL` | 서비스 주소(공유 링크·인증 메일 리다이렉트) |
| `DATA_GO_KR_SERVICE_KEY` | 공공데이터포털 인증키 (서버 전용). 건축HUB 채우기에도 동일 키·건축물대장 API 활용신청 필요 |
| `OFFICE_REGISTRATION_SECRET` | 사무소 등록 RPC 호출용 비밀값 (서버 전용) |
| `CODEF_*` | (선택·보류) CODEF 등기 API. `.env.example` 참고. 데모는 PDF가 비는 경우가 많아 자동 열람은 보류 |

service_role / secret key는 사용하지 않는다. `.env.local`은 커밋하지 않는다.

### 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` / `build` / `start` | 개발 서버 / 프로덕션 빌드 / 실행 |
| `npm run lint` | ESLint |
| `npm run db:push` | 새 마이그레이션을 원격 Supabase에 적용 |
| `npm run db:types` | 원격 스키마로 `lib/supabase/database.types.ts` 재생성 |
| `npm run db:start` / `db:reset` | (선택) 로컬 Docker Supabase |
| `npm run app:serve` | production 빌드 후 3100 포트로 실행 (실기기 테스트용) |
| `npm run app:usb` | `adb reverse tcp:3000 tcp:3100` (USB로 폰↔PC) |
| `npm run app:sync` / `app:run` | Capacitor Android sync / run |

## 프로젝트 구조

```
app/
  (auth)/          로그인·회원가입
  (app)/           로그인 필요 화면 (dashboard, properties, customers, documents, contracts, settings, setup …)
  (legal)/         약관·개인정보처리방침
  b/[token]        공개 매물 브리핑
  l/[token]        공개 매물 리스트
  d/[token]        공개 계약 진행 공유
components/        공통 컴포넌트 (ui/: shadcn)
lib/
  actions/         서버 액션 (ActionState 반환)
  supabase/        클라이언트·proxy·DB 타입
  auth.ts          getSession() 요청 단위 세션
  queries.ts       목록 공통 조회
supabase/migrations/  스키마·RLS·RPC 마이그레이션
docs/              기획 요약, 작업 로그
```

## 개발 규칙 요약

- 브랜치: `feat/…`, `fix/…`, `docs/…`에서 작업 → `develop`으로 PR. `main` 직접 푸쉬 금지
- 커밋 메시지: `type: 요약` (feat, fix, docs, style, refactor, chore), 한국어
- 스키마 변경은 새 마이그레이션 파일로만 추가(원격 적용된 파일 수정 금지), 모든 업무 테이블은 `office_id` RLS
- PR 전 `npm run lint`, `npm run build` 통과, `docs/WORKLOG.md`와 아래 **업데이트 내역** 갱신

## 업데이트 내역

> `develop`으로 PR을 올릴 때마다 맨 위에 추가한다. (최신순)

### 2026-10-21 — 공부서류 자동 추출·매물 동호·서식 연동 ([#4](https://github.com/mr-chacha/zipand/pull/4))
- 매물: 카카오 주소검색, 동·호·구조·주용도 저장
- 문서: 텍스트 PDF 업로드 시 자동 추출(등기 갑구·을구, 건축물대장, 종합공부 등), 원문 크게 보기·다운로드·인쇄
- 계약서·확인설명서: 연결 매물·서류 추출값·건축HUB로 면적·구조·권리관계 등 채우기
- 등기·공부 발급 안내(인터넷등기소·세움터·토지이음). 적용 시 `npm run db:push`(마이그레이션 4건)

### 2026-10-20 — 계약서·확인설명서·표준임대차 작성 ([#3](https://github.com/mr-chacha/zipand/pull/3))
- 계약관리 `/contracts`: 작성된 서식 목록, 유형별 검색 필터, 「계약서 작성」「확인설명서 작성」
- 일반 계약서: 아파트 등 PDF형 양식·A4 인쇄, 매매·전세·월세 일반조항·특약(협회 PDF 원문)
- 표준임대차 계약서: 별지 제24호서식 6쪽(탭·인쇄, 사무소 프리필, 공동당사자·중개사 별지)
- 중개대상물 확인·설명서: PDF 4쪽 작성·탭·인쇄, 거래 없이도 저장 가능
- `deal_forms` 마이그레이션·관련 서식(영수증 등) 뼈대. 적용 시 `npm run db:push` 필요

### 2026-10-16 — 안드로이드 앱·일정 알림 ([#2](https://github.com/mr-chacha/zipand/pull/2))
- 안드로이드 앱(Capacitor): 하단 탭(홈·매물·고객·상담·계약·마이), 앱 홈 빠른 등록, 앱 전용 UI(큰 버튼·전체 화면 로딩·삭제 컨펌)
- 상담·임장 녹음: 통화 녹음 파일 선택·앱 녹음 업로드, 백그라운드 녹음(포그라운드 서비스)
- '계약관리' 명칭(웹·앱), 대시보드 일정 목록 스크롤, 날짜별 일정 상세 `/schedule/[date]`
- 일정 알림: 할 일·계약일·잔금일 10분 전(계약·잔금은 당일 오전 9시 기준). 앱은 로컬 알림, 웹은 브라우저 알림(탭 열린 동안)

### 2026-10-15 — 웹 서비스 1차 개발 ([#1](https://github.com/mr-chacha/zipand/pull/1))
- Supabase 연동: 사무소 단위 RLS, 비공개 Storage, 가입 트리거, 공통 화면(로딩·404·오류·준비중·약관·마이페이지)
- 가입·시작하기: 간단 가입, 단계별 시작하기, 중개사무소 조회 + 사업자 인증, 서류 심사 신청, 사무소 등록 해제
- 미등록 사무소 기능 제한(DB 트리거 + 안내 모달)
- 매물: 사진(최대 10장)·동영상, 연락처, 금액·면적·관리비 입력, 임장 기록, 변경 이력
- 고객 브리핑 공유 링크(사진 슬라이드, 원본 비율), 매물 리스트 공유 링크
- 고객·상담: 상담 타임라인, 후속 일정, 매물 추천, 거래 연동 고객 상태
- 계약 준비 5단계, 체크리스트 즉시 반영, 특약, 계약 취소, 임대인·임차인 공유 링크
- 대시보드 일정 캘린더, 설정(사무소·구성원·계정)

## 로드맵 (미진행)

- ~~계약서 작성~~ / ~~중개대상물 확인·설명서~~ (웹 작성·인쇄 — 영수증·기타 서식·필드 세부 맞춤은 이어서)
- ~~공부서류 텍스트 PDF 추출·서식 반영~~ (스캔본 LLM OCR·CODEF 등기 PDF 자동 열람은 추후)
- 부동산 커뮤니티
- AI 기능(임장 STT·정리, 스캔본 문서 OCR, 브리핑 작성, 상담 요약, 특약 추천), 결제, 소셜 로그인
- 안드로이드 앱 3단계(녹음 STT·AI 요약)
