"use server";

import prisma from "@/lib/prisma";
import { SubscriptionStatus, UserRole, PrefixType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { headers } from "next/headers";
import { createBorderPayQris } from "@/lib/borderpay";

const RESERVED_SUBDOMAINS = new Set([
  "admin",
  "api",
  "app",
  "home",
  "www",
  "login",
  "onboarding",
  "mail",
  "root",
  "superadmin",
  "billing",
  "auth",
  "dashboard",
  "staging",
  "test",
  "demo",
]);

export interface SubdomainCheckResult {
  available: boolean;
  message: string;
}

export interface RegisterTenantInput {
  companyName: string;
  subdomain: string;
  plan: "trial" | "monthly" | "yearly";
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface RegisterTenantResult {
  success: boolean;
  tenantId?: string;
  subdomain?: string;
  workspaceUrl?: string;
  requiresPayment?: boolean;
  paymentDetails?: {
    amount: number;
    referenceId: string;
    qrisString: string;
    paymentUrl?: string;
    isLiveMode?: boolean;
    expiresAt: string;
  };
  error?: string;
}

/**
 * 1. checkSubdomainAvailability
 * Real-time validation checking format, reserved keywords, and PostgreSQL unique constraints.
 */
export async function checkSubdomainAvailability(
  subdomainRaw: string
): Promise<SubdomainCheckResult> {
  const subdomain = subdomainRaw.trim().toLowerCase();

  if (!subdomain) {
    return { available: false, message: "Subdomain tidak boleh kosong." };
  }

  if (subdomain.length < 3) {
    return { available: false, message: "Subdomain minimal 3 karakter." };
  }

  if (subdomain.length > 30) {
    return { available: false, message: "Subdomain maksimal 30 karakter." };
  }

  // Allow only lowercase alphanumeric and single hyphens
  const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!regex.test(subdomain)) {
    return {
      available: false,
      message: "Subdomain hanya boleh huruf kecil, angka, dan tanda hubung (-).",
    };
  }

  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return {
      available: false,
      message: `Subdomain '${subdomain}' adalah nama sistem terproteksi.`,
    };
  }

  const existing = await prisma.tenant.findUnique({
    where: { subdomain },
    select: { id: true },
  });

  if (existing) {
    return {
      available: false,
      message: `Subdomain '${subdomain}' sudah digunakan oleh perusahaan lain.`,
    };
  }

  return {
    available: true,
    message: `Subdomain '${subdomain}.sistemforwarding.com' tersedia!`,
  };
}

/**
 * 2. registerNewTenant
 * Autopilot onboarding creating the Tenant, foundation MasterPrefix, MasterTax,
 * MasterCurrency, FinancialSettings, and linking User as company Tenant Admin.
 */
