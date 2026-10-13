-- 관계자는 연락처만 받는다
alter table public.properties
  drop column landlord_name,
  drop column caretaker_name,
  drop column tenant_name;
