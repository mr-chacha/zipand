-- 기존 데이터의 고객 상태를 거래·상담 기록에 맞춘다 (이후에는 서버 액션이 맞춘다)

-- 거래가 있는 고객: 진행 중 거래(잔금 대기 → 계약 완료, 그 외 → 진행 중) / 완료 거래만 → 중개 완료
update public.customers c
set status = case
  when d.has_balance then '계약 완료'
  when d.has_active then '진행 중'
  else '중개 완료'
end
from (
  select
    customer_id,
    bool_or(stage not in ('완료', '취소')) as has_active,
    bool_or(stage = '잔금 대기') as has_balance,
    bool_or(stage = '완료') as has_done
  from public.deals
  where customer_id is not null
  group by customer_id
) d
where c.id = d.customer_id and (d.has_active or d.has_done);

-- 상담 기록이 있는데 아직 연락 전인 고객
update public.customers c
set status = '연락 완료'
where c.status = '연락 전'
  and exists (select 1 from public.consultations s where s.customer_id = c.id);
