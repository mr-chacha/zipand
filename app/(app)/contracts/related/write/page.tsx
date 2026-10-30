import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { RelatedFormsWritePage } from "./related-forms-page";

export const metadata: Metadata = { title: "영수증 관련서식" };

export default async function RelatedFormsWriteRoute() {
  const { profile, office } = await getSession();
  return (
    <RelatedFormsWritePage
      office={{
        officeName: office.name,
        officePhone: office.phone,
        officeAddress: office.address,
        officeRepresentative: office.representative,
        officeRegistrationNo: office.registration_no,
        agentName: profile.name,
        agentPhone: profile.phone,
      }}
    />
  );
}
