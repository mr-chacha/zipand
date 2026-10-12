-- 입주 가능일 '협의 가능' (날짜 대신 선택)
alter table public.properties add column available_negotiable boolean not null default false;

create or replace function public.get_briefing(briefing_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  b public.briefings%rowtype;
  result jsonb;
begin
  select * into b from public.briefings where token = briefing_token and expires_at > now();
  if not found then
    return null;
  end if;

  update public.briefings set view_count = view_count + 1 where id = b.id;

  select jsonb_build_object(
    'sections', b.sections,
    'comment', b.comment,
    'expires_at', b.expires_at,
    'property', jsonb_build_object(
      'title', p.title,
      'region', p.region,
      'deal_type', p.deal_type,
      'property_type', p.property_type,
      'price', p.price,
      'monthly_rent', p.monthly_rent,
      'maintenance_fee', p.maintenance_fee,
      'area_m2', p.area_m2,
      'floor', p.floor,
      'total_floors', p.total_floors,
      'direction', p.direction,
      'rooms', p.rooms,
      'baths', p.baths,
      'available_from', p.available_from,
      'available_negotiable', p.available_negotiable,
      'highlights', p.highlights
    ),
    'photos', coalesce((
      select jsonb_agg(ph.storage_path order by ph.sort_order, ph.created_at)
      from public.property_photos ph where ph.property_id = p.id
    ), '[]'::jsonb),
    'follow_ups', coalesce((
      select to_jsonb(v.follow_ups)
      from public.property_visits v where v.property_id = p.id
      order by v.visited_at desc limit 1
    ), '[]'::jsonb),
    'office', jsonb_build_object('name', o.name, 'phone', o.phone, 'address', o.address),
    'agent', jsonb_build_object('name', coalesce(m.name, c.name), 'phone', coalesce(m.phone, c.phone))
  )
  into result
  from public.properties p
  join public.offices o on o.id = p.office_id
  left join public.profiles m on m.id = p.manager_id
  left join public.profiles c on c.id = b.created_by
  where p.id = b.property_id;

  return result;
end;
$$;
