import type { Metadata } from 'next';
import { AboutContent } from '@/components/public/AboutContent';

export const metadata: Metadata = {
  title: 'Tentang Kami | PT. Rafa Kreasindo Teknologi - Pengembang Sistem Forwarding',
  description:
    'Profil resmi PT. Rafa Kreasindo Teknologi, pengembang sistemforwarding.com. Solusi SaaS ERP & TMS B2B multi-tenant terpercaya untuk modernisasi freight forwarding Indonesia.',
  keywords:
    'tentang sistem forwarding, PT Rafa Kreasindo Teknologi, profil perusahaan software logistik, legalitas sistemforwarding, cloud tms indonesia',
  alternates: { canonical: 'https://sistemforwarding.com/about' },
  openGraph: {
    title: 'Tentang Kami | PT. Rafa Kreasindo Teknologi - Sistem Forwarding',
    description:
      'Profil resmi pengembang platform SaaS sistemforwarding.com. Solusi enterprise TMS & ERP multi-tenant freight forwarding.',
    url: 'https://sistemforwarding.com/about',
    siteName: 'Sistem Forwarding',
    type: 'website',
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
