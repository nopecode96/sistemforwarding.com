import { Metadata } from "next";
import { AffiliateLandingContent } from "@/components/public/AffiliateLandingContent";

export const metadata: Metadata = {
  title: "Program Afiliasi B2B SaaS Logistik - Komisi Recurring 20% | sistemforwarding.com",
  description:
    "Rekomendasikan software operasional freight forwarding (Job File, BL/AWB, e-Faktur & Bea Cukai) dan dapatkan komisi recurring 20% setiap bulan selama 12 bulan per klien.",
  openGraph: {
    title: "Program Afiliasi B2B SaaS Logistik | sistemforwarding.com",
    description:
      "Dapatkan passive income 20% recurring setiap bulan dengan merekomendasikan sistemforwarding.com ke ekosistem logistik & freight forwarding Anda.",
    url: "https://sistemforwarding.com/affiliate",
    type: "website",
  },
};

export default function AffiliatePage() {
  return <AffiliateLandingContent />;
}
