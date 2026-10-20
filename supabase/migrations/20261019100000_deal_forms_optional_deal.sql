-- 영수증·공과금 등 관련 서식은 거래 연결 없이 수기 작성 가능
alter table public.deal_forms
  alter column deal_id drop not null;

alter table public.deal_form_shares
  alter column deal_id drop not null;

-- 공개 공유: 거래 없는 서식도 form.data의 물건 정보로 조회
create or replace function public.get_deal_form_share(share_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.deal_form_shares%rowtype;
  result jsonb;
begin
  select * into s from public.deal_form_shares where token = share_token and expires_at > now();
  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'expires_at', s.expires_at,
    'form', jsonb_build_object(
      'kind', f.kind,
      'title', f.title,
      'status', f.status,
      'data', f.data,
      'finalized_at', f.finalized_at
    ),
    'property', jsonb_build_object(
      'title', coalesce(p.title, f.data->>'property_title', f.data->>'property_label', ''),
      'address', coalesce(p.address, f.data->>'property_address', f.data->>'property_label', ''),
      'deal_type', coalesce(p.deal_type, f.data->>'deal_type', ''),
      'property_type', coalesce(p.property_type, f.data->>'property_type', '')
    ),
    'office', jsonb_build_object('name', o.name, 'phone', o.phone, 'address', o.address),
    'agent', jsonb_build_object('name', a.name, 'phone', a.phone)
  )
  into result
  from public.deal_forms f
  join public.offices o on o.id = f.office_id
  left join public.deals d on d.id = f.deal_id and d.stage <> '취소'
  left join public.properties p on p.id = d.property_id
  left join public.profiles a on a.id = coalesce(s.created_by, f.created_by)
  where f.id = s.form_id and f.status = 'finalized';

  if result is null then
    return null;
  end if;

  update public.deal_form_shares set view_count = view_count + 1 where id = s.id;
  return result;
end;
$$;
