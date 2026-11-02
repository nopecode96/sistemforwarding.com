import type { Metadata } from 'next';
import { getActivePlans } from '@/actions/planActions';
import { LandingPageContent } from '@/components/public/LandingPageContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Sistem Forwarding | Software Manajemen Kargo & Freight Forwarding Terbaik',
  description:
    'Software ERP & TMS khusus freight forwarding Indonesia. Kelola Job File, cetak AWB/HBL, invoice otomatis, laporan laba/rugi — semua dalam satu sistem. Coba gratis 7 hari.',
  keywords:
    'software freight forwarding indonesia, sistem forwarding, aplikasi kargo, tms forwarding, software logistik',
  alternates: { canonical: 'https://sistemforwarding.com' },
  openGraph: {
    title: 'Sistem Forwarding | Software Kargo Autopilot',
    description: 'Platform ERP & TMS khusus perusahaan freight forwarding Indonesia.',
    url: 'https://sistemforwarding.com',
    siteName: 'Sistem Forwarding',
    locale: 'id_ID',
    type: 'website',
  },
};

export default async function LandingPage() {
  const plans = await getActivePlans();

  return <LandingPageContent plans={plans} />;
}
