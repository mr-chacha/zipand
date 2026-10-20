-- 매물 동·호수 (집합건물 등)
alter table public.properties
  add column if not exists building text,
  add column if not exists unit text;
