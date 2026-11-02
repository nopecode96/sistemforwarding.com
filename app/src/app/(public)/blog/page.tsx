import type { Metadata } from 'next';
import { getArticlesFromDb } from '@/lib/articles';
import { BlogIndexContent } from '@/components/public/BlogIndexContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Artikel & Edukasi Freight Forwarding Indonesia | Sistem Forwarding',
  description:
    'Pusat edukasi dan panduan praktis operasional freight forwarding, manajemen Job File, regulasi perpajakan PPN 1.1% logistik, dan otomasi TMS autopilot di Indonesia.',
  keywords:
    'blog freight forwarding, edukasi logistik indonesia, panduan job file kargo, ppn logistik 1.1, otomasi invoice freight, tips bisnis ekspedisi',
  alternates: { canonical: 'https://sistemforwarding.com/blog' },
  openGraph: {
    title: 'Artikel & Edukasi Freight Forwarding Indonesia | Sistem Forwarding',
    description:
      'Pusat edukasi dan panduan praktis operasional freight forwarding, manajemen Job File, regulasi perpajakan PPN 1.1% logistik, dan otomasi TMS autopilot.',
    url: 'https://sistemforwarding.com/blog',
    siteName: 'Sistem Forwarding',
    type: 'website',
  },
};

export default async function BlogIndexPage() {
  const articles = await getArticlesFromDb();

  return <BlogIndexContent articles={articles} />;
}
