-- 사무소 등록 전 제한 확대: 구성원 초대, 고객 브리핑 공유, 상담 기록, 고객-매물 연결도 불가
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

  raise exception '사무소 정보를 등록하면 %',
    case tg_table_name
      when 'documents' then '문서를 등록할 수 있어요.'
      when 'deals' then '계약을 등록할 수 있어요.'
      when 'office_invites' then '구성원을 초대할 수 있어요.'
      when 'briefings' then '고객 브리핑을 공유할 수 있어요.'
      when 'consultations' then '상담을 기록할 수 있어요.'
      when 'customer_properties' then '고객과 매물을 연결할 수 있어요.'
      else '이용할 수 있어요.'
    end;
end;
$$;

create trigger office_invites_office_registration before insert on public.office_invites
  for each row execute function public.enforce_office_registration();
create trigger briefings_office_registration before insert on public.briefings
  for each row execute function public.enforce_office_registration();
create trigger consultations_office_registration before insert on public.consultations
  for each row execute function public.enforce_office_registration();
create trigger customer_properties_office_registration before insert on public.customer_properties
  for each row execute function public.enforce_office_registration();
