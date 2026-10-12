-- 고객 상태: 연락 전 → 연락 완료 → 진행 중 → 관심 고객 → 계약 완료 → 중개 완료 / 종료 (보류 제거)
alter table public.customers drop constraint if exists customers_status_check;

update public.customers set status = '진행 중' where status = '보류';

alter table public.customers
  add constraint customers_status_check
  check (status in ('연락 전', '연락 완료', '진행 중', '관심 고객', '계약 완료', '중개 완료', '종료'));

alter table public.customers alter column status set default '연락 전';
