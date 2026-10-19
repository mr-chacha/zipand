-- 사무소 공제증서 (업로드 후 계약관리에서 다운로드·인쇄)
alter table public.offices
  add column if not exists guarantee_certificate_path text,
  add column if not exists guarantee_certificate_name text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'office-docs',
  'office-docs',
  false,
  20971520,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 경로: {office_id}/guarantee/{uuid}.ext — 같은 사무소 구성원만 접근
create policy "office_docs_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'office-docs'
    and (storage.foldername(name))[1] = public.current_office_id()::text
  );
create policy "office_docs_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'office-docs'
    and (storage.foldername(name))[1] = public.current_office_id()::text
  );
create policy "office_docs_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'office-docs'
    and (storage.foldername(name))[1] = public.current_office_id()::text
  );
create policy "office_docs_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'office-docs'
    and (storage.foldername(name))[1] = public.current_office_id()::text
  );
