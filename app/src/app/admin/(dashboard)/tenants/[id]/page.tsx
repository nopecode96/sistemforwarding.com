export const dynamic = "force-dynamic";

import { getTenantDetailById } from "@/actions/adminTenantActions";
import { notFound } from "next/navigation";
import { TenantDetailView } from "@/components/admin/TenantDetailView";

interface TenantDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TenantDetailPage({ params }: TenantDetailPageProps) {
  const { id } = await params;
  const tenant = await getTenantDetailById(id);

  if (!tenant) {
    notFound();
  }

  return <TenantDetailView initialTenant={tenant} />;
}
