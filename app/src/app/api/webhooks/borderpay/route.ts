import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SubscriptionStatus, InvoiceStatus, BillingStatus } from "@prisma/client";
import { sendEmail, sendWhatsApp } from "@/lib/hostinger";

/**
 * Expected BorderPay Webhook Payload Structure
 */
export interface BorderPayWebhookPayload {
  event: "payment.paid" | "payment.expired" | "payment.failed" | string;
  data: {
    transactionId: string;
    referenceId: string; // E.g., 'SUB-pt-maju-123456' or 'INV/2026/00001'
    amount: number;
    paymentMethod: "QRIS" | string;
    status: "PAID" | "EXPIRED" | "FAILED" | string;
    paidAt?: string;
    failureReason?: string;
    metadata?: {
      tenantId?: string;
      subdomain?: string;
      customerEmail?: string;
      customerPhone?: string;
      plan?: string;
    };
  };
}

/**
 * POST /api/webhooks/borderpay
 * Handler for BorderPay automated payment callbacks (QRIS settlements).
 * Security: Validates incoming request with x-borderpay-token header.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Security Check: Validate x-borderpay-token header or bearer auth
    const borderpayToken =
      req.headers.get("x-borderpay-token") ||
      req.headers.get("x-webhook-token") ||
      req.headers.get("borderpay-verification-token") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const expectedToken = process.env.BORDERPAY_VERIFICATION_TOKEN;

    if (!borderpayToken || borderpayToken !== expectedToken) {
      console.warn("[BorderPay Webhook] 401 Unauthorized: Invalid or missing verification token.");
      return NextResponse.json(
        { error: "Unauthorized: Invalid verification token" },
        { status: 401 }
      );
    }

    // 2. Parse Incoming Payload
    const payload: any = await req.json();
    console.info("[BorderPay Webhook Raw Payload]", JSON.stringify(payload));

    const event = payload.event || (payload.status === "paid" ? "payment.paid" : payload.type || "");
    const data = payload.data || payload;
    const referenceId =
      data.external_id ||
      data.externalId ||
      data.reference_id ||
      data.referenceId ||
      payload.external_id ||
      payload.reference_id ||
      "";

    console.info(`[BorderPay Webhook] Event: '${event}' | Reference: '${referenceId}' | Amount: ${data?.amount}`);

    switch (event) {
      /**
       * CASE 1: payment.paid
       * Handle both New Tenant Subscription Onboarding and Commercial Invoice Settlement
       */
      case "payment.paid": {
        // SCENARIO A: Tenant Subscription Onboarding
        let tenant = null;

        if (referenceId.startsWith("SUB-") || data.metadata?.subdomain) {
          const targetSubdomain =
            data.metadata?.subdomain ||
            (referenceId.startsWith("SUB-")
              ? referenceId.slice(4, referenceId.lastIndexOf("-"))
              : "");

          if (targetSubdomain) {
            tenant = await prisma.tenant.findUnique({
              where: { subdomain: targetSubdomain },
              include: { users: { take: 1 } },
            });
          }
        }

        // If not found by prefix, find by BorderPay reference stored in settings or recent trial tenants
        if (!tenant && referenceId) {
          const candidates = await prisma.tenant.findMany({
            where: {
              subscriptionStatus: { in: [SubscriptionStatus.TRIAL, SubscriptionStatus.EXPIRED] },
            },
            include: { users: { take: 1 } },
            orderBy: { createdAt: "desc" },
            take: 20,
          });

          tenant =
            candidates.find((t) => {
              const s = (t.settings as any) || {};
              return (
                s.borderpayRef === referenceId ||
                s.borderpayExternalId === referenceId ||
                (t.subdomain && referenceId.includes(t.subdomain))
              );
            }) || null;
        }

        if (tenant) {
          // Activate tenant subscription
          const durationEndsAt = new Date();
          if (tenant.billingCycle === "YEARLY") {
            durationEndsAt.setFullYear(durationEndsAt.getFullYear() + 1);
          } else {
            durationEndsAt.setMonth(durationEndsAt.getMonth() + 1);
          }

          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              trialEndsAt: durationEndsAt,
            },
          });

            const rootDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "sistemforwarding.com";
            const uniqueWorkspaceUrl = `https://${tenant.subdomain}.${rootDomain}`;

            console.info(
              `[BorderPay Webhook] Tenant '${tenant.subdomain}' successfully activated to ACTIVE status!`
            );

            // Send instant activation notification via Hostinger (safe try-catch)
            const adminUser = tenant.users[0];
            const targetEmail = data.metadata?.customerEmail || adminUser?.email;
            const targetPhone = data.metadata?.customerPhone || adminUser?.phone;

            if (targetEmail) {
              try {
                await sendEmail({
                  to: targetEmail,
                  subject: `Selamat! Ruang Kerja ${tenant.companyName} Telah Aktif`,
                  html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                      <h2 style="color: #2563eb;">Pembayaran QRIS Diterima</h2>
                      <p>Halo <strong>${adminUser?.name || "Rekan Forwarder"}</strong>,</p>
                      <p>Pembayaran langganan untuk <strong>${tenant.companyName}</strong> telah berhasil diverifikasi oleh sistem perbankan BorderPay.</p>
                      <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px;">URL Ruang Kerja Unik Anda:</p>
                        <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #1d4ed8;">
                          <a href="${uniqueWorkspaceUrl}" style="color: #1d4ed8; text-decoration: none;">${uniqueWorkspaceUrl}</a>
                        </p>
                      </div>
                      <p>Silakan akses ruang kerja Anda untuk mulai mengelola Job File, Invoicing, dan operasional pengiriman.</p>
                    </div>
                  `,
                });
              } catch (emailErr) {
                console.warn("[BorderPay Webhook] Email notification skipped:", emailErr);
              }
            }

            if (targetPhone) {
              try {
                await sendWhatsApp({
                  recipientPhone: targetPhone,
                  message: `Halo ${adminUser?.name || ""}, pembayaran paket sistemforwarding.com untuk ${tenant.companyName} telah BERHASIL. Akses workspace aktif Anda di: ${uniqueWorkspaceUrl}`,
                });
              } catch (waErr) {
                console.warn("[BorderPay Webhook] WhatsApp notification skipped:", waErr);
              }
            }

            return NextResponse.json({
              received: true,
              type: "TENANT_SUBSCRIPTION_ACTIVATED",
              subdomain: tenant.subdomain,
              workspaceUrl: uniqueWorkspaceUrl,
              status: "ACTIVE",
            });
          }

        // SCENARIO B: Operational Freight Commercial Invoice Settlement
        const invoice = await prisma.invoice.findFirst({
          where: { invoiceNumber: referenceId },
          include: { jobFile: true, customer: true, tenant: true },
        });

        if (invoice) {
          await prisma.$transaction([
            prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                status: InvoiceStatus.PAID,
                paidAt: new Date(),
                paymentMethod: "QRIS BorderPay",
              },
            }),
            prisma.jobFile.update({
              where: { id: invoice.jobFileId },
              data: {
                billingStatus: BillingStatus.PAID,
              },
            }),
          ]);

          console.info(`[BorderPay Webhook] Invoice ${invoice.invoiceNumber} marked as PAID.`);
        }

        break;
      }

      case "payment.expired": {
        console.warn(`[BorderPay Webhook] Payment expired for Ref: ${referenceId}`);
        break;
      }

      case "payment.failed": {
        console.error(`[BorderPay Webhook] Payment failed for Ref: ${referenceId}. Reason: ${data?.failureReason}`);
        break;
      }

      default:
        console.info(`[BorderPay Webhook] Unhandled event: ${event}`);
    }

    return NextResponse.json({
      received: true,
      event,
      referenceId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[BorderPay Webhook] Internal server error:", error);
    return NextResponse.json(
      { error: "Internal Server Error processing callback" },
      { status: 500 }
    );
  }
}