export async function registerNewTenant(
  input: RegisterTenantInput
): Promise<RegisterTenantResult> {
  try {
    const { companyName, plan, user } = input;
    const subdomain = input.subdomain.trim().toLowerCase();

    // 1. Validate Subdomain
    const availability = await checkSubdomainAvailability(subdomain);
    if (!availability.available) {
      return { success: false, error: availability.message };
    }

    if (!companyName.trim()) {
      return { success: false, error: "Nama Perusahaan wajib diisi." };
    }
    if (!user.email) {
      return { success: false, error: "Email akun Google wajib disertakan." };
    }

    const isPaidPlan = plan === "monthly" || plan === "yearly";
    const planPrice = plan === "yearly" ? 10000000 : plan === "monthly" ? 1000000 : 0;

    // Trial lasts 7 days; Paid starts in TRIAL until QRIS payment confirmed
    const trialDays = plan === "trial" ? 7 : 1;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    // 2. Atomic Database Provisioning
    const { newTenant, createdUser } = await prisma.$transaction(async (tx) => {
      // Create Tenant workspace
      const tenant = await tx.tenant.create({
        data: {
          subdomain,
          companyName: companyName.trim(),
          subscriptionStatus: SubscriptionStatus.TRIAL,
          subscriptionTier: plan.toUpperCase(),
          trialEndsAt,
          billingCycle: plan === "yearly" ? "YEARLY" : "MONTHLY",
          isActive: true,
        },
      });

      // Seed Initial MasterPrefix rules for new tenant
      await tx.masterPrefix.createMany({
        data: [
          {
            tenantId: tenant.id,
            prefixType: PrefixType.JOB_FILE,
            prefixCode: "JF",
            zeroPadding: 5,
            currentSequence: 0,
            formatPattern: "{PREFIX}/{YEAR}/{MONTH}/{SEQ}",
            description: "Default Operational Job File Sequence",
          },
          {
            tenantId: tenant.id,
            prefixType: PrefixType.INVOICE,
            prefixCode: "INV",
            zeroPadding: 5,
            currentSequence: 0,
            formatPattern: "{PREFIX}/{YEAR}/{SEQ}",
            description: "Default Commercial Invoice Sequence",
          },
          {
            tenantId: tenant.id,
            prefixType: PrefixType.PAYMENT_VOUCHER,
            prefixCode: "PV",
            zeroPadding: 5,
            currentSequence: 0,
            formatPattern: "{PREFIX}/{YEAR}/{MONTH}/{SEQ}",
            description: "Default Payment Voucher Sequence",
          },
        ],
      });

      // Seed Foundation MasterTax (PPN 1.1% JPT & PPN 11% Standard)
      await tx.masterTax.createMany({
        data: [
          {
            tenantId: tenant.id,
            taxCode: "PPN_JPT_1_1",
            taxName: "PPN Jasa Pengurusan Transportasi (PMK 71) 1.1%",
            taxRatePercent: 1.1,
            isDefault: true,
            description: "Pajak Pertambahan Nilai Final 1.1% untuk freight forwarding sesuai PMK No. 71/PMK.03/2022",
          },
          {
            tenantId: tenant.id,
            taxCode: "PPN_11",
            taxName: "PPN Standar 11%",
            taxRatePercent: 11.0,
            isDefault: false,
            description: "Tarif PPN Standar Indonesia",
          },
        ],
      });

      // Seed Foundation MasterCurrency (IDR Base & USD)
      await tx.masterCurrency.createMany({
        data: [
          {
            tenantId: tenant.id,
            code: "IDR",
            name: "Indonesian Rupiah",
            symbol: "Rp",
            exchangeRate: 1.0,
            isBaseCurrency: true,
            isActive: true,
          },
          {
            tenantId: tenant.id,
            code: "USD",
            name: "United States Dollar",
            symbol: "$",
            exchangeRate: 16250.0,
            isBaseCurrency: false,
            isActive: true,
          },
        ],
      });

      // Seed Default Financial Settings
      await tx.financialSettings.create({
        data: {
          tenantId: tenant.id,
          baseCurrency: "IDR",
          fiscalYearStartMonth: 1,
          defaultPaymentTermDays: 30,
          autoInvoiceOnJobDone: false,
          taxCalculationMode: "EXCLUSIVE",
        },
      });

      // Link or Create User as Tenant Admin / Owner
      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: user.email.toLowerCase(),
          name: user.name || "Administrator Perusahaan",
          role: UserRole.TENANT_ADMIN,
          isActive: true,
        },
      });

      return { newTenant: tenant, createdUser: adminUser };
    });

    console.info(
      `[Onboarding Autopilot] Provisioned new tenant '${newTenant.subdomain}' (${newTenant.companyName}) for user ${user.email}`
    );

    const rootDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "sistemforwarding.com";
    const workspaceUrl = `https://${newTenant.subdomain}.${rootDomain}`;

    // Establish immediate wildcard session cookie so the user is authenticated straight away
    try {
      const headerList = await headers();
      const hostHeader = headerList.get("host") || "";
      const sessionToken = await createSessionToken({
        userId: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role as any,
        tenantId: newTenant.id,
        subdomain: newTenant.subdomain,
        companyName: newTenant.companyName,
      });
      await setSessionCookie(sessionToken, hostHeader);
    } catch (cookieErr) {
      console.warn("[Onboarding Autopilot] Could not set instant session cookie:", cookieErr);
    }

    // 3. For Paid Plans: Generate BorderPay QRIS Payment Session
    if (isPaidPlan) {
      const referenceId = `SUB-${newTenant.subdomain}-${Date.now().toString().slice(-6)}`;
      const qrisResult = await createBorderPayQris({
        amount: planPrice,
        referenceId,
        description: `Langganan SistemForwarding - ${newTenant.companyName} (${plan.toUpperCase()})`,
        customerEmail: user.email,
        customerName: user.name,
      });

      // Save BorderPay reference mapping into tenant settings
      try {
        await prisma.tenant.update({
          where: { id: newTenant.id },
          data: {
            settings: {
              ...(typeof newTenant.settings === "object" && newTenant.settings !== null
                ? newTenant.settings
                : {}),
              borderpayRef: qrisResult.referenceId || null,
              borderpayExternalId: referenceId,
              planPrice,
            },
          },
        });
      } catch (settingsErr) {
        console.warn("[Onboarding Autopilot] Could not persist BorderPay ref to settings:", settingsErr);
      }

      return {
        success: true,
        tenantId: newTenant.id,
        subdomain: newTenant.subdomain,
        workspaceUrl,
        requiresPayment: true,
        paymentDetails: {
          amount: planPrice,
          referenceId: qrisResult.referenceId || referenceId,
          qrisString: qrisResult.qrisString || "",
          paymentUrl: qrisResult.paymentUrl,
          isLiveMode: Boolean(process.env.BORDERPAY_API_KEY_LIVE),
          expiresAt: qrisResult.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      };
    }

    // Trial Plan: Instant Activation without payment required
    try {
      revalidatePath("/");
    } catch {}

    return {
      success: true,
      tenantId: newTenant.id,
      subdomain: newTenant.subdomain,
      workspaceUrl,
      requiresPayment: false,
    };
  } catch (error) {
    console.error("[registerNewTenant] Provisioning failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mendaftarkan tenant baru.",
    };
  }
}

