-- AI 문서 정리 결과의 출처·신뢰도·사용자 검토 상태
alter table public.document_fields
  add column confidence smallint check (confidence between 0 and 100),
  add column ai_generated boolean not null default false;

alter table public.document_signals
  add column confidence smallint check (confidence between 0 and 100),
  add column ai_generated boolean not null default false,
  add column reviewed boolean not null default false;
