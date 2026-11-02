import { Metadata } from "next";
import { AffiliateLoginContent } from "@/components/public/AffiliateLoginContent";

export const metadata: Metadata = {
  title: "Masuk Portal Afiliasi | sistemforwarding.com",
  description: "Masuk ke konsol afiliasi mitra sistemforwarding.com untuk memantau performa referral dan penarikan saldo komisi.",
};

export default function AffiliateLoginPage() {
  return <AffiliateLoginContent />;
}