/**
 * 3. checkPaymentStatus
 * Polling action to check whether a tenant's subscription has been activated via Webhook.
 */
export async function checkPaymentStatus(
  subdomain: string
): Promise<{ isPaid: boolean; status?: string }> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: subdomain.trim().toLowerCase() },
      select: { subscriptionStatus: true },
    });
    return {
      isPaid: tenant?.subscriptionStatus === SubscriptionStatus.ACTIVE,
      status: tenant?.subscriptionStatus,
    };
  } catch {
    return { isPaid: false };
  }
}

/**
 * 4. simulateBorderPayPayment
 * Server Action to simulate a BorderPay callback with the secret x-borderpay-token header.
 */
export async function simulateBorderPayPayment(
  referenceId: string,
  subdomain: string,
  customerEmail?: string,
  amount: number = 1000000
): Promise<{ ok: boolean; status: number }> {
  try {
    // If this is a real BorderPay test transaction (ORD-xxx), trigger simulation on BorderPay's sandbox directly
    if (referenceId.startsWith("ORD-")) {
      const apiKey = process.env.BORDERPAY_API_KEY_LIVE || process.env.BORDERPAY_API_KEY_TEST;
      if (apiKey) {
        try {
          await fetch(`https://borderpay.id/api/v1/payments/${referenceId}/simulate`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          });
        } catch (simErr) {
          console.warn("[simulateBorderPayPayment] Live simulate call warning:", simErr);
        }
      }
    }

    const { NextRequest } = await import("next/server");
    const { POST: borderpayHandler } = await import("@/app/api/webhooks/borderpay/route");

    const req = new NextRequest("http://localhost/api/webhooks/borderpay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-borderpay-token": process.env.BORDERPAY_VERIFICATION_TOKEN || "",
      },
      body: JSON.stringify({
        event: "payment.paid",
        data: {
          transactionId: `TRX-SIM-${Date.now()}`,
          referenceId,
          amount,
          paymentMethod: "QRIS",
          status: "PAID",
          paidAt: new Date().toISOString(),
          metadata: {
            subdomain,
            customerEmail,
          },
        },
      }),
    });

    const res = await borderpayHandler(req);
    return { ok: res.status === 200, status: res.status };
  } catch (err) {
    console.error("[simulateBorderPayPayment] Execution error:", err);
    return { ok: false, status: 500 };
  }
}
