-- 계약 진행 내용 공유 링크 (임대인·임차인 열람용)
create table public.deal_shares (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null default public.current_office_id() references public.offices (id) on delete cascade,
  deal_id uuid not null references public.deals (id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  expires_at timestamptz not null default now() + interval '14 days',
  view_count integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index deal_shares_deal_id_idx on public.deal_shares (deal_id, created_at desc);

alter table public.deal_shares enable row level security;
create policy deal_shares_office_all on public.deal_shares for all to authenticated
  using (office_id = public.current_office_id())
  with check (office_id = public.current_office_id());

-- 공개 조회: 계약 당사자에게 필요한 항목만 노출한다.
-- 제외: 내부 메모·준비/잔금/완료 메모·대출 메모, 당사자 연락처, 중개수수료, 취소 사유
create or replace function public.get_deal_share(share_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.deal_shares%rowtype;
  result jsonb;
begin
  select * into s from public.deal_shares where token = share_token and expires_at > now();
  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'expires_at', s.expires_at,
    'deal', jsonb_build_object(
      'stage', d.stage,
      'amount', d.amount,
      'monthly_rent', d.monthly_rent,
      'move_in_date', d.move_in_date,
      'terms_note', d.terms_note,
      'down_payment', d.down_payment,
      'down_payment_date', d.down_payment_date,
      'balance_date', d.balance_date,
      'contract_date', d.contract_date,
      'lessor_name', d.lessor_name,
      'lessor_account', d.lessor_account,
      'lessee_name', d.lessee_name
    ),
    'property', jsonb_build_object(
      'title', p.title,
      'address', p.address,
      'deal_type', p.deal_type,
      'property_type', p.property_type
    ),
    'checklist', coalesce((
      select jsonb_agg(jsonb_build_object('stage', i.stage, 'category', i.category, 'label', i.label, 'done', i.done)
        order by i.sort_order, i.created_at)
      from public.deal_checklist_items i where i.deal_id = d.id
    ), '[]'::jsonb),
    'clauses', coalesce((
      select jsonb_agg(c.body order by c.sort_order, c.created_at)
      from public.deal_clauses c where c.deal_id = d.id
    ), '[]'::jsonb),
    'office', jsonb_build_object('name', o.name, 'phone', o.phone, 'address', o.address),
    'agent', jsonb_build_object('name', a.name, 'phone', a.phone)
  )
  into result
  from public.deals d
  join public.properties p on p.id = d.property_id
  join public.offices o on o.id = d.office_id
  left join public.profiles a on a.id = coalesce(s.created_by, d.created_by)
  where d.id = s.deal_id and d.stage <> '취소';

  if result is null then
    return null;
  end if;

  update public.deal_shares set view_count = view_count + 1 where id = s.id;
  return result;
end;
$$;

grant execute on function public.get_deal_share(text) to anon, authenticated;
