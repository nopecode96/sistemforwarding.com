import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getArticleBySlugFromDb, getArticlesFromDb } from '@/lib/articles';
import { ArticleDetailContent } from '@/components/public/ArticleDetailContent';

export const dynamic = 'force-dynamic';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlugFromDb(slug);

  if (!article) {
    return {
      title: 'Artikel Tidak Ditemukan | Sistem Forwarding',
    };
  }

  return {
    title: `${article.title} | Sistem Forwarding`,
    description: article.summary,
    keywords: `${article.category}, sistem forwarding, freight forwarding indonesia, logistik, ${article.title.toLowerCase()}`,
    alternates: { canonical: `https://sistemforwarding.com/blog/${article.slug}` },
    openGraph: {
      title: `${article.title} | Sistem Forwarding`,
      description: article.summary,
      url: `https://sistemforwarding.com/blog/${article.slug}`,
      siteName: 'Sistem Forwarding',
      locale: 'id_ID',
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
      images: [
        {
          url: article.coverImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlugFromDb(slug);

  if (!article) {
    notFound();
  }

  const allArticles = await getArticlesFromDb();
  const relatedArticles = allArticles.filter((a) => a.slug !== slug).slice(0, 2);

  return <ArticleDetailContent article={article} relatedArticles={relatedArticles} />;
}
