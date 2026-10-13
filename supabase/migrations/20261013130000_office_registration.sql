-- 사무소 등록(공공데이터 조회로 확인한 개설등록 정보). 인증(verification)은 추후 별도 개발
alter table public.offices
  add column registered_at timestamptz,
  add column registry_data jsonb;

-- 사무소 등록 전: 매물·고객은 1건까지, 문서·거래는 등록 불가
create or replace function public.enforce_office_registration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_registered boolean;
  existing int;
begin
  select o.registered_at is not null into is_registered from public.offices o where o.id = new.office_id;
  if is_registered then
    return new;
  end if;

  if tg_table_name in ('properties', 'customers') then
    execute format('select count(*) from public.%I where office_id = $1', tg_table_name)
      into existing using new.office_id;
    if existing < 1 then
      return new;
    end if;
    raise exception '사무소 정보를 등록하면 % 계속 등록할 수 있어요.',
      case tg_table_name when 'properties' then '매물을' else '고객을' end;
  end if;

  raise exception '사무소 정보를 등록하면 % 등록할 수 있어요.',
    case tg_table_name when 'documents' then '문서를' else '계약을' end;
end;
$$;

create trigger properties_office_registration before insert on public.properties
  for each row execute function public.enforce_office_registration();
create trigger customers_office_registration before insert on public.customers
  for each row execute function public.enforce_office_registration();
create trigger documents_office_registration before insert on public.documents
  for each row execute function public.enforce_office_registration();
create trigger deals_office_registration before insert on public.deals
  for each row execute function public.enforce_office_registration();
