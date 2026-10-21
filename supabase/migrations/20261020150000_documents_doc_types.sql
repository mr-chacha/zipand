-- 공부서류 종류 확장 (수동 업로드 · 확인설명서 체크 연동)
alter table public.documents drop constraint if exists documents_doc_type_check;
alter table public.documents
  add constraint documents_doc_type_check
  check (
    doc_type in (
      '등기사항증명서',
      '건축물대장',
      '토지대장',
      '지적도',
      '토지이용계획확인서',
      '부동산종합공부',
      '기타'
    )
  );
