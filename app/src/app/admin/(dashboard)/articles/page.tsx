export const dynamic = "force-dynamic";

import { getAdminArticles } from "@/actions/adminArticleActions";
import { ArticleManagementView } from "@/components/admin/ArticleManagementView";

export default async function AdminArticlesPage() {
  const data = await getAdminArticles();

  return <ArticleManagementView initialData={data} />;
}
