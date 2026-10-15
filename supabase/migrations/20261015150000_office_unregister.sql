-- 대표가 사무소 등록(개설등록·사업자 인증)을 취소하고 다시 등록할 수 있게 한다.
-- 등록 해제는 권한을 줄이는 방향이라 서버 비밀값 없이 대표 확인만 한다.
create or replace function public.unregister_office()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me public.profiles%rowtype;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.id is null or me.role <> 'owner' then
    raise exception '사무소 등록 취소는 대표만 할 수 있어요.';
  end if;

  update public.offices
  set registration_no = null,
      representative = null,
      business_no = null,
      registry_data = null,
      registered_at = null
  where id = me.office_id;
end;
$$;

revoke execute on function public.unregister_office() from public, anon;
grant execute on function public.unregister_office() to authenticated;
