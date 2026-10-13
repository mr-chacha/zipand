-- 매물 관계자 연락처 (내부용 — get_briefing에 포함하지 않는다)
alter table public.properties
  add column landlord_name text,
  add column landlord_phone text,
  add column caretaker_name text,
  add column caretaker_phone text,
  add column tenant_name text,
  add column tenant_phone text;
