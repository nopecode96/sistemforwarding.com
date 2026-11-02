import prisma from "../src/lib/prisma";
import {
  getPlatformPlans,
  upsertPlatformPlan,
  togglePlatformPlanActive,
  deletePlatformPlan,
  getPlatformBillingOverview,
  generatePlatformInvoice,
  markPlatformInvoicePaid,
  cancelPlatformInvoice,
  reconcileBorderPayPayment,
} from "../src/actions/adminBillingActions";
import { getActivePlans } from "../src/actions/planActions";
import { POST as borderpayWebhookHandler } from "../src/app/api/webhooks/borderpay/route";
import { PlatformInvoiceStatus, SubscriptionStatus } from "@prisma/client";
import { NextRequest } from "next/server";

async function runFase2Tests() {
  console.log("=== STARTING REAL SUPER ADMIN FASE 2 TEST SUITE (BILLING, PLANS & BORDERPAY WEBHOOK) ===");

  // --------------------------------------------------------------------------
  // TEST 1: RBAC Security Enforcement (Unauthenticated Rejection)
  // --------------------------------------------------------------------------
  console.log("\n[TEST 1] RBAC Security Check: Unauthenticated calls must be rejected");
  delete process.env.ADMIN_TEST_MODE;

  try {
    await getPlatformPlans();
    console.error("FAIL: Expected getPlatformPlans() to throw on unauthenticated call");
    process.exit(1);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes("Akses ditolak")) {
      console.log("PASS: getPlatformPlans() correctly rejected unauthenticated call:", errorMsg);
    } else {
      console.log("PASS: Rejected call with error:", errorMsg);
    }
  }

  try {
    await getPlatformBillingOverview();
    console.error("FAIL: Expected getPlatformBillingOverview() to throw on unauthenticated call");
    process.exit(1);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.log("PASS: getPlatformBillingOverview() correctly rejected unauthenticated call:", errorMsg);
  }

  // Enable test superadmin bypass for subsequent function tests
  process.env.ADMIN_TEST_MODE = "true";

  // Find demo tenant for testing
  const demoTenant = await prisma.tenant.findUnique({
    where: { subdomain: "demo1" },
  });

  if (!demoTenant) {
    console.error("FAIL: demo1 tenant not found in DB");
    process.exit(1);
  }

  const initialTenantTier = demoTenant.subscriptionTier;
  const initialTenantStatus = demoTenant.subscriptionStatus;
  const initialTenantTrialEndsAt = demoTenant.trialEndsAt;

  console.log(
    `Initial demo tenant state: ${demoTenant.companyName} (${demoTenant.subdomain}) - status: ${initialTenantStatus}, tier: ${initialTenantTier}`
  );

  // --------------------------------------------------------------------------
  // TEST 2: Platform Plans Auto-Seeding & Retrieval
  // --------------------------------------------------------------------------
  console.log("\n[TEST 2] Testing getPlatformPlans() auto-seeding & retrieval");
  const plans = await getPlatformPlans();
  if (!Array.isArray(plans) || plans.length === 0) {
    console.error("FAIL: getPlatformPlans() returned empty or non-array result", plans);
    process.exit(1);
  }

  const trialPlan = plans.find((p) => p.code === "TRIAL");
  const monthlyPlan = plans.find((p) => p.code === "MONTHLY");
  const yearlyPlan = plans.find((p) => p.code === "YEARLY");
  const payPerJobPlan = plans.find((p) => p.code === "PAY_PER_JOB");

  if (!trialPlan || !monthlyPlan || !yearlyPlan || !payPerJobPlan) {
    console.error("FAIL: Missing default seeded plans (TRIAL, MONTHLY, YEARLY, PAY_PER_JOB):", plans);
    process.exit(1);
  }

  console.log(
    `PASS: Found ${plans.length} platform plans. MONTHLY: Rp ${monthlyPlan.price.toLocaleString("id-ID")} (Coret: Rp ${monthlyPlan.originalPrice?.toLocaleString("id-ID")}), YEARLY: Rp ${yearlyPlan.price.toLocaleString("id-ID")} (Coret: Rp ${yearlyPlan.originalPrice?.toLocaleString("id-ID")}), PAY_PER_JOB: Rp ${payPerJobPlan.price.toLocaleString("id-ID")} (Coret: Rp ${payPerJobPlan.originalPrice?.toLocaleString("id-ID")})`
  );

  // --------------------------------------------------------------------------
  // TEST 3: Create Custom Platform Plan & SystemDictionary Sync
  // --------------------------------------------------------------------------
  console.log("\n[TEST 3] Testing upsertPlatformPlan() - Creating custom plan & verifying SystemDictionary sync");
  const customCode = "CUSTOM_TEST";
  const createPlanRes = await upsertPlatformPlan({
    code: customCode,
    name: "Paket Khusus Maritim Tes",
    description: "Paket kargo untuk uji integrasi otomatis",
    price: 2500000,
    billingCycle: "MONTHLY",
    durationDays: 45,
    maxUsers: 25,
    maxJobFiles: 2000,
    features: [
      "Pelacakan Satelit Kargo",
      "API Integrasi Bea Cukai",
      "Dedicated Super Admin Support",
    ],
    badge: "Edisi Terbatas",
    isPopular: false,
    isActive: true,
    sortOrder: 99,
  });

  if (!createPlanRes.success || !createPlanRes.data) {
    console.error("FAIL: Failed to create custom plan:", createPlanRes.error);
    process.exit(1);
  }

  const createdPlanId = createPlanRes.data.id;
  console.log(`PASS: Created custom plan "${createPlanRes.data.name}" (${createPlanRes.data.code}) with ID: ${createdPlanId}`);

  // Verify SystemDictionary synchronization
  const syncedDict = await prisma.systemDictionary.findFirst({
    where: {
      tenantId: null,
      category: "SUBSCRIPTION_PLAN",
      code: customCode,
    },
  });
  if (!syncedDict || syncedDict.label !== "Paket Khusus Maritim Tes") {
    console.error("FAIL: SystemDictionary was not properly synchronized:", syncedDict);
    process.exit(1);
  }
  console.log("PASS: SystemDictionary properly synchronized with new plan details.");

  // Verify getActivePlans() exposed to public landing
  const publicPlans = await getActivePlans();
  const foundInPublic = publicPlans.some((p) => p.planKey === customCode.toLowerCase());
  if (!foundInPublic) {
    console.error("FAIL: Custom plan not exposed by getActivePlans():", publicPlans);
    process.exit(1);
  }
  console.log("PASS: getActivePlans() directly returned custom platform plan for public pricing.");

  // --------------------------------------------------------------------------
  // TEST 4: Toggle Plan Status (togglePlatformPlanActive)
  // --------------------------------------------------------------------------
  console.log("\n[TEST 4] Testing togglePlatformPlanActive() action");
  const toggleOff = await togglePlatformPlanActive(createdPlanId, false);
  if (!toggleOff.success) {
    console.error("FAIL: togglePlatformPlanActive(false) failed:", toggleOff.error);
    process.exit(1);
  }
  let checkPlan = await prisma.platformPlan.findUnique({ where: { id: createdPlanId } });
  const checkDict = await prisma.systemDictionary.findFirst({
    where: { tenantId: null, category: "SUBSCRIPTION_PLAN", code: customCode },
  });
  if (checkPlan?.isActive !== false || checkDict?.isActive !== false) {
    console.error("FAIL: Plan and SystemDictionary isActive should both be false", { checkPlan, checkDict });
    process.exit(1);
  }

  const toggleOn = await togglePlatformPlanActive(createdPlanId, true);
  if (!toggleOn.success) {
    console.error("FAIL: togglePlatformPlanActive(true) failed:", toggleOn.error);
    process.exit(1);
  }
  checkPlan = await prisma.platformPlan.findUnique({ where: { id: createdPlanId } });
  if (checkPlan?.isActive !== true) {
    console.error("FAIL: Plan isActive should be true");
    process.exit(1);
  }
  console.log("PASS: togglePlatformPlanActive successfully toggled false -> true (synced with SystemDictionary)");

  // --------------------------------------------------------------------------
  // TEST 5: Generate Platform Invoice (generatePlatformInvoice)
  // --------------------------------------------------------------------------
  console.log("\n[TEST 5] Testing generatePlatformInvoice() with BorderPay QRIS");
  const invoiceRes = await generatePlatformInvoice({
    tenantId: demoTenant.id,
    planIdOrCode: customCode,
    customAmount: 2500000,
    billingPeriod: "45 Hari Operasional",
    notes: "Tagihan uji coba sistem forwarding Fase 2",
    withBorderPayQris: true,
  });

  if (!invoiceRes.success || !invoiceRes.data) {
    console.error("FAIL: generatePlatformInvoice() failed:", invoiceRes.error);
    process.exit(1);
  }

  const invoice = invoiceRes.data;
  console.log(
    `PASS: Invoice ${invoice.invoiceNumber} created with total Rp ${invoice.totalAmount.toLocaleString("id-ID")}, QRIS generated: ${invoice.qrisString?.slice(0, 30)}...`
  );

  // --------------------------------------------------------------------------
  // TEST 6: Metrics Aggregation (getPlatformBillingOverview)
  // --------------------------------------------------------------------------
  console.log("\n[TEST 6] Testing getPlatformBillingOverview() metrics aggregation");
  const overview = await getPlatformBillingOverview();

  if (
    typeof overview.summary.pendingReceivables !== "number" ||
    overview.summary.totalInvoicesCount < 1 ||
    overview.summary.activePlansCount < 3
  ) {
    console.error("FAIL: Invalid overview aggregation data:", overview.summary);
    process.exit(1);
  }
  console.log(
    `PASS: Overview telemetry aggregated: Pending Receivables: Rp ${overview.summary.pendingReceivables.toLocaleString("id-ID")}, Total Invoices: ${overview.summary.totalInvoicesCount}, Active Plans: ${overview.summary.activePlansCount}`
  );

  // --------------------------------------------------------------------------
  // TEST 7: Manual Payment Approval & Tenant Auto-Extension
  // --------------------------------------------------------------------------
  console.log("\n[TEST 7] Testing markPlatformInvoicePaid() with automatic tenant subscription extension");
  const payRes = await markPlatformInvoicePaid(invoice.id, {
    paymentMethod: "MANUAL_TRANSFER",
    paymentReference: "TRF-BCA-992819",
    notes: "Pembayaran transfer tunai via Teller BCA disetujui SuperAdmin",
    extendDays: 45,
  });

  if (!payRes.success) {
    console.error("FAIL: markPlatformInvoicePaid() failed:", payRes.error);
    process.exit(1);
  }

  // Verify invoice state
  const updatedInv = await prisma.platformInvoice.findUnique({ where: { id: invoice.id } });
  if (updatedInv?.status !== PlatformInvoiceStatus.PAID || !updatedInv.paidAt) {
    console.error("FAIL: Invoice in DB is not marked PAID:", updatedInv);
    process.exit(1);
  }

  // Verify tenant subscription state
  const updatedTenant = await prisma.tenant.findUnique({ where: { id: demoTenant.id } });
  if (
    updatedTenant?.subscriptionStatus !== SubscriptionStatus.ACTIVE ||
    updatedTenant?.subscriptionTier !== customCode ||
    !updatedTenant?.trialEndsAt ||
    new Date(updatedTenant.trialEndsAt) <= new Date()
  ) {
    console.error("FAIL: Tenant subscription was not updated/extended properly:", updatedTenant);
    process.exit(1);
  }

  console.log(
    `PASS: Invoice ${invoice.invoiceNumber} paid! Tenant ${updatedTenant.companyName} tier updated to ${updatedTenant.subscriptionTier}, status ACTIVE, new expiry: ${updatedTenant.trialEndsAt.toISOString()}`
  );

  // Double payment protection
  const doublePay = await markPlatformInvoicePaid(invoice.id);
  if (doublePay.success) {
    console.error("FAIL: Expected double payment on already-paid invoice to be rejected");
    process.exit(1);
  }
  console.log("PASS: Double payment rejection correctly handled:", doublePay.error);

  // --------------------------------------------------------------------------
  // TEST 8: BorderPay Reconciliation & Webhook Settlement
  // --------------------------------------------------------------------------
  console.log("\n[TEST 8] Testing reconcileBorderPayPayment() action");
  // Create second invoice for reconciliation test
  const inv2Res = await generatePlatformInvoice({
    tenantId: demoTenant.id,
    planIdOrCode: "MONTHLY",
    withBorderPayQris: true,
  });
  if (!inv2Res.success || !inv2Res.data) {
    console.error("FAIL: Could not create second invoice:", inv2Res.error);
    process.exit(1);
  }
  const inv2 = inv2Res.data;

  // Reconcile via invoice number
  const reconcileRes = await reconcileBorderPayPayment(inv2.invoiceNumber, "BP-TRX-882173");
  if (!reconcileRes.success) {
    console.error("FAIL: reconcileBorderPayPayment() failed:", reconcileRes.error);
    process.exit(1);
  }

  const reconciledDB = await prisma.platformInvoice.findUnique({ where: { id: inv2.id } });
  if (reconciledDB?.status !== PlatformInvoiceStatus.PAID) {
    console.error("FAIL: Reconciled invoice not marked PAID:", reconciledDB);
    process.exit(1);
  }
  console.log(`PASS: Invoice ${inv2.invoiceNumber} successfully reconciled via BorderPay settlement.`);

  // --------------------------------------------------------------------------
  // TEST 9: Real BorderPay Webhook Route (POST /api/webhooks/borderpay)
  // --------------------------------------------------------------------------
  console.log("\n[TEST 9] Testing real BorderPay Webhook route");
  // 9a. Test unauthorized request
  const unauthReq = new NextRequest("http://localhost:3000/api/webhooks/borderpay", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-borderpay-token": "invalid-token-xyz",
    },
    body: JSON.stringify({ event: "payment.paid", data: { referenceId: "DUMMY" } }),
  });
  const unauthRes = await borderpayWebhookHandler(unauthReq);
  if (unauthRes.status !== 401) {
    console.error("FAIL: Expected 401 Unauthorized for invalid webhook token, got:", unauthRes.status);
    process.exit(1);
  }
  console.log("PASS: Webhook correctly rejected invalid security token with 401.");

  // 9b. Test real settlement of SaaS invoice via Webhook
  const invWebhookRes = await generatePlatformInvoice({
    tenantId: demoTenant.id,
    planIdOrCode: "YEARLY",
    withBorderPayQris: true,
  });
  if (!invWebhookRes.success || !invWebhookRes.data) {
    console.error("FAIL: Could not generate invoice for webhook test:", invWebhookRes.error);
    process.exit(1);
  }
  const invWebhook = invWebhookRes.data;

  const validWebhookReq = new NextRequest("http://localhost:3000/api/webhooks/borderpay", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-borderpay-token": "bpt_PRrMrXqIOG5VbTnx3IdslCXHiiHMlzAl",
    },
    body: JSON.stringify({
      event: "payment.paid",
      data: {
        referenceId: invWebhook.invoiceNumber,
        transactionId: "BP-WH-TRX-998811",
        amount: invWebhook.totalAmount,
        paymentMethod: "QRIS",
        status: "PAID",
      },
    }),
  });
  const validWebhookRes = await borderpayWebhookHandler(validWebhookReq);
  const webhookJson = await validWebhookRes.json();
  if (webhookJson.type !== "PLATFORM_INVOICE_SETTLED" || webhookJson.status !== "PAID") {
    console.error("FAIL: Unexpected webhook settlement response:", webhookJson);
    process.exit(1);
  }

  const webhookSettledDB = await prisma.platformInvoice.findUnique({ where: { id: invWebhook.id } });
  if (webhookSettledDB?.status !== PlatformInvoiceStatus.PAID) {
    console.error("FAIL: Invoice was not marked PAID by webhook:", webhookSettledDB);
    process.exit(1);
  }
  console.log(`PASS: Webhook successfully settled ${invWebhook.invoiceNumber} and updated invoice to PAID.`);

  // 9c. Test payment.expired event
  const invExpiredRes = await generatePlatformInvoice({
    tenantId: demoTenant.id,
    planIdOrCode: "TRIAL",
  });
  if (!invExpiredRes.success || !invExpiredRes.data) {
    console.error("FAIL: Could not generate invoice for expiration test:", invExpiredRes.error);
    process.exit(1);
  }
  const invExpired = invExpiredRes.data;

  const expiredWebhookReq = new NextRequest("http://localhost:3000/api/webhooks/borderpay", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-borderpay-token": "bpt_PRrMrXqIOG5VbTnx3IdslCXHiiHMlzAl",
    },
    body: JSON.stringify({
      event: "payment.expired",
      data: {
        referenceId: invExpired.invoiceNumber,
      },
    }),
  });
  await borderpayWebhookHandler(expiredWebhookReq);

  const expiredDB = await prisma.platformInvoice.findUnique({ where: { id: invExpired.id } });
  if (expiredDB?.status !== PlatformInvoiceStatus.EXPIRED) {
    console.error("FAIL: Invoice was not marked EXPIRED by webhook:", expiredDB);
    process.exit(1);
  }
  console.log(`PASS: Webhook payment.expired event marked invoice ${invExpired.invoiceNumber} as EXPIRED.`);

  // --------------------------------------------------------------------------
  // TEST 10: Cancel / Void Invoice (cancelPlatformInvoice)
  // --------------------------------------------------------------------------
  console.log("\n[TEST 10] Testing cancelPlatformInvoice() action & double cancellation guard");
  const inv3Res = await generatePlatformInvoice({
    tenantId: demoTenant.id,
    planIdOrCode: "MONTHLY",
  });
  if (!inv3Res.success || !inv3Res.data) {
    console.error("FAIL: Could not create third invoice:", inv3Res.error);
    process.exit(1);
  }

  const cancelRes = await cancelPlatformInvoice(inv3Res.data.id, "Testing invoice cancellation");
  if (!cancelRes.success) {
    console.error("FAIL: cancelPlatformInvoice() failed:", cancelRes.error);
    process.exit(1);
  }

  const cancelledDB = await prisma.platformInvoice.findUnique({ where: { id: inv3Res.data.id } });
  if (cancelledDB?.status !== PlatformInvoiceStatus.CANCELLED) {
    console.error("FAIL: Invoice not marked CANCELLED:", cancelledDB);
    process.exit(1);
  }
  console.log(`PASS: Invoice ${inv3Res.data.invoiceNumber} successfully cancelled (VOID).`);

  // Double cancellation guard
  const reCancelRes = await cancelPlatformInvoice(inv3Res.data.id, "Attempt re-cancel");
  if (reCancelRes.success) {
    console.error("FAIL: Expected already cancelled invoice to reject re-cancellation");
    process.exit(1);
  }
  console.log("PASS: Re-cancellation correctly rejected:", reCancelRes.error);

  // --------------------------------------------------------------------------
  // TEST 11: Core Plan Deletion Protection
  // --------------------------------------------------------------------------
  console.log("\n[TEST 11] Testing protection of core default platform plans against deletion");
  const monthlyInDb = await prisma.platformPlan.findUnique({ where: { code: "MONTHLY" } });
  if (!monthlyInDb) {
    console.error("FAIL: MONTHLY plan not found");
    process.exit(1);
  }

  const deleteCoreRes = await deletePlatformPlan(monthlyInDb.id);
  const reCheckMonthly = await prisma.platformPlan.findUnique({ where: { code: "MONTHLY" } });
  if (!reCheckMonthly) {
    console.error("FAIL: Core plan MONTHLY was hard deleted!");
    process.exit(1);
  }
  console.log(`PASS: Core default plan protected against deletion: "${deleteCoreRes.message}"`);

  // Re-activate MONTHLY for platform
  await togglePlatformPlanActive(monthlyInDb.id, true);

  // --------------------------------------------------------------------------
  // TEST 12: Clean Teardown & State Restoration
  // --------------------------------------------------------------------------
  console.log("\n[TEST 12] Restoring Original Database State");
  // Delete all test platform invoices
  await prisma.platformInvoice.deleteMany({
    where: {
      id: { in: [invoice.id, inv2.id, invWebhook.id, invExpired.id, inv3Res.data.id] },
    },
  });

  // Delete custom plan (also cleans up SystemDictionary)
  await deletePlatformPlan(createdPlanId);

  // Verify SystemDictionary customCode cleaned up
  const leftoverDict = await prisma.systemDictionary.findFirst({
    where: { category: "SUBSCRIPTION_PLAN", code: customCode },
  });
  if (leftoverDict) {
    console.error("FAIL: Leftover SystemDictionary row found after deletePlatformPlan:", leftoverDict);
    process.exit(1);
  }

  // Restore demo tenant state
  await prisma.tenant.update({
    where: { id: demoTenant.id },
    data: {
      subscriptionStatus: initialTenantStatus,
      subscriptionTier: initialTenantTier,
      trialEndsAt: initialTenantTrialEndsAt,
    },
  });

  console.log("PASS: Cleaned up test platform invoices, deleted custom plan & dictionary, and restored demo1 tenant.");

  console.log("\n=== ALL REAL SUPER ADMIN FASE 2 TESTS PASSED SUCCESSFULLY! ===");
}

runFase2Tests()
  .catch((err) => {
    console.error("FATAL ERROR in runFase2Tests:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
