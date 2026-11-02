export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { Suspense } from "react";
import { OnboardingWizard } from "@/components/public/OnboardingWizard";
import { getActivePlans } from "@/actions/planActions";

interface OnboardingPageProps {
  searchParams: Promise<{
    plan?: string;
  }>;
}

async function OnboardingContent({ searchParams }: OnboardingPageProps) {
  const { plan } = await searchParams;
  const initialPlan =
    plan === "monthly" || plan === "yearly" || plan === "pay_per_job"
      ? (plan as "trial" | "monthly" | "yearly" | "pay_per_job")
      : "trial";

  const dynamicPlans = await getActivePlans();

  return <OnboardingWizard initialPlan={initialPlan} dynamicPlans={dynamicPlans} />;
}

export default function OnboardingPage(props: OnboardingPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">
            Mempersiapkan Portal Onboarding...
          </p>
        </div>
      }
    >
      <OnboardingContent {...props} />
    </Suspense>
  );
}
