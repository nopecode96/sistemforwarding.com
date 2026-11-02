export const dynamic = "force-dynamic";

import { getPlatformAnalyticsOverview } from "@/actions/adminAnalyticsActions";
import { AnalyticsDashboardView } from "@/components/admin/AnalyticsDashboardView";

export default async function AdminAnalyticsPage() {
  const data = await getPlatformAnalyticsOverview();

  return <AnalyticsDashboardView initialData={data} />;
}
