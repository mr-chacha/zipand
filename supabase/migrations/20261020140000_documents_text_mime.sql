-- 등기 열람 요약(JSON/TXT) 저장 허용 — documents 버킷은 PDF·이미지만 허용 중이었음
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
  'application/json'
]
where id = 'documents';
