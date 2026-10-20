-- 매물 구조·주용도 (건축물대장 등에서 채움, 동 단위 정보)
alter table public.properties
  add column if not exists structure text,
  add column if not exists main_use text;
