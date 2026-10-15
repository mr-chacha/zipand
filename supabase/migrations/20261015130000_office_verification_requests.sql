-- 공공데이터·국세청 조회로 확인되지 않는 사무소: 중개사무소 등록증·사업자등록증을 올려 관리자 심사로 등록
create table public.office_verification_requests (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null default public.current_office_id() references public.offices (id) on delete cascade,
  requested_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  office_name text not null,
  registration_no text,
  business_no text,
  license_doc_path text not null,
  business_doc_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_memo text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index office_verification_requests_office_id_idx on public.office_verification_requests (office_id, created_at desc);

alter table public.office_verification_requests enable row level security;

-- 대표만 신청·조회. 상태 변경(승인·반려)은 관리자가 대시보드에서 한다
create policy "verification_requests_owner_select" on public.office_verification_requests for select to authenticated
  using (office_id = public.current_office_id() and public.current_role_is('owner'));
create policy "verification_requests_owner_insert" on public.office_verification_requests for insert to authenticated
  with check (
    office_id = public.current_office_id()
    and public.current_role_is('owner')
    and requested_by = auth.uid()
    and status = 'pending'
    and review_memo is null
    and reviewed_at is null
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('office-verification', 'office-verification', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy "office_verification_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'office-verification'
    and (storage.foldername(name))[1] = public.current_office_id()::text
    and public.current_role_is('owner')
  );
create policy "office_verification_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'office-verification'
    and (storage.foldername(name))[1] = public.current_office_id()::text
    and public.current_role_is('owner')
  );
