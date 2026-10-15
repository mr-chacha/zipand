-- 계약 준비를 단계별 화면으로 재구성
-- 순서: 서류 확인 → 조건 협의 → 계약 준비 → 잔금 대기 → 완료 / 취소

alter table public.deals alter column stage set default '서류 확인';
-- 기존 시작 단계(조건 협의)였던 거래는 새 시작 단계로 옮긴다
update public.deals set stage = '서류 확인' where stage = '조건 협의';

alter table public.deals
  -- 조건 협의 (amount = 매매금 / 전세금 / 월세 보증금, 만원)
  add column monthly_rent integer,
  add column move_in_date date,
  add column terms_note text,
  -- 계약 준비 (contract_date = 계약서 작성일, balance_date = 잔금일)
  add column down_payment integer,
  add column down_payment_date date,
  add column commission integer,
  add column lessor_name text,
  add column lessor_phone text,
  add column lessor_account text,
  add column lessee_name text,
  add column lessee_phone text,
  add column loan_note text,
  add column prep_note text,
  -- 잔금 대기
  add column commission_paid boolean not null default false,
  add column balance_note text,
  -- 완료 / 취소
  add column closing_note text,
  add column cancel_reason text;

-- 체크리스트 항목이 어느 단계 화면에 보일지
alter table public.deal_checklist_items
  add column stage text not null default '서류 확인'
    check (stage in ('서류 확인', '계약 준비', '잔금 대기'));

update public.deal_checklist_items set stage = '계약 준비' where category = '계약 준비';
update public.deal_checklist_items set stage = '잔금 대기' where category = '잔금·인도';
