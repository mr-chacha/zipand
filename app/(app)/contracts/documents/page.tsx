import { redirect } from "next/navigation";

/** 계약서 목록은 계약관리(`/contracts`)로 통합 */
export default async function ContractDocumentsPage({ searchParams }: PageProps<"/contracts/documents">) {
  const sp = await searchParams;
  if (sp.write === "1" || sp.write === "true") redirect("/contracts/write");
  redirect("/contracts");
}
