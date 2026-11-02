export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { getAdminAffiliatesData } from "@/actions/affiliateActions";
import { AdminAffiliatesManager } from "@/components/admin/AdminAffiliatesManager";

export const metadata: Metadata = {
  title: "Manajemen Afiliasi & Mitra B2B | Super Admin sistemforwarding.com",
};

export default async function AdminAffiliatesPage() {
  const data = await getAdminAffiliatesData();
  return <AdminAffiliatesManager initialData={data} />;
}
