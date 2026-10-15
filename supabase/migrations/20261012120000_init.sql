-- 집앤 초기 스키마
-- 모든 업무 데이터는 office_id 단위로 분리되고, RLS로 같은 사무소 구성원만 접근한다.

create extension if not exists pgcrypto with schema extensions;

-- ─────────────────────────────────────────────
-- 사무소 / 구성원
-- ─────────────────────────────────────────────
create table public.offices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  registration_no text,
  representative text,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  office_id uuid not null references public.offices (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  role text not null default 'agent' check (role in ('owner', 'agent', 'staff')),
  license_no text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index profiles_office_id_idx on public.profiles (office_id);

create table public.office_invites (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  email text not null,
  role text not null default 'agent' check (role in ('agent', 'staff')),
  token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  invited_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);
create index office_invites_office_id_idx on public.office_invites (office_id);

-- 현재 로그인 사용자의 사무소/역할 (RLS 정책에서 재귀 없이 사용)
create or replace function public.current_office_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select office_id from public.profiles where id = auth.uid() and active
$$;

create or replace function public.current_role_is(target text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and active and role = target
  )
$$;

-- ─────────────────────────────────────────────
-- 매물
-- ─────────────────────────────────────────────
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  title text not null,
  address text not null,
  region text,
  deal_type text not null check (deal_type in ('매매', '전세', '월세')),
  property_type text not null check (property_type in ('아파트', '오피스텔', '빌라', '원룸', '상가')),
  status text not null default '임장 전'
    check (status in ('임장 전', '광고 중', '계약 진행', '계약 완료', '보류')),
  price integer not null default 0,
  monthly_rent integer,
  maintenance_fee integer,
  area_m2 numeric(8, 2),
  floor integer,
  total_floors integer,
  direction text,
  rooms integer,
  baths integer,
  available_from date,
  manager_id uuid references public.profiles (id) on delete set null,
  description text,
  highlights text[] not null default '{}',
  internal_memo text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index properties_office_id_idx on public.properties (office_id, created_at desc);

create table public.property_photos (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  storage_path text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index property_photos_property_id_idx on public.property_photos (property_id, sort_order);

create table public.property_visits (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  visited_at timestamptz not null default now(),
  memo text,
  -- [{ "label": "방향", "value": "남향", "note": "임대인 구두 안내" }]
  fields jsonb not null default '[]',
  -- [{ "label": "누수 흔적", "checked": false }]
  checklist jsonb not null default '[]',
  follow_ups text[] not null default '{}',
  audio_path text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index property_visits_property_id_idx on public.property_visits (property_id, visited_at desc);

create table public.property_events (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);
create index property_events_property_id_idx on public.property_events (property_id, created_at desc);

-- ─────────────────────────────────────────────
-- 공부서류
-- ─────────────────────────────────────────────
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  doc_type text not null check (doc_type in ('등기사항증명서', '건축물대장', '기타')),
  file_name text not null,
  storage_path text not null unique,
  file_size integer,
  issued_at date,
  status text not null default '검토 필요' check (status in ('검토 필요', '검토 완료')),
  uploaded_by uuid references public.profiles (id) on delete set null,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index documents_office_id_idx on public.documents (office_id, created_at desc);
create index documents_property_id_idx on public.documents (property_id);

create table public.document_fields (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  label text not null,
  value text not null,
  page integer,
  evidence_text text,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);
create index document_fields_document_id_idx on public.document_fields (document_id, created_at);

create table public.document_signals (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  level text not null check (level in ('전문가 검토', '확인 필요', '참고')),
  title text not null,
  description text,
  page integer,
  evidence_text text,
  next_action text,
  created_at timestamptz not null default now()
);
create index document_signals_document_id_idx on public.document_signals (document_id, created_at);

-- ─────────────────────────────────────────────
-- 고객 / 상담
-- ─────────────────────────────────────────────
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  name text not null,
  phone text,
  deal_type text check (deal_type in ('매매', '전세', '월세')),
  regions text,
  budget_min integer,
  budget_max integer,
  move_in_date date,
  must_have text,
  exclude text,
  memo text,
  status text not null default '진행 중' check (status in ('진행 중', '계약 완료', '보류', '종료')),
  manager_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customers_office_id_idx on public.customers (office_id, created_at desc);

create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  consulted_at timestamptz not null default now(),
  channel text not null default '방문' check (channel in ('방문', '전화', '메시지', '기타')),
  content text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index consultations_customer_id_idx on public.consultations (customer_id, consulted_at desc);

create table public.customer_properties (
  office_id uuid not null references public.offices (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  primary key (customer_id, property_id)
);
create index customer_properties_property_id_idx on public.customer_properties (property_id);

-- ─────────────────────────────────────────────
-- 할 일 / 후속 일정
-- ─────────────────────────────────────────────
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  title text not null,
  type text not null default '기타' check (type in ('임장', '상담', '문서', '계약', '연락', '기타')),
  due_at timestamptz not null,
  done boolean not null default false,
  property_id uuid references public.properties (id) on delete set null,
  customer_id uuid references public.customers (id) on delete cascade,
  assignee_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index tasks_office_due_idx on public.tasks (office_id, due_at);

-- ─────────────────────────────────────────────
-- 거래 / 계약 준비
-- ─────────────────────────────────────────────
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  stage text not null default '조건 협의'
    check (stage in ('조건 협의', '서류 확인', '계약 준비', '잔금 대기', '완료', '취소')),
  contract_date date,
  balance_date date,
  amount integer,
  memo text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index deals_office_id_idx on public.deals (office_id, created_at desc);

create table public.deal_checklist_items (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  deal_id uuid not null references public.deals (id) on delete cascade,
  category text not null default '기타',
  label text not null,
  done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index deal_checklist_items_deal_id_idx on public.deal_checklist_items (deal_id, sort_order);

create table public.deal_clauses (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  deal_id uuid not null references public.deals (id) on delete cascade,
  body text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index deal_clauses_deal_id_idx on public.deal_clauses (deal_id, sort_order);

create table public.office_clauses (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  category text not null default '기타',
  title text not null,
  body text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index office_clauses_office_id_idx on public.office_clauses (office_id);

-- ─────────────────────────────────────────────
-- 고객 브리핑 공유 링크
-- ─────────────────────────────────────────────
create table public.briefings (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  sections jsonb not null default '{}',
  comment text,
  expires_at timestamptz not null default now() + interval '14 days',
  view_count integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index briefings_property_id_idx on public.briefings (property_id, created_at desc);

-- ─────────────────────────────────────────────
-- updated_at 자동 갱신
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger properties_updated_at before update on public.properties
  for each row execute function public.set_updated_at();
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create trigger deals_updated_at before update on public.deals
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- 회원가입 시 사무소/프로필 생성
-- raw_user_meta_data: { name, phone, license_no, office_name, invite_token }
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  invite public.office_invites%rowtype;
  new_office_id uuid;
begin
  if nullif(meta ->> 'invite_token', '') is not null then
    select * into invite
    from public.office_invites
    where token = meta ->> 'invite_token'
      and accepted_at is null
      and expires_at > now()
      and lower(email) = lower(new.email);

    if not found then
      raise exception '유효하지 않거나 만료된 초대입니다.';
    end if;

    insert into public.profiles (id, office_id, name, email, phone, role, license_no)
    values (
      new.id, invite.office_id, coalesce(meta ->> 'name', split_part(new.email, '@', 1)),
      new.email, meta ->> 'phone', invite.role, nullif(meta ->> 'license_no', '')
    );

    update public.office_invites set accepted_at = now() where id = invite.id;
  else
    insert into public.offices (name, registration_no, representative, phone)
    values (
      coalesce(nullif(meta ->> 'office_name', ''), '내 중개사무소'),
      nullif(meta ->> 'license_no', ''),
      meta ->> 'name',
      meta ->> 'phone'
    )
    returning id into new_office_id;

    insert into public.profiles (id, office_id, name, email, phone, role, license_no)
    values (
      new.id, new_office_id, coalesce(meta ->> 'name', split_part(new.email, '@', 1)),
      new.email, meta ->> 'phone', 'owner', nullif(meta ->> 'license_no', '')
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 초대 링크 확인 (비로그인 회원가입 화면에서 사용)
create or replace function public.get_invite(invite_token text)
returns table (office_name text, email text, role text)
language sql
stable
security definer
set search_path = ''
as $$
  select o.name, i.email, i.role
  from public.office_invites i
  join public.offices o on o.id = i.office_id
  where i.token = invite_token and i.accepted_at is null and i.expires_at > now()
$$;

-- 공개 브리핑 조회 (내부 메모·개인정보 제외)
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

grant execute on function public.get_invite(text) to anon, authenticated;
grant execute on function public.get_briefing(text) to anon, authenticated;

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────
alter table public.offices enable row level security;
alter table public.profiles enable row level security;
alter table public.office_invites enable row level security;
alter table public.properties enable row level security;
alter table public.property_photos enable row level security;
alter table public.property_visits enable row level security;
alter table public.property_events enable row level security;
alter table public.documents enable row level security;
alter table public.document_fields enable row level security;
alter table public.document_signals enable row level security;
alter table public.customers enable row level security;
alter table public.consultations enable row level security;
alter table public.customer_properties enable row level security;
alter table public.tasks enable row level security;
alter table public.deals enable row level security;
alter table public.deal_checklist_items enable row level security;
alter table public.deal_clauses enable row level security;
alter table public.office_clauses enable row level security;
alter table public.briefings enable row level security;

-- 사무소: 구성원 조회, 대표만 수정
create policy "offices_select" on public.offices for select to authenticated
  using (id = public.current_office_id());
create policy "offices_update" on public.offices for update to authenticated
  using (id = public.current_office_id() and public.current_role_is('owner'))
  with check (id = public.current_office_id());

-- 프로필: 같은 사무소 조회, 본인 수정, 대표는 구성원 역할/활성 수정
create policy "profiles_select" on public.profiles for select to authenticated
  using (office_id = public.current_office_id());
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and office_id = public.current_office_id());
-- 초대: 대표만 관리
create policy "invites_owner_all" on public.office_invites for all to authenticated
  using (office_id = public.current_office_id() and public.current_role_is('owner'))
  with check (office_id = public.current_office_id() and public.current_role_is('owner'));
alter table public.office_invites alter column office_id set default public.current_office_id();

-- 나머지 업무 테이블: 같은 사무소 구성원 전체 권한
do $$
declare
  t text;
begin
  foreach t in array array[
    'properties', 'property_photos', 'property_visits', 'property_events',
    'documents', 'document_fields', 'document_signals',
    'customers', 'consultations', 'customer_properties', 'tasks',
    'deals', 'deal_checklist_items', 'deal_clauses', 'office_clauses', 'briefings'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (office_id = public.current_office_id())
         with check (office_id = public.current_office_id())',
      t || '_office_all', t
    );
    execute format(
      'alter table public.%I alter column office_id set default public.current_office_id()', t
    );
  end loop;
end;
$$;

-- profiles.role / active / verification_status 는 직접 수정 불가 (아래 함수로만 변경)
revoke update on public.profiles from authenticated;
grant update (name, phone, license_no) on public.profiles to authenticated;

create or replace function public.update_member(member_id uuid, new_role text, new_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.current_role_is('owner') then
    raise exception '대표만 구성원 권한을 변경할 수 있습니다.';
  end if;
  if member_id = auth.uid() then
    raise exception '본인의 권한은 변경할 수 없습니다.';
  end if;
  if new_role not in ('agent', 'staff') then
    raise exception '허용되지 않는 역할입니다.';
  end if;

  update public.profiles
  set role = new_role, active = new_active
  where id = member_id and office_id = public.current_office_id();
end;
$$;

grant execute on function public.update_member(uuid, text, boolean) to authenticated;

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
  )
$$;

grant execute on function public.is_public_briefing_photo(text) to anon, authenticated;

-- ─────────────────────────────────────────────
-- Storage
-- 경로 규칙: {office_id}/{property_id}/{파일명}
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('property-photos', 'property-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('visit-audio', 'visit-audio', false, 26214400, array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/webm', 'audio/ogg']),
  ('documents', 'documents', false, 20971520, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "office_files_select" on storage.objects for select to authenticated
  using (
    bucket_id in ('property-photos', 'visit-audio', 'documents')
    and (storage.foldername(name))[1] = public.current_office_id()::text
  );
create policy "office_files_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('property-photos', 'visit-audio', 'documents')
    and (storage.foldername(name))[1] = public.current_office_id()::text
  );
create policy "office_files_delete" on storage.objects for delete to authenticated
  using (
    bucket_id in ('property-photos', 'visit-audio', 'documents')
    and (storage.foldername(name))[1] = public.current_office_id()::text
  );

-- 유효한 브리핑 링크가 있는 매물 사진은 비로그인 사용자도 서명 URL 발급 가능
create policy "briefing_photos_public_select" on storage.objects for select to anon, authenticated
  using (bucket_id = 'property-photos' and public.is_public_briefing_photo(name));
