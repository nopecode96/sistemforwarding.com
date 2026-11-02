import prisma from "../src/lib/prisma";
import {
  recordAuditLog,
  getAuditLogs,
  startTenantImpersonation,
  stopTenantImpersonation,
} from "../src/actions/adminAuditActions";
import {
  toggleTenantSuspension,
  updateTenantSubscription,
  extendTenantTrial,
  resetTenantAdminAccess,
  updateTenantProfile,
} from "../src/actions/adminTenantActions";
import {
  upsertPlatformPlan,
  togglePlatformPlanActive,
  deletePlatformPlan,
} from "../src/actions/adminBillingActions";
import { SubscriptionStatus } from "@prisma/client";

async function runTests() {
  console.log("=== STARTING REAL SUPER ADMIN FASE 3 TEST SUITE (IMPERSONATION & AUDIT TRAIL) ===\n");

  // ============================================================================
  // [TEST 1] RBAC Security Boundaries & Unauthenticated Rejection
  // ============================================================================
  console.log("[TEST 1] RBAC Security Check: Unauthenticated access rejection");
  delete process.env.ADMIN_TEST_MODE;

  // 1.1 getAuditLogs without session
  try {
    await getAuditLogs();
    console.error("FAIL: Expected getAuditLogs() to throw on unauthenticated call");
    process.exit(1);
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message.includes("Akses ditolak")) {
      console.log("PASS: getAuditLogs() correctly rejected unauthenticated call:", error.message);
    } else {
      console.log("PASS: getAuditLogs() blocked call with:", error.message);
    }
  }

  // 1.2 startTenantImpersonation without session
  try {
    const res = await startTenantImpersonation("demo1");
    if (!res.success && res.error?.includes("Akses ditolak")) {
      console.log("PASS: startTenantImpersonation() rejected unauthenticated caller:", res.error);
    } else {
      console.error("FAIL: startTenantImpersonation() did not reject unauthenticated caller:", res);
      process.exit(1);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.log("PASS: startTenantImpersonation() threw unauthorized error:", error.message);
  }

  // 1.3 stopTenantImpersonation when not impersonating
  const stopResNotImpersonating = await stopTenantImpersonation();
  if (
    !stopResNotImpersonating.success &&
    stopResNotImpersonating.error?.includes("tidak sedang dalam mode impersonasi")
  ) {
    console.log(
      "PASS: stopTenantImpersonation() rejected call when no impersonation is active:",
      stopResNotImpersonating.error
    );
  } else {
    console.error(
      "FAIL: stopTenantImpersonation() expected rejection for non-impersonating caller, got:",
      stopResNotImpersonating
    );
    process.exit(1);
  }

  // Enable test SuperAdmin mode for authenticated operations
  process.env.ADMIN_TEST_MODE = "true";

  // Verify demo tenant existence
  const demoTenant = await prisma.tenant.findUnique({
    where: { subdomain: "demo1" },
    include: { users: true },
  });

  if (!demoTenant) {
    console.error("FAIL: Tenant demo1 not found in database.");
    process.exit(1);
  }
  console.log(`Target tenant confirmed: ${demoTenant.companyName} (${demoTenant.subdomain}) - ID: ${demoTenant.id}`);

  // ============================================================================
  // [TEST 2] Testing recordAuditLog() Service & Auto-Resolution
  // ============================================================================
  console.log("\n[TEST 2] Testing recordAuditLog() Service execution & DB persistence");

  const testActionTag = `TEST_AUDIT_${Date.now()}`;
  const logEntry = await recordAuditLog({
    action: testActionTag,
    targetType: "TEST_ENTITY",
    targetId: "test-cuid-12345",
    targetName: "Test Target Payload",
    details: {
      framework: "Next.js 16 Turbopack",
      verified: true,
      timestamp: new Date().toISOString(),
    },
    ipAddress: "192.168.1.100",
    userAgent: "SF-Audit-Test-Runner/1.0",
  });

  if (!logEntry || logEntry.action !== testActionTag) {
    console.error("FAIL: recordAuditLog did not return created record:", logEntry);
    process.exit(1);
  }

  // Verify database record
  const dbRecord = await prisma.platformAuditLog.findUnique({
    where: { id: logEntry.id },
  });

  if (!dbRecord || dbRecord.operatorEmail !== "superadmin@sistemforwarding.com") {
    console.error("FAIL: DB record mismatch or operator not resolved:", dbRecord);
    process.exit(1);
  }
  console.log(`PASS: Audit log persisted successfully: ID=${dbRecord.id}, Action=${dbRecord.action}, Operator=${dbRecord.operatorEmail}`);

  // ============================================================================
  // [TEST 3] Testing getAuditLogs() Querying, Filters & Telemetry Summary
  // ============================================================================
  console.log("\n[TEST 3] Testing getAuditLogs() Server Action with Filtering & Telemetry");

  // 3.1 Fetch all logs
  const allLogs = await getAuditLogs({ page: 1, pageSize: 10 });
  if (!allLogs || allLogs.logs.length === 0 || allLogs.total === 0) {
    console.error("FAIL: getAuditLogs returned empty results:", allLogs);
    process.exit(1);
  }
  console.log(`PASS: Retrieved ${allLogs.logs.length} logs (Total: ${allLogs.total}). Summary: Impersonations=${allLogs.summary.impersonationCount}, Security=${allLogs.summary.securityCount}, Billing=${allLogs.summary.billingCount}`);

  // 3.2 Filter by search query
  const queryLogs = await getAuditLogs({ query: testActionTag, page: 1, pageSize: 5 });
  if (queryLogs.total < 1 || !queryLogs.logs.some((l) => l.action === testActionTag)) {
    console.error("FAIL: Search query filter did not find test log:", queryLogs);
    process.exit(1);
  }
  console.log(`PASS: Search query '${testActionTag}' correctly resolved target audit log.`);

  // 3.3 Filter by targetType
  const targetLogs = await getAuditLogs({ targetType: "TEST_ENTITY" });
  if (targetLogs.total < 1 || targetLogs.logs[0].targetType !== "TEST_ENTITY") {
    console.error("FAIL: TargetType filter failed:", targetLogs);
    process.exit(1);
  }
  console.log(`PASS: TargetType 'TEST_ENTITY' returned matching records.`);

  // 3.4 Pagination check
  const pageLogs = await getAuditLogs({ page: 1, pageSize: 2 });
  if (pageLogs.logs.length > 2 || pageLogs.pageSize !== 2) {
    console.error("FAIL: Pagination pageSize not respected:", pageLogs);
    process.exit(1);
  }
  console.log(`PASS: Pagination correctly sliced to pageSize=2, totalPages=${pageLogs.totalPages}.`);

  // ============================================================================
  // [TEST 4] Testing startTenantImpersonation() Server Action
  // ============================================================================
  console.log("\n[TEST 4] Testing startTenantImpersonation() Server Action");

  // 4.1 Non-existent tenant rejection
  const fakeRes = await startTenantImpersonation("non-existent-tenant-id-9999");
  if (!fakeRes.success && fakeRes.error?.includes("tidak ditemukan")) {
    console.log("PASS: Correctly rejected non-existent tenant impersonation:", fakeRes.error);
  } else {
    console.error("FAIL: Expected rejection for non-existent tenant, got:", fakeRes);
    process.exit(1);
  }

  // 4.2 Start impersonation on demo1
  const impRes = await startTenantImpersonation(demoTenant.id);
  if (!impRes.success || !impRes.redirectUrl || impRes.subdomain !== "demo1") {
    console.error("FAIL: startTenantImpersonation failed:", impRes);
    process.exit(1);
  }
  console.log(`PASS: Impersonation started! Redirect URL: ${impRes.redirectUrl}, Subdomain: ${impRes.subdomain}`);

  // Verify IMPERSONATE_START audit log was generated
  const startAudit = await prisma.platformAuditLog.findFirst({
    where: {
      action: "IMPERSONATE_START",
      targetId: demoTenant.id,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!startAudit || startAudit.targetName !== demoTenant.companyName) {
    console.error("FAIL: IMPERSONATE_START audit log not found in database:", startAudit);
    process.exit(1);
  }
  console.log(`PASS: IMPERSONATE_START audit log confirmed in DB. Target: ${startAudit.targetName}, Operator: ${startAudit.operatorEmail}`);

  // ============================================================================
  // [TEST 5] Testing stopTenantImpersonation() Server Action
  // ============================================================================
  console.log("\n[TEST 5] Testing stopTenantImpersonation() Server Action");

  const stopRes = await stopTenantImpersonation();
  if (!stopRes.success || !stopRes.redirectUrl || !stopRes.redirectUrl.includes("admin")) {
    console.error("FAIL: stopTenantImpersonation failed:", stopRes);
    process.exit(1);
  }
  console.log(`PASS: Impersonation terminated! Redirect URL: ${stopRes.redirectUrl}`);

  // Verify IMPERSONATE_STOP audit log was generated
  const stopAudit = await prisma.platformAuditLog.findFirst({
    where: {
      action: "IMPERSONATE_STOP",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!stopAudit) {
    console.error("FAIL: IMPERSONATE_STOP audit log not found in database.");
    process.exit(1);
  }
  console.log(`PASS: IMPERSONATE_STOP audit log confirmed in DB. Action: ${stopAudit.action}, Operator: ${stopAudit.operatorEmail}`);

  // ============================================================================
  // [TEST 6] Integration Verification: Audit Trail across Admin Operations
  // ============================================================================
  console.log("\n[TEST 6] Testing automatic audit trail emission during Tenant & Billing operations");

  // 6.1 Tenant operations generate audit logs
  await toggleTenantSuspension(demoTenant.id, true, "Penangguhan tes audit fase 3");
  const suspendAudit = await prisma.platformAuditLog.findFirst({
    where: { action: "TENANT_SUSPEND", targetId: demoTenant.id },
    orderBy: { createdAt: "desc" },
  });
  if (!suspendAudit) {
    console.error("FAIL: TENANT_SUSPEND audit log not recorded.");
    process.exit(1);
  }
  console.log("PASS: TENANT_SUSPEND action recorded audit log with details:", suspendAudit.details);

  await toggleTenantSuspension(demoTenant.id, false);
  const activateAudit = await prisma.platformAuditLog.findFirst({
    where: { action: "TENANT_ACTIVATE", targetId: demoTenant.id },
    orderBy: { createdAt: "desc" },
  });
  if (!activateAudit) {
    console.error("FAIL: TENANT_ACTIVATE audit log not recorded.");
    process.exit(1);
  }
  console.log("PASS: TENANT_ACTIVATE action recorded audit log.");

  // 6.2 Update subscription & extend trial
  await updateTenantSubscription(demoTenant.id, {
    subscriptionTier: "ENTERPRISE",
    subscriptionStatus: SubscriptionStatus.ACTIVE,
  });
  const planUpdateAudit = await prisma.platformAuditLog.findFirst({
    where: { action: "TENANT_PLAN_UPDATE", targetId: demoTenant.id },
    orderBy: { createdAt: "desc" },
  });
  if (!planUpdateAudit) {
    console.error("FAIL: TENANT_PLAN_UPDATE audit log not recorded.");
    process.exit(1);
  }
  console.log("PASS: TENANT_PLAN_UPDATE recorded audit log.");

  await extendTenantTrial(demoTenant.id, 7);
  const trialExtendAudit = await prisma.platformAuditLog.findFirst({
    where: { action: "TENANT_TRIAL_EXTEND", targetId: demoTenant.id },
    orderBy: { createdAt: "desc" },
  });
  if (!trialExtendAudit) {
    console.error("FAIL: TENANT_TRIAL_EXTEND audit log not recorded.");
    process.exit(1);
  }
  console.log("PASS: TENANT_TRIAL_EXTEND recorded audit log.");

  // 6.3 Reset password
  await resetTenantAdminAccess(demoTenant.id, undefined, "SistemAuditPass123!");
  const resetPassAudit = await prisma.platformAuditLog.findFirst({
    where: { action: "TENANT_PASSWORD_RESET", targetId: demoTenant.id },
    orderBy: { createdAt: "desc" },
  });
  if (!resetPassAudit) {
    console.error("FAIL: TENANT_PASSWORD_RESET audit log not recorded.");
    process.exit(1);
  }
  console.log("PASS: TENANT_PASSWORD_RESET recorded audit log with target user:", resetPassAudit.details);

  // 6.4 Update tenant profile
  await updateTenantProfile(demoTenant.id, {
    legalName: "PT Demo Satu Logistik Indonesia",
    taxId: "01.234.567.8-999.000",
  });
  const profileUpdateAudit = await prisma.platformAuditLog.findFirst({
    where: { action: "TENANT_PROFILE_UPDATE", targetId: demoTenant.id },
    orderBy: { createdAt: "desc" },
  });
  if (!profileUpdateAudit) {
    console.error("FAIL: TENANT_PROFILE_UPDATE audit log not recorded.");
    process.exit(1);
  }
  console.log("PASS: TENANT_PROFILE_UPDATE recorded audit log.");

  // 6.5 Billing plan operations
  const customPlanRes = await upsertPlatformPlan({
    code: "AUDIT_TEST_PLAN",
    name: "Paket Audit Khusus",
    description: "Paket pengujian audit trail",
    price: 3500000,
    billingCycle: "MONTHLY",
    durationDays: 30,
    maxUsers: 15,
    maxJobFiles: 500,
    features: ["Fitur A", "Fitur B"],
    isActive: true,
  });

  if (!customPlanRes.success || !customPlanRes.data) {
    console.error("FAIL: Failed to create plan for audit test:", customPlanRes);
    process.exit(1);
  }

  const planUpsertAudit = await prisma.platformAuditLog.findFirst({
    where: { action: "PLAN_UPSERT", targetId: customPlanRes.data.id },
    orderBy: { createdAt: "desc" },
  });
  if (!planUpsertAudit) {
    console.error("FAIL: PLAN_UPSERT audit log not recorded.");
    process.exit(1);
  }
  console.log("PASS: PLAN_UPSERT recorded audit log.");

  await togglePlatformPlanActive(customPlanRes.data.id, false);
  const planToggleAudit = await prisma.platformAuditLog.findFirst({
    where: { action: "PLAN_TOGGLE", targetId: customPlanRes.data.id },
    orderBy: { createdAt: "desc" },
  });
  if (!planToggleAudit) {
    console.error("FAIL: PLAN_TOGGLE audit log not recorded.");
    process.exit(1);
  }
  console.log("PASS: PLAN_TOGGLE recorded audit log.");

  await deletePlatformPlan(customPlanRes.data.id);
  const planDeleteAudit = await prisma.platformAuditLog.findFirst({
    where: { action: "PLAN_DELETE", targetId: customPlanRes.data.id },
    orderBy: { createdAt: "desc" },
  });
  if (!planDeleteAudit) {
    console.error("FAIL: PLAN_DELETE audit log not recorded.");
    process.exit(1);
  }
  console.log("PASS: PLAN_DELETE recorded audit log.");

  // ============================================================================
  // [TEST 7] Category Filtering Verification (IMPERSONATION, SECURITY, BILLING)
  // ============================================================================
  console.log("\n[TEST 7] Testing Action Category Aggregation Filters");

  const impCatLogs = await getAuditLogs({ action: "IMPERSONATION" });
  if (
    impCatLogs.total === 0 ||
    !impCatLogs.logs.every((l) =>
      ["IMPERSONATE_START", "IMPERSONATE_STOP"].includes(l.action)
    )
  ) {
    console.error("FAIL: IMPERSONATION category filter returned non-impersonation logs:", impCatLogs);
    process.exit(1);
  }
  console.log(`PASS: IMPERSONATION category filter returned ${impCatLogs.total} matching records.`);

  const secCatLogs = await getAuditLogs({ action: "SECURITY" });
  if (
    secCatLogs.total === 0 ||
    !secCatLogs.logs.every((l) =>
      [
        "TENANT_SUSPEND",
        "TENANT_ACTIVATE",
        "TENANT_PASSWORD_RESET",
        "TENANT_PROFILE_UPDATE",
        "ADMIN_LOGIN",
        "ADMIN_LOGOUT",
      ].includes(l.action)
    )
  ) {
    console.error("FAIL: SECURITY category filter returned invalid logs:", secCatLogs);
    process.exit(1);
  }
  console.log(`PASS: SECURITY category filter returned ${secCatLogs.total} matching records.`);

  const billCatLogs = await getAuditLogs({ action: "BILLING" });
  if (
    billCatLogs.total === 0 ||
    !billCatLogs.logs.every((l) =>
      [
        "INVOICE_PAID_MANUAL",
        "INVOICE_CANCEL",
        "INVOICE_GENERATE",
        "PLAN_UPSERT",
        "PLAN_TOGGLE",
        "PLAN_DELETE",
        "BORDERPAY_RECONCILE",
      ].includes(l.action)
    )
  ) {
    console.error("FAIL: BILLING category filter returned invalid logs:", billCatLogs);
    process.exit(1);
  }
  console.log(`PASS: BILLING category filter returned ${billCatLogs.total} matching records.`);

  // ============================================================================
  // [TEST 8] Cleanup and Database State Restoration
  // ============================================================================
  console.log("\n[TEST 8] Restoring Original Database State");

  // Restore demo tenant
  await prisma.tenant.update({
    where: { id: demoTenant.id },
    data: {
      subscriptionStatus: demoTenant.subscriptionStatus,
      subscriptionTier: demoTenant.subscriptionTier,
      trialEndsAt: demoTenant.trialEndsAt,
      isActive: demoTenant.isActive,
    },
  });

  // Restore demo user password
  const firstUser = demoTenant.users[0];
  if (firstUser) {
    await prisma.user.update({
      where: { id: firstUser.id },
      data: {
        passwordHash: firstUser.passwordHash,
        isActive: firstUser.isActive,
      },
    });
  }

  // Delete test audit tag
  await prisma.platformAuditLog.deleteMany({
    where: { action: testActionTag },
  });

  console.log("PASS: Test audit records cleaned and demo tenant cleanly restored.");

  console.log("\n=== ALL REAL SUPER ADMIN FASE 3 TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("CRITICAL TEST FAILURE:", err);
  process.exit(1);
});
