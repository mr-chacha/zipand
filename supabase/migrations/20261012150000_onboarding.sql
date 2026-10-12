-- 간단 가입 후 온보딩(이름·사무소 이름) 완료 시각. null이면 첫 로그인 시 온보딩 화면으로 보낸다.
alter table public.profiles add column onboarded_at timestamptz;

-- 기존 회원은 가입 시 모든 정보를 입력했으므로 완료 처리
update public.profiles set onboarded_at = created_at where onboarded_at is null;

grant update (onboarded_at) on public.profiles to authenticated;
