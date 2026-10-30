-- 매물 등록·수정 시 카카오 입지 조회 결과를 보관해 확인설명서 작성 때 자동 반영
alter table public.properties
  add column if not exists location_fields jsonb;

comment on column public.properties.location_fields is
  '확인설명서 입지조건 필드(카카오 주변 조회). bus_stop, subway_station, school_* 등';
