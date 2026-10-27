-- 매물별 카카오 주변 장소 검색어
alter table public.properties
  add column nearby_keywords text[] not null default
    array['지하철역', '버스정류장', '초등학교', '중학교', '고등학교', '병원', '대형마트', '편의점', '공원']::text[];
