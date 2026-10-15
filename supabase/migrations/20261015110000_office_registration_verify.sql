-- 사무소 등록 보호
-- 1) 등록된 개설등록번호·사업자등록번호는 한 사무소만 사용
-- 2) 등록 상태·등록 정보는 사용자가 직접 수정 불가, register_office RPC(서버 확인 절차)로만 변경
-- 3) 사업자등록 진위확인(국세청)까지 통과해야 등록 완료

alter table public.offices add column business_no text;

-- 사업자 확인 없이 등록된 사무소는 미등록으로 되돌린다 (적용 시점 원격에는 등록된 사무소 없음)
update public.offices set registered_at = null where registered_at is not null and business_no is null;

create unique index offices_registration_no_registered_key
  on public.offices (registration_no) where registered_at is not null;
create unique index offices_business_no_registered_key
  on public.offices (business_no) where registered_at is not null;

-- 서버 전용 비밀값(해시만 보관). private 스키마는 API로 노출되지 않는다
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.server_secrets (
  name text primary key,
  sha256 text not null
);
revoke all on private.server_secrets from public, anon, authenticated;

-- OFFICE_REGISTRATION_SECRET(.env.local)의 sha256
insert into private.server_secrets (name, sha256)
values ('office_registration', '5f0e17d9cd896d00973297446e8c84d7aedae319dfc5e93572870aef32c66757');

-- API 요청(authenticated/anon)으로는 등록 관련 컬럼을 바꿀 수 없다.
-- security definer RPC 안에서는 current_user가 함수 소유자라 통과한다.
create or replace function public.protect_office_registration()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if new.registered_at is distinct from old.registered_at
    or new.registry_data is distinct from old.registry_data
    or new.business_no is distinct from old.business_no then
    raise exception '사무소 등록 정보는 사무소 조회·인증으로만 변경할 수 있어요.';
  end if;
  if old.registered_at is not null and (
    new.name is distinct from old.name
    or new.registration_no is distinct from old.registration_no
    or new.representative is distinct from old.representative
  ) then
    raise exception '등록된 사무소의 이름·대표자·개설등록번호는 다시 조회해서만 변경할 수 있어요.';
  end if;
  return new;
end;
$$;

create trigger offices_protect_registration before update on public.offices
  for each row execute function public.protect_office_registration();

-- 서버가 공공데이터(개설등록)·국세청(사업자 진위) 확인을 마친 뒤 호출한다.
-- p_secret은 서버 환경변수에만 있으므로 브라우저에서 직접 호출해도 통과할 수 없다.
create or replace function public.register_office(
  p_secret text,
  p_registration_no text,
  p_name text,
  p_representative text,
  p_address text,
  p_phone text,
  p_business_no text,
  p_registry jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me public.profiles%rowtype;
begin
  if p_secret is null or encode(extensions.digest(p_secret, 'sha256'), 'hex') is distinct from (
    select s.sha256 from private.server_secrets s where s.name = 'office_registration'
  ) then
    raise exception '사무소 등록 확인에 실패했어요. 다시 시도해 주세요.';
  end if;

  select * into me from public.profiles where id = auth.uid();
  if me.id is null or me.role <> 'owner' then
    raise exception '사무소 등록은 대표만 할 수 있어요.';
  end if;

  begin
    update public.offices
    set name = p_name,
        registration_no = p_registration_no,
        representative = p_representative,
        address = coalesce(p_address, address),
        phone = coalesce(nullif(p_phone, ''), phone),
        business_no = p_business_no,
        registry_data = p_registry,
        registered_at = now()
    where id = me.office_id;
  exception when unique_violation then
    raise exception '이미 다른 사무소에서 등록한 개설등록번호 또는 사업자등록번호예요. 본인 사무소라면 고객센터로 문의해 주세요.';
  end;
end;
$$;

revoke execute on function public.register_office(text, text, text, text, text, text, text, jsonb) from public, anon;
grant execute on function public.register_office(text, text, text, text, text, text, text, jsonb) to authenticated;
