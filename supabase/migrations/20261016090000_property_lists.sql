-- 매물 리스트 공유: 고객 조건에 맞는 매물 여러 개를 골라 링크 하나로 보낸다
create table public.property_lists (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null default public.current_office_id() references public.offices (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  title text not null,
  comment text,
  token text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  expires_at timestamptz not null default now() + interval '14 days',
  view_count integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index property_lists_office_id_idx on public.property_lists (office_id, created_at desc);
create index property_lists_customer_id_idx on public.property_lists (customer_id);

create table public.property_list_items (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null default public.current_office_id() references public.offices (id) on delete cascade,
  list_id uuid not null references public.property_lists (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  sort_order integer not null default 0,
  unique (list_id, property_id)
);
create index property_list_items_list_id_idx on public.property_list_items (list_id, sort_order);
create index property_list_items_property_id_idx on public.property_list_items (property_id);

alter table public.property_lists enable row level security;
alter table public.property_list_items enable row level security;
create policy property_lists_office_all on public.property_lists for all to authenticated
  using (office_id = public.current_office_id())
  with check (office_id = public.current_office_id());
create policy property_list_items_office_all on public.property_list_items for all to authenticated
  using (office_id = public.current_office_id())
  with check (office_id = public.current_office_id());

-- 사무소 등록 전에는 매물 리스트도 공유할 수 없다 (브리핑과 같은 규칙)
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
      when 'property_lists' then '매물 리스트를 공유할 수 있어요.'
      when 'consultations' then '상담을 기록할 수 있어요.'
      when 'customer_properties' then '고객과 매물을 연결할 수 있어요.'
      else '이용할 수 있어요.'
    end;
end;
$$;

create trigger property_lists_office_registration before insert on public.property_lists
  for each row execute function public.enforce_office_registration();

-- 공개 조회: 브리핑과 같은 공개 필드만 (상세 주소·내부 메모·연락처 제외)
create or replace function public.get_property_list(list_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  l public.property_lists%rowtype;
  result jsonb;
begin
  select * into l from public.property_lists where token = list_token and expires_at > now();
  if not found then
    return null;
  end if;

  update public.property_lists set view_count = view_count + 1 where id = l.id;

  select jsonb_build_object(
    'title', l.title,
    'comment', l.comment,
    'expires_at', l.expires_at,
    'properties', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'title', p.title,
        'region', p.region,
        'deal_type', p.deal_type,
        'property_type', p.property_type,
        'status', p.status,
        'price', p.price,
        'monthly_rent', p.monthly_rent,
        'maintenance_fee', p.maintenance_fee,
        'maintenance_status', p.maintenance_status,
        'maintenance_items', p.maintenance_items,
        'area_m2', p.area_m2,
        'floor', p.floor,
        'total_floors', p.total_floors,
        'direction', p.direction,
        'rooms', p.rooms,
        'baths', p.baths,
        'available_from', p.available_from,
        'available_negotiable', p.available_negotiable,
        'highlights', p.highlights,
        'description', p.description,
        'photos', coalesce((
          select jsonb_agg(ph.storage_path order by ph.sort_order, ph.created_at)
          from public.property_photos ph where ph.property_id = p.id
        ), '[]'::jsonb)
      ) order by i.sort_order)
      from public.property_list_items i
      join public.properties p on p.id = i.property_id
      where i.list_id = l.id
    ), '[]'::jsonb),
    'office', jsonb_build_object('name', o.name, 'phone', o.phone, 'address', o.address),
    'agent', jsonb_build_object('name', a.name, 'phone', a.phone)
  )
  into result
  from public.offices o
  left join public.profiles a on a.id = l.created_by
  where o.id = l.office_id;

  return result;
end;
$$;

grant execute on function public.get_property_list(text) to anon, authenticated;

-- 공유 중인 매물 리스트에 포함된 사진도 공개 열람 허용
create or replace function public.is_public_briefing_photo(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.property_photos ph
    join public.briefings b on b.property_id = ph.property_id
    where ph.storage_path = object_name and b.expires_at > now()
  ) or exists (
    select 1
    from public.property_photos ph
    join public.property_list_items i on i.property_id = ph.property_id
    join public.property_lists l on l.id = i.list_id
    where ph.storage_path = object_name and l.expires_at > now()
  )
$$;
