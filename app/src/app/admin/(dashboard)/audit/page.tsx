export const dynamic = "force-dynamic";

import { getAuditLogs } from "@/actions/adminAuditActions";
import { AuditLogView } from "@/components/admin/AuditLogView";

export default async function AdminAuditPage() {
  const data = await getAuditLogs({ page: 1, pageSize: 20 });

  return <AuditLogView initialData={data} />;
}
