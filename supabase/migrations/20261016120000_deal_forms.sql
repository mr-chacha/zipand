-- 계약서·확인설명서·영수증 등 거래 서식 (웹에서 작성, 확정 후 공유)
create table public.deal_forms (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null default public.current_office_id() references public.offices (id) on delete cascade,
  deal_id uuid not null references public.deals (id) on delete cascade,
  kind text not null check (kind in ('contract', 'disclosure', 'receipt', 'other')),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'finalized')),
  data jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finalized_at timestamptz
);
create index deal_forms_deal_id_idx on public.deal_forms (deal_id, created_at desc);
create index deal_forms_office_id_idx on public.deal_forms (office_id, created_at desc);

alter table public.deal_forms enable row level security;
create policy deal_forms_office_all on public.deal_forms for all to authenticated
  using (office_id = public.current_office_id())
  with check (office_id = public.current_office_id());

create trigger deal_forms_updated_at before update on public.deal_forms
  for each row execute function public.set_updated_at();

-- 확정된 서식만 임대인·임차인 공유
create table public.deal_form_shares (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null default public.current_office_id() references public.offices (id) on delete cascade,
  deal_id uuid not null references public.deals (id) on delete cascade,
  form_id uuid not null references public.deal_forms (id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  expires_at timestamptz not null default now() + interval '14 days',
  view_count integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index deal_form_shares_form_id_idx on public.deal_form_shares (form_id, created_at desc);
create index deal_form_shares_deal_id_idx on public.deal_form_shares (deal_id, created_at desc);

alter table public.deal_form_shares enable row level security;
create policy deal_form_shares_office_all on public.deal_form_shares for all to authenticated
  using (office_id = public.current_office_id())
  with check (office_id = public.current_office_id());

-- 공개 조회: 확정 서식의 data·제목·종류와 사무소·매물 요약만
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
      'title', p.title,
      'address', p.address,
      'deal_type', p.deal_type,
      'property_type', p.property_type
    ),
    'office', jsonb_build_object('name', o.name, 'phone', o.phone, 'address', o.address),
    'agent', jsonb_build_object('name', a.name, 'phone', a.phone)
  )
  into result
  from public.deal_forms f
  join public.deals d on d.id = f.deal_id
  join public.properties p on p.id = d.property_id
  join public.offices o on o.id = f.office_id
  left join public.profiles a on a.id = coalesce(s.created_by, f.created_by)
  where f.id = s.form_id and f.status = 'finalized' and d.stage <> '취소';

  if result is null then
    return null;
  end if;

  update public.deal_form_shares set view_count = view_count + 1 where id = s.id;
  return result;
end;
$$;

grant execute on function public.get_deal_form_share(text) to anon, authenticated;
