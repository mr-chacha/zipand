<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 집앤드 프로젝트 작업 가이드

## 프로젝트 개요
- 서비스명: **집앤드** (기획서 가칭: 중개파트너 AI) — 공인중개사 전용 AI 업무 비서 웹앱
- 기획 요약: `docs/PLANNING.md` (원본: `../집앤드 기획문서.pdf`)
- 작업 로그 / 이어서 할 작업: `docs/WORKLOG.md`

## 작업 시작 시
1. `docs/WORKLOG.md`의 **현재 상태**와 **다음 작업**을 먼저 읽고 그 지점부터 이어서 진행한다.
2. 기능 범위나 화면 구성이 애매하면 `docs/PLANNING.md`를 기준으로 판단한다.

## 커밋 / 푸쉬 / PR 요청 시 (필수)
사용자가 "커밋", "푸쉬", "PR"을 요청하면 git 명령을 실행하기 **전에** 아래를 수행한다.
1. `docs/WORKLOG.md` 갱신
   - **현재 상태**: 진행 단계, 다음 작업(구체적인 시작 지점)
   - **기록**: 맨 위에 날짜별 항목 추가 — 작업 요약, 변경 파일/화면, 결정 사항, 남은 TODO
2. 갱신한 `docs/WORKLOG.md`를 같은 커밋에 포함한다.
3. 커밋 메시지는 `type: 요약` 형식(feat, fix, docs, style, refactor, chore)으로 한국어로 작성한다.
4. PR 생성 시 본문은 `.github/pull_request_template.md` 형식을 따르고, 내용은 WORKLOG의 해당 작업 기록을 바탕으로 채운다. (`gh pr create` 사용)
5. 브랜치: `main`에 직접 푸쉬하지 않고 `feat/...`, `fix/...`, `docs/...` 브랜치에서 작업 후 PR을 올린다. 사용자가 명시하면 예외.

## 코드 규칙
- Next.js 16 (App Router, Turbopack). `params`, `searchParams`는 Promise이므로 `await` 하고 `PageProps<'/route/[id]'>` 헬퍼를 사용한다.
- UI: shadcn/ui (`base-nova` 스타일, **Base UI 기반**). Radix의 `asChild` 대신 `render` prop을 사용한다. 링크 버튼은 `<Link className={buttonVariants()}>` 패턴을 쓴다.
- 클래스 병합은 `@/lib/utils`의 `cn`을 사용한다.
- 현재 단계는 **UI 전용**: 실제 API/DB/AI 연동 없이 `lib/mock/`의 목업 데이터와 `types/`의 타입만 사용한다.
- 새 화면은 `app/(app)/` 아래에, 인증 화면은 `app/(auth)/` 아래에 둔다.
- AI 결과 화면에는 원문 근거, 신뢰도, 사용자 검토 상태를 함께 표시한다(기획서 제품 원칙).
- 작업 후 `npm run lint`, `npm run build`가 통과하는지 확인한다.
