-- 상담 녹음(통화 녹음 파일·앱 녹음) 첨부
alter table public.consultations
  add column audio_path text,
  add column audio_name text,
  add column audio_size bigint,
  add column audio_duration_sec integer check (audio_duration_sec is null or audio_duration_sec >= 0);

-- 경로는 {office_id}/{customer_id}/{uuid}.ext
alter table public.consultations
  add constraint consultations_audio_path_check
  check (audio_path is null or (audio_path like office_id::text || '/' || customer_id::text || '/%' and audio_path not like '%..%'));

-- 통화 녹음은 길어서 50MB(무료 플랜 업로드 한도)까지. 갤럭시 통화 녹음은 m4a, 구형은 amr/3gp
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'consultation-audio', 'consultation-audio', false, 52428800,
  array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/amr', 'audio/3gpp']
)
on conflict (id) do nothing;

-- 임장 녹음도 앱 백그라운드 녹음(긴 녹음) 대응
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/amr', 'audio/3gpp']
where id = 'visit-audio';

create policy "consultation_audio_select" on storage.objects for select to authenticated
  using (bucket_id = 'consultation-audio' and (storage.foldername(name))[1] = public.current_office_id()::text);
create policy "consultation_audio_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'consultation-audio' and (storage.foldername(name))[1] = public.current_office_id()::text);
create policy "consultation_audio_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'consultation-audio' and (storage.foldername(name))[1] = public.current_office_id()::text);
