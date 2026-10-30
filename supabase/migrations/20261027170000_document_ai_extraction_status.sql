-- 업로드와 AI 추출을 분리하고 문서별 추출 진행 상태를 표시한다.
alter table public.documents
  add column extraction_status text not null default '미추출'
    check (extraction_status in ('미추출', '추출 중', '검토 필요', '추출 완료', '추출 실패')),
  add column extracted_at timestamptz,
  add column extraction_error text;

-- 기존 AI 추출 결과가 있는 문서는 현재 검토 상태를 반영한다.
update public.documents d
set
  extraction_status = case when d.status = '검토 완료' then '추출 완료' else '검토 필요' end,
  extracted_at = now()
where exists (
  select 1
  from public.document_fields f
  where f.document_id = d.id
    and f.ai_generated = true
);
