export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getFinanceDashboardStats } from "@/actions/financeActions";
import { FinanceView } from "@/components/tenant/FinanceView";

interface FinancePageProps {
  params: Promise<{
    tenant: string;
  }>;
}

async function FinanceContent({ params }: FinancePageProps) {
  const { tenant } = await params;
  const stats = await getFinanceDashboardStats(tenant);

  return <FinanceView stats={stats} />;
}

export default function FinancePage(props: FinancePageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">
            Mengkalkulasi Laba/Rugi Kotor &amp; Antrean Invoicing...
          </p>
        </div>
      }
    >
      <FinanceContent {...props} />
    </Suspense>
  );
}
