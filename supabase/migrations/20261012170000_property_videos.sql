-- 매물 동영상: 비공개 버킷 + 메타데이터 테이블 (사진과 같은 경로 규칙 {office_id}/{property_id}/{uuid}.ext)
create table public.property_videos (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null default public.current_office_id() references public.offices (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  storage_path text not null unique,
  file_name text,
  size_bytes bigint,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index property_videos_property_id_idx on public.property_videos (property_id, sort_order);

alter table public.property_videos enable row level security;
create policy "property_videos_office_all" on public.property_videos for all to authenticated
  using (office_id = public.current_office_id())
  with check (office_id = public.current_office_id());

-- Supabase 무료 플랜의 업로드 최대 크기(50MB)에 맞춘다
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-videos', 'property-videos', false, 52428800, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;

create policy "office_videos_select" on storage.objects for select to authenticated
  using (bucket_id = 'property-videos' and (storage.foldername(name))[1] = public.current_office_id()::text);
create policy "office_videos_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'property-videos' and (storage.foldername(name))[1] = public.current_office_id()::text);
create policy "office_videos_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'property-videos' and (storage.foldername(name))[1] = public.current_office_id()::text);
