export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getAffiliatePortalData } from "@/actions/affiliateActions";
import { AffiliatePortalContent } from "@/components/public/AffiliatePortalContent";

export const metadata: Metadata = {
  title: "Konsol Afiliasi & Komisi | sistemforwarding.com",
  description: "Dasbor pemantauan performa link referral, tenant aktif, dan penarikan saldo komisi afiliator sistemforwarding.com.",
};

export default async function AffiliatePortalPage() {
  const result = await getAffiliatePortalData();

  if (!result.authenticated || !result.data) {
    redirect("/affiliate/login");
  }

  const rootDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "sistemforwarding.com";

  return <AffiliatePortalContent initialData={result.data} rootDomain={rootDomain} />;
}
