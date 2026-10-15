-- 단계별 시작하기(/setup) 완료 시각. 완료 후에는 대시보드 안내를 숨기고 마이페이지에서 수정한다.
alter table public.profiles add column setup_completed_at timestamptz;

grant update (setup_completed_at) on public.profiles to authenticated;
