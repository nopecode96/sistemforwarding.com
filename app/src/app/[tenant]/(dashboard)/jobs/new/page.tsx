export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getInitialJobFormData } from "@/actions/jobActions";
import { NewJobFileForm } from "@/components/tenant/NewJobFileForm";

interface NewJobFilePageProps {
  params: Promise<{
    tenant: string;
  }>;
}

async function NewJobFileContent({ params }: NewJobFilePageProps) {
  const { tenant } = await params;
  const initialData = await getInitialJobFormData(tenant);

  return <NewJobFileForm initialData={initialData} />;
}

export default function NewJobFilePage(props: NewJobFilePageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">
            Mengambil Data Master Relasional Tenant dari Database...
          </p>
        </div>
      }
    >
      <NewJobFileContent {...props} />
    </Suspense>
  );
}
