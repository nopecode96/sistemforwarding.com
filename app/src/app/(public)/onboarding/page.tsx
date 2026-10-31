export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { OnboardingWizard } from "@/components/public/OnboardingWizard";

interface OnboardingPageProps {
  searchParams: Promise<{
    plan?: string;
  }>;
}

async function OnboardingContent({ searchParams }: OnboardingPageProps) {
  const { plan } = await searchParams;
  const initialPlan =
    plan === "monthly" || plan === "yearly" ? (plan as "monthly" | "yearly") : "trial";

  return <OnboardingWizard initialPlan={initialPlan} />;
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
