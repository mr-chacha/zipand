import { redirect } from "next/navigation";

export default function NewContractDocumentPage() {
  redirect("/contracts?write=1");
}
