-- 사무소 AI 프로바이더·과금 방식 선택 (결제·실호출 연동 전 UI/설정용)
alter table public.offices
  add column ai_provider text
    check (ai_provider is null or ai_provider in ('openai', 'gemini')),
  add column billing_mode text
    check (billing_mode is null or billing_mode in ('subscription', 'credits')),
  add column plan_id text not null default 'free'
    check (plan_id in ('free', 'basic', 'pro', 'office')),
  add column ai_credit_balance integer not null default 0
    check (ai_credit_balance >= 0);

comment on column public.offices.ai_provider is 'AI 엔진: openai(GPT) | gemini. null이면 미선택';
comment on column public.offices.billing_mode is '과금: subscription(월 구독) | credits(토큰·크레딧 충전). null이면 미선택';
comment on column public.offices.plan_id is '구독 플랜 id (billing_mode=subscription일 때 사용)';
comment on column public.offices.ai_credit_balance is 'AI 크레딧 잔액 (billing_mode=credits일 때 사용, 테스트/차감용)';
