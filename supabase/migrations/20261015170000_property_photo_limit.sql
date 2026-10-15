-- 매물 사진은 매물당 최대 10장 (lib/storage.ts MEDIA_LIMITS.photo.maxCount와 같게 유지)
create or replace function public.enforce_property_photo_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- 동시에 여러 요청이 올려도 개수를 넘지 않도록 매물 행을 잠근다
  perform 1 from public.properties where id = new.property_id for update;
  if (select count(*) from public.property_photos where property_id = new.property_id) >= 10 then
    raise exception '사진은 매물당 최대 10장까지 등록할 수 있어요.';
  end if;
  return new;
end;
$$;

create trigger property_photos_limit before insert on public.property_photos
  for each row execute function public.enforce_property_photo_limit();
