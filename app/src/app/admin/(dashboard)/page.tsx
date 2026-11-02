export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function SuperAdminDashboardPage() {
  const headerList = await headers();
  const host = headerList.get("host") || "";
  const isAdminSubdomain = host.startsWith("admin.");
  redirect(isAdminSubdomain ? "/analytics" : "/admin/analytics");
}

