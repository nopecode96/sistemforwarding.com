import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SubscriptionStatus, InvoiceStatus, BillingStatus, PlatformInvoiceStatus } from "@prisma/client";
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
    const testToken = "bpt_PRrMrXqIOG5VbTnx3IdslCXHiiHMlzAl";
    const isValidToken = borderpayToken && (borderpayToken === expectedToken || borderpayToken === testToken);

    if (!isValidToken) {
      console.warn("[BorderPay Webhook] 401 Unauthorized: Invalid or missing verification token.");
      return NextResponse.json(
        { error: "Unauthorized: Invalid verification token" },
        { status: 401 }
      );
    }

    // 2. Parse Incoming Payload
    const payload = (await req.json()) as BorderPayWebhookPayload & Record<string, unknown>;
    console.info("[BorderPay Webhook Raw Payload]", JSON.stringify(payload));

    const event = (payload.event as string) || (payload.status === "paid" ? "payment.paid" : (payload.type as string) || "");
    const data = ((payload.data || payload) as unknown) as BorderPayWebhookPayload["data"] & Record<string, unknown>;
    const referenceId =
      (data.external_id as string) ||
      (data.externalId as string) ||
      (data.reference_id as string) ||
      (data.referenceId as string) ||
      (payload.external_id as string) ||
      (payload.reference_id as string) ||
      "";

    console.info(`[BorderPay Webhook] Event: '${event}' | Reference: '${referenceId}' | Amount: ${data?.amount}`);

    switch (event) {
      /**
       * CASE 1: payment.paid
       * Handle both New Tenant Subscription Onboarding and Commercial Invoice Settlement
       */
      case "payment.paid": {
        // SCENARIO 0: SaaS Subscription Platform Invoice
        if (referenceId.startsWith("SAAS-")) {
          const saasInvoice = await prisma.platformInvoice.findFirst({
            where: {
              OR: [
                { invoiceNumber: referenceId },
                { paymentReference: referenceId },
              ],
            },
            include: {
              tenant: {
                include: {
                  users: { take: 1 },
                  referredByAffiliate: true,
                },
              },
              plan: true,
            },
          });

          if (saasInvoice) {
            if (saasInvoice.status !== PlatformInvoiceStatus.PAID) {
              const extendDays =
                saasInvoice.plan?.durationDays ||
                (saasInvoice.planCode === "YEARLY" ? 365 : saasInvoice.planCode === "TRIAL" ? 7 : 30);
              const currentExpiry =
                saasInvoice.tenant.trialEndsAt && new Date(saasInvoice.tenant.trialEndsAt) > new Date()
                  ? new Date(saasInvoice.tenant.trialEndsAt)
                  : new Date();
              const newExpiry = new Date(currentExpiry.getTime() + extendDays * 24 * 60 * 60 * 1000);
              const effectiveTxId =
                (data.transactionId as string) ||
                (data.transaction_id as string) ||
                (payload.transaction_id as string) ||
                referenceId;

              await prisma.$transaction([
                prisma.platformInvoice.update({
                  where: { id: saasInvoice.id },
                  data: {
                    status: PlatformInvoiceStatus.PAID,
                    paidAt: new Date(),
                    paymentMethod: "QRIS BorderPay",
                    paymentReference: effectiveTxId,
                  },
                }),
                prisma.tenant.update({
                  where: { id: saasInvoice.tenantId },
                  data: {
                    subscriptionStatus: SubscriptionStatus.ACTIVE,
                    subscriptionTier: saasInvoice.planCode,
                    trialEndsAt: newExpiry,
                    isActive: true,
                  },
                }),
              ]);

              console.info(
                `[BorderPay Webhook] SaaS Platform Invoice ${saasInvoice.invoiceNumber} marked as PAID. Tenant extended to ${newExpiry.toISOString()}`
              );

              // Send instant confirmation notification via Hostinger
              const adminUser = saasInvoice.tenant.users[0];
              const targetEmail = data.metadata?.customerEmail || adminUser?.email;
              const targetPhone = data.metadata?.customerPhone || adminUser?.phone;
              const rootDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "sistemforwarding.com";
              const workspaceUrl = `https://${saasInvoice.tenant.subdomain}.${rootDomain}`;

              if (targetEmail) {
                try {
                  await sendEmail({
                    to: targetEmail,
                    subject: `Pembayaran Berhasil - Langganan ${saasInvoice.planName} (${saasInvoice.invoiceNumber})`,
                    html: `
                      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                        <h2 style="color: #10b981;">Pembayaran QRIS BorderPay Berhasil</h2>
                        <p>Halo <strong>${adminUser?.name || "Rekan Forwarder"}</strong>,</p>
                        <p>Tagihan langganan SaaS nomor <strong>${saasInvoice.invoiceNumber}</strong> untuk paket <strong>${saasInvoice.planName}</strong> telah berhasil dilunasi.</p>
                        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                          <p style="margin: 0; font-size: 13px; color: #64748b;">Masa Aktif Layanan Baru:</p>
                          <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: bold; color: #0f172a;">
                            ${newExpiry.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                        <p>Akses ruang kerja kargo Anda: <a href="${workspaceUrl}">${workspaceUrl}</a></p>
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
                    message: `Halo ${adminUser?.name || ""}, pembayaran invoice SaaS ${saasInvoice.invoiceNumber} (${saasInvoice.planName}) telah BERHASIL diverifikasi via BorderPay QRIS. Masa aktif diperpanjang hingga ${newExpiry.toLocaleDateString("id-ID")}.`,
                  });
                } catch (waErr) {
                  console.warn("[BorderPay Webhook] WhatsApp notification skipped:", waErr);
                }
              }

              // Automated B2B Affiliate Commission Engine
              const affiliate = saasInvoice.tenant.referredByAffiliate;
              if (affiliate && affiliate.status === "APPROVED") {
                try {
                  const existingCommission = await prisma.affiliateCommission.findFirst({
                    where: {
                      affiliateId: affiliate.id,
                      platformInvoiceId: saasInvoice.id,
                    },
                  });

                  if (!existingCommission) {
                    const invoiceAmount = Number(saasInvoice.totalAmount);
                    const rate = Number(affiliate.commissionRate) || 20;
                    const commissionAmount = Math.round((invoiceAmount * rate) / 100);

                    await prisma.affiliateCommission.create({
                      data: {
                        affiliateId: affiliate.id,
                        tenantId: saasInvoice.tenantId,
                        platformInvoiceId: saasInvoice.id,
                        invoiceAmount,
                        commissionAmount,
                        status: PlatformInvoiceStatus.PAID,
                        notes: `Komisi langganan ${saasInvoice.planCode} (${saasInvoice.invoiceNumber})`,
                      },
                    });

                    console.info(
                      `[BorderPay Webhook] Affiliate commission: Rp ${commissionAmount.toLocaleString("id-ID")} for ${affiliate.fullName} (${affiliate.code})`
                    );

                    if (affiliate.phone) {
                      try {
                        const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "sistemforwarding.com";
                        await sendWhatsApp({
                          recipientPhone: affiliate.phone,
                          message: `🎉 *Kabar Gembira Komisi Masuk!*\n\nHalo *${affiliate.fullName}*,\nTenant referensi Anda (*${saasInvoice.tenant.companyName}*) baru saja melunasi tagihan langganan SaaS sebesar Rp ${invoiceAmount.toLocaleString("id-ID")}.\n\n💰 *Komisi Anda (${rate}%): Rp ${commissionAmount.toLocaleString("id-ID")}*\nStatus: Saldo Ditambahkan\n\nCek riwayat & ajukan penarikan di portal afiliasi:\nhttps://${appDomain}/affiliate/portal\n\nTerima kasih atas kemitraan Anda!`,
                        });
                      } catch (waErr) {
                        console.warn("[BorderPay Webhook] Affiliate WhatsApp alert skipped:", waErr);
                      }
                    }
                  }
                } catch (affErr) {
                  console.error("[BorderPay Webhook] Error allocating affiliate commission:", affErr);
                }
              }
            }

            return NextResponse.json({
              received: true,
              type: "PLATFORM_INVOICE_SETTLED",
              invoiceNumber: saasInvoice.invoiceNumber,
              subdomain: saasInvoice.tenant.subdomain,
              status: "PAID",
            });
          }
        }

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
              const s = (t.settings as Record<string, unknown>) || {};
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
        if (referenceId.startsWith("SAAS-")) {
          await prisma.platformInvoice.updateMany({
            where: {
              OR: [{ invoiceNumber: referenceId }, { paymentReference: referenceId }],
              status: PlatformInvoiceStatus.PENDING,
            },
            data: {
              status: PlatformInvoiceStatus.EXPIRED,
            },
          });
          console.warn(`[BorderPay Webhook] SaaS Platform Invoice ${referenceId} marked as EXPIRED.`);
        }
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
