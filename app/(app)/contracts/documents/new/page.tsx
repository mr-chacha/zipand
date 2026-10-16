import { redirect } from "next/navigation";

/** 예전 단계별 작성 URL → 계약서 관리에서 작성 창을 연다 */
export default function NewContractDocumentRedirectPage() {
  redirect("/contracts/documents?write=1");
}
