# 작업 로그

> 커밋/푸쉬/PR 요청 시 이 파일을 먼저 갱신한다 (`AGENTS.md` 참고).
> 새 작업 시작 시 **현재 상태 → 다음 작업**부터 이어서 진행한다.

## 현재 상태
- **단계**: Phase 1 — 웹 UI (기능 없음, 목업 데이터)
- **완료**: 작업 가이드·PR 템플릿·기획 요약 문서, shadcn/ui 세팅, MVP 웹 화면 9종
- **다음 작업** (우선순위 순)
  1. 반응형/모바일 레이아웃 점검 (임장장은 모바일 현장 사용이 핵심)
  2. 빈 상태·로딩(`loading.tsx`)·에러(`error.tsx`, `not-found.tsx`) 화면 추가
  3. P1 화면 UI: 고객 및 상담(`/customers`), 계약 준비(`/contracts`), AI 실무 도우미(`/assistant`), 구독 및 설정(`/settings`) — 현재 사이드바에 "준비 중"으로 비활성화
  4. 다크 모드 토글 여부 결정 (테마 변수는 준비됨)
  5. 이후 기능 단계: 데이터 모델(Prisma 등) → 인증 → 매물 CRUD → 파일 업로드 → AI 연동

## 구조 메모
- `app/(auth)/` 로그인·회원가입 / `app/(app)/` 사이드바 레이아웃 적용 화면
- `components/ui/` shadcn(Base UI 기반) — `asChild` 대신 `render` prop
- `components/layout/` 사이드바·헤더·로고 / `components/status-badge.tsx` 상태 뱃지 모음
- `types/index.ts` 도메인 타입 / `lib/mock/` 목업 데이터 / `lib/format.ts` 금액·면적 포맷
- 브랜드 컬러: `--primary` (oklch 0.52 0.19 262), 추가 토큰 `--success`, `--warning`
- 폰트: Noto Sans KR (`next/font/google`)

## 기록

### 2026-10-12 — 프로젝트 가이드 및 MVP 웹 UI
**작업 요약**
- 기획서(PDF) 분석 후 `docs/PLANNING.md`로 요약
- `AGENTS.md`에 작업 규칙 추가: 커밋/푸쉬/PR 시 WORKLOG 갱신, PR 템플릿 사용, 브랜치 규칙, 코드 규칙
- `.github/pull_request_template.md` 생성
- shadcn/ui 초기화 (`base-nova`, Base UI) 및 컴포넌트 추가: button, card, input, label, badge, table, tabs, select, textarea, separator, avatar, dropdown-menu, sheet, checkbox, progress, tooltip, scroll-area
- MVP 화면 구현 (목업 데이터, 기능 없음)

**화면 목록**
| 경로 | 화면 |
| --- | --- |
| `/login`, `/signup` | 로그인, 회원가입(3단계 인증 흐름 미리보기, 약관 동의) |
| `/dashboard` | 빠른 실행(매물 등록·임장 기록·문서 분석), 오늘의 업무, 검토 대기 문서, 진행 중 거래, AI 사용량, 최근 매물 |
| `/properties` | 매물 목록 — 검색, 거래/유형/상태 필터, 테이블·카드 전환 (모바일은 카드) |
| `/properties/new` | 매물 등록 폼 (사진·음성으로 시작 CTA, 공개 설명/비공개 메모 구분) |
| `/properties/[id]` | 매물 상세 — 사진, 탭(기본 정보·임장 기록·문서·변경 이력), 가격 요약, 내부 메모 |
| `/properties/[id]/visit` | 스마트 임장장 — 사진, 음성 녹음 UI, 원본 transcript, AI 정리 결과(출처 뱃지·수정), 체크리스트, 추가 확인 사항 |
| `/properties/[id]/briefing` | 고객 브리핑 — 포함 항목 토글, 설명 편집, 실시간 미리보기, PDF/링크 공유 버튼 |
| `/documents` | 문서 업로드(매물·문서 종류 선택), 분석 이력(진행률, 실패 사유와 대안 액션) |
| `/documents/[id]` | 분석 결과 — 원문 미리보기(근거 하이라이트), 추출 항목(신뢰도·근거·확인 체크), 확인할 사항(근거·다음 행동), 검토 완료 |

**결정 사항**
- 서비스명은 "집앤드"로 표기
- 비활성 메뉴(P1 이후)는 사이드바에 "준비 중" 뱃지로 노출
- 사진은 실제 이미지 대신 `PropertyThumbnail` 플레이스홀더 사용

**확인**
- `npm run lint`, `npx tsc --noEmit`, `npm run build` 통과
- 주요 화면 dev 서버 렌더링 확인 (데스크톱 1440px)

**남은 TODO**
- 모바일 뷰 세부 점검, 로딩/에러 화면, P1 화면 UI
