-- 대시보드 캘린더에서 잔금·중도금 일정을 직접 추가할 수 있도록 할 일 종류를 넓힌다
alter table public.tasks drop constraint tasks_type_check;
alter table public.tasks add constraint tasks_type_check
  check (type in ('임장', '상담', '문서', '계약', '중도금', '잔금', '연락', '기타'));
