import type { Metadata } from "next";
import { loadContractWriteOptions } from "@/lib/contract-write-data";
import { DisclosureWritePageClient } from "./disclosure-write-page";

export const metadata: Metadata = { title: "확인설명서 작성" };

export default async function DisclosureWritePage() {
  const { deals, properties } = await loadContractWriteOptions();
  return <DisclosureWritePageClient deals={deals} properties={properties} />;
}
