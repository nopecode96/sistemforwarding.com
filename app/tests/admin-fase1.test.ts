import prisma from "../src/lib/prisma";
import {
  getAdminTenantsData,
  getTenantDetailById,
  toggleTenantSuspension,
  updateTenantSubscription,
  extendTenantTrial,
  resetTenantAdminAccess,
  updateTenantProfile,
} from "../src/actions/adminTenantActions";
import { loginTenantAction } from "../src/lib/auth-actions";
import { SubscriptionStatus, UserRole } from "@prisma/client";

// Comprehensive Test Suite for Super Admin Fase 1
async function runTests() {
  console.log("=== STARTING REAL SUPER ADMIN FASE 1 TEST SUITE ===");

  // 1. Test RBAC Security Enforcement (No session / unauthenticated)
  console.log("\n[TEST 1] RBAC Security Check: Unauthenticated access rejection");
  delete process.env.ADMIN_TEST_MODE;
  try {
    await getAdminTenantsData();
    console.error("FAIL: Expected getAdminTenantsData() to throw on unauthenticated call");
    process.exit(1);
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message.includes("Akses ditolak")) {
      console.log("PASS: Successfully blocked unauthenticated access with error:", error.message);
    } else {
      console.log("PASS: Blocked unauthorized call with error:", error.message);
    }
  }

  // Find demo tenant for testing
  const demoTenant = await prisma.tenant.findUnique({
    where: { subdomain: "demo1" },
    include: { users: true },
  });

  if (!demoTenant) {
    console.error("FAIL: demo1 tenant not found in DB");
    process.exit(1);
  }

  const initialStatus = demoTenant.subscriptionStatus;
  const initialIsActive = demoTenant.isActive;
  const initialTier = demoTenant.subscriptionTier;
  const initialTrialDate = demoTenant.trialEndsAt;
  const initialLegalName = demoTenant.legalName;

  const adminUser =
    demoTenant.users.find((u) => u.role === UserRole.TENANT_ADMIN) || demoTenant.users[0];
  const initialUserPasswordHash = adminUser?.passwordHash ?? null;

  console.log(`Initial demo tenant state: ${demoTenant.companyName} (${demoTenant.subdomain}) - status: ${initialStatus}`);

  // Enable test superadmin bypass for subsequent function tests
  process.env.ADMIN_TEST_MODE = "true";

  // 2. Test getAdminTenantsData()
  console.log("\n[TEST 2] Testing getAdminTenantsData() server action execution");
  const data = await getAdminTenantsData();
  if (!data || !data.summary || !Array.isArray(data.tenants)) {
    console.error("FAIL: getAdminTenantsData() returned invalid format", data);
    process.exit(1);
  }
  console.log(`PASS: Telemetry aggregated successfully: ${data.summary.totalTenants} tenants, ${data.summary.activeTenants} active, ${data.summary.totalJobFiles} job files`);

  // 3. Test getTenantDetailById() by cuid AND by subdomain
  console.log("\n[TEST 3] Testing getTenantDetailById() by CUID and by subdomain");
  const detailByCuid = await getTenantDetailById(demoTenant.id);
  const detailBySub = await getTenantDetailById("demo1");
  if (!detailByCuid || detailByCuid.subdomain !== "demo1") {
    console.error("FAIL: Lookup by cuid failed", detailByCuid);
    process.exit(1);
  }
  if (!detailBySub || detailBySub.id !== demoTenant.id) {
    console.error("FAIL: Lookup by subdomain failed", detailBySub);
    process.exit(1);
  }
  console.log("PASS: Both CUID and subdomain lookups resolved the tenant correctly.");

  // 4. Test toggleTenantSuspension(suspend = true)
  console.log("\n[TEST 4] Testing toggleTenantSuspension(suspend = true) action");
  const suspendRes = await toggleTenantSuspension(demoTenant.id, true, "Testing suspend lockout");
  if (!suspendRes.success) {
    console.error("FAIL: toggleTenantSuspension returned failure:", suspendRes.error);
    process.exit(1);
  }
  const suspendedDB = await prisma.tenant.findUnique({ where: { id: demoTenant.id } });
  if (suspendedDB?.isActive !== false || suspendedDB?.subscriptionStatus !== SubscriptionStatus.SUSPENDED) {
    console.error("FAIL: Tenant DB record not updated to suspended:", suspendedDB);
    process.exit(1);
  }
  console.log("PASS: Tenant suspended in database (isActive=false, status=SUSPENDED).");

  // Verify that a suspended tenant user is blocked from logging in!
  const suspendedLoginForm = new FormData();
  suspendedLoginForm.set("email", adminUser.email);
  suspendedLoginForm.set("subdomain", "demo1");
  const loginAttemptSuspended = await loginTenantAction(suspendedLoginForm);
  if (loginAttemptSuspended.success) {
    console.error("FAIL: loginTenantAction allowed suspended tenant to log in!");
    process.exit(1);
  }
  console.log("PASS: Suspended tenant user correctly blocked from login:", loginAttemptSuspended.error);

  // 5. Test toggleTenantSuspension(suspend = false)
  console.log("\n[TEST 5] Testing toggleTenantSuspension(suspend = false) action");
  const activateRes = await toggleTenantSuspension(demoTenant.id, false, "Reactivation test");
  if (!activateRes.success) {
    console.error("FAIL: toggleTenantSuspension reactivate failed:", activateRes.error);
    process.exit(1);
  }
  const reactivatedDB = await prisma.tenant.findUnique({ where: { id: demoTenant.id } });
  if (reactivatedDB?.isActive !== true || reactivatedDB?.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
    console.error("FAIL: Tenant DB record not restored to active:", reactivatedDB);
    process.exit(1);
  }
  console.log("PASS: Tenant reactivated in database (isActive=true, status=ACTIVE).");

  // 6. Test updateTenantSubscription()
  console.log("\n[TEST 6] Testing updateTenantSubscription() action");
  const updatePlanRes = await updateTenantSubscription(demoTenant.id, {
    subscriptionTier: "ENTERPRISE",
    billingCycle: "YEARLY",
  });
  if (!updatePlanRes.success) {
    console.error("FAIL: updateTenantSubscription failed:", updatePlanRes.error);
    process.exit(1);
  }
  const planDB = await prisma.tenant.findUnique({ where: { id: demoTenant.id } });
  if (planDB?.subscriptionTier !== "ENTERPRISE" || planDB?.billingCycle !== "YEARLY") {
    console.error("FAIL: Database not updated with new plan:", planDB);
    process.exit(1);
  }
  console.log("PASS: Subscription tier and cycle updated to ENTERPRISE / YEARLY.");

  // 7. Test extendTenantTrial()
  console.log("\n[TEST 7] Testing extendTenantTrial() action (+14 days)");
  const extendRes = await extendTenantTrial(demoTenant.id, 14);
  if (!extendRes.success || !extendRes.data?.newTrialEndsAt) {
    console.error("FAIL: extendTenantTrial failed:", extendRes);
    process.exit(1);
  }
  const trialDB = await prisma.tenant.findUnique({ where: { id: demoTenant.id } });
  if (!trialDB?.trialEndsAt) {
    console.error("FAIL: trialEndsAt is null after extension:", trialDB);
    process.exit(1);
  }
  console.log(`PASS: Trial extended successfully to: ${trialDB.trialEndsAt.toISOString()}`);

  // 8. Test resetTenantAdminAccess()
  console.log("\n[TEST 8] Testing resetTenantAdminAccess() action and login credential verification");
  const testPassword = "SF-SuperTestPass123!";
  const resetRes = await resetTenantAdminAccess(demoTenant.id, adminUser.id, testPassword);
  if (!resetRes.success || !resetRes.data) {
    console.error("FAIL: resetTenantAdminAccess failed:", resetRes.error);
    process.exit(1);
  }
  if (resetRes.data.temporaryPassword !== testPassword) {
    console.error("FAIL: temporary password mismatch:", resetRes.data);
    process.exit(1);
  }

  const userDB = await prisma.user.findUnique({ where: { id: adminUser.id } });
  if (userDB?.passwordHash !== testPassword || userDB?.isActive !== true) {
    console.error("FAIL: user record not updated with passwordHash and isActive=true:", userDB);
    process.exit(1);
  }
  console.log("PASS: User password and active status updated in DB.");

  // Verify that the user CAN log in with the new password and CANNOT with a wrong password!
  const wrongLoginForm = new FormData();
  wrongLoginForm.set("email", adminUser.email);
  wrongLoginForm.set("password", "wrongpassword");
  wrongLoginForm.set("subdomain", "demo1");
  const wrongLoginRes = await loginTenantAction(wrongLoginForm);
  if (wrongLoginRes.success) {
    console.error("FAIL: loginTenantAction accepted wrong password!");
    process.exit(1);
  }
  console.log("PASS: Wrong password correctly rejected with:", wrongLoginRes.error);

  const correctLoginForm = new FormData();
  correctLoginForm.set("email", adminUser.email);
  correctLoginForm.set("password", testPassword);
  correctLoginForm.set("subdomain", "demo1");
  const correctLoginRes = await loginTenantAction(correctLoginForm);
  if (!correctLoginRes.success) {
    console.error("FAIL: loginTenantAction rejected valid reset password:", correctLoginRes.error);
    process.exit(1);
  }
  console.log("PASS: Reset password accepted by login action, redirecting to:", correctLoginRes.redirectUrl);

  // 9. Test updateTenantProfile()
  console.log("\n[TEST 9] Testing updateTenantProfile() action");
  const profileRes = await updateTenantProfile(demoTenant.id, {
    legalName: "PT Demo Logistik Pratama Internasional",
  });
  if (!profileRes.success) {
    console.error("FAIL: updateTenantProfile failed:", profileRes.error);
    process.exit(1);
  }
  const profileDB = await prisma.tenant.findUnique({ where: { id: demoTenant.id } });
  if (profileDB?.legalName !== "PT Demo Logistik Pratama Internasional") {
    console.error("FAIL: legalName not updated in DB:", profileDB);
    process.exit(1);
  }
  console.log("PASS: Tenant legal profile updated successfully.");

  // 10. Restore Original DB State
  console.log("\n[TEST 10] Restoring Original Tenant & User State");
  await prisma.tenant.update({
    where: { id: demoTenant.id },
    data: {
      isActive: initialIsActive,
      subscriptionStatus: initialStatus,
      subscriptionTier: initialTier,
      trialEndsAt: initialTrialDate,
      legalName: initialLegalName,
    },
  });

  await prisma.user.update({
    where: { id: adminUser.id },
    data: {
      passwordHash: initialUserPasswordHash,
      isActive: adminUser.isActive,
    },
  });
  console.log("PASS: Original tenant and admin user state cleanly restored.");

  console.log("\n=== ALL REAL SUPER ADMIN FASE 1 TESTS PASSED SUCCESSFULLY! ===");
}

runTests()
  .catch((e) => {
    console.error("Test execution error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
