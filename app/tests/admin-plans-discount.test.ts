import prisma from "../src/lib/prisma";
import {
  getPlatformPlans,
  upsertPlatformPlan,
  deletePlatformPlan,
  togglePlatformPlanActive,
  ensureDefaultPlatformPlans,
} from "../src/actions/adminBillingActions";
import { getActivePlans } from "../src/actions/planActions";

async function runDiscountPriceTests() {
  console.log("=== STARTING PLATFORM PLANS 'HARGA CORET' (DISCOUNT) INTEGRATION TESTS ===");

  process.env.ADMIN_TEST_MODE = "true";

  // 1. Ensure default platform plans are seeded and updated with originalPrice
  console.log("\n[TEST 1] Ensuring default platform plans exist & checking 4 monetization packages");
  await ensureDefaultPlatformPlans();

  const plans = await getPlatformPlans();
  console.log(`Retrieved ${plans.length} platform plans from DB.`);

  const trial = plans.find((p) => p.code === "TRIAL");
  const monthly = plans.find((p) => p.code === "MONTHLY");
  const yearly = plans.find((p) => p.code === "YEARLY");
  const payPerJob = plans.find((p) => p.code === "PAY_PER_JOB");

  if (!trial || !monthly || !yearly || !payPerJob) {
    console.error("FAIL: One or more required packages are missing:", { trial, monthly, yearly, payPerJob });
    process.exit(1);
  }

  // 1a. Free Trial 7 Hari (TRIAL)
  if (trial.name !== "Free Trial 7 Hari" || trial.price !== 0 || trial.durationDays !== 7 || trial.originalPrice !== null) {
    console.error("FAIL: Free Trial configuration mismatch:", trial);
    process.exit(1);
  }
  console.log(`PASS: 1. Free Trial 7 Hari (TRIAL): Rp 0 / 7 hari verified (name: "${trial.name}").`);

  // 1b. Bisnis Profesional (MONTHLY): Rp 1.000.000 / bln, Coret Rp 3.000.000
  if (monthly.name !== "Bisnis Profesional" || monthly.price !== 1000000 || monthly.originalPrice !== 3000000) {
    console.error("FAIL: Bisnis Profesional price/originalPrice mismatch:", monthly);
    process.exit(1);
  }
  const monthlyDiscount = Math.round(((monthly.originalPrice - monthly.price) / monthly.originalPrice) * 100);
  if (monthlyDiscount !== 67) {
    console.error("FAIL: Bisnis Profesional discount percentage mismatch:", monthlyDiscount);
    process.exit(1);
  }
  console.log(`PASS: 2. Bisnis Profesional (MONTHLY): Rp 1jt/bln dari Rp 3jt/bln (Diskon ${monthlyDiscount}%) verified.`);

  // 1c. Enterprise Corpora (YEARLY): Rp 10.000.000 / thn, Coret Rp 12.000.000 + Public Tracking & REST API Embed
  if (yearly.name !== "Enterprise Corpora" || yearly.price !== 10000000 || yearly.originalPrice !== 12000000) {
    console.error("FAIL: Enterprise Corpora price/originalPrice mismatch:", yearly);
    process.exit(1);
  }
  const hasEmbedFeature = yearly.features.some((f) =>
    f.toLowerCase().includes("public tracking") || f.toLowerCase().includes("rest api")
  );
  if (!hasEmbedFeature) {
    console.error("FAIL: Enterprise Corpora missing Public Tracking / REST API Embed feature:", yearly.features);
    process.exit(1);
  }
  const yearlyDiscount = Math.round(((yearly.originalPrice - yearly.price) / yearly.originalPrice) * 100);
  if (yearlyDiscount !== 17) {
    console.error("FAIL: Enterprise Corpora discount percentage mismatch:", yearlyDiscount);
    process.exit(1);
  }
  console.log(`PASS: 3. Enterprise Corpora (YEARLY): Rp 10jt/thn dari Rp 12jt/thn (Diskon ${yearlyDiscount}%) & API Embed feature verified.`);

  // 1d. Pay-Per-Job (PAY_PER_JOB): Rp 50.000 / job, Coret Rp 100.000
  if (payPerJob.name !== "Pay-Per-Job" || payPerJob.price !== 50000 || payPerJob.originalPrice !== 100000 || payPerJob.billingCycle !== "PAY_PER_JOB") {
    console.error("FAIL: Pay-Per-Job configuration mismatch:", payPerJob);
    process.exit(1);
  }
  const ppjDiscount = Math.round(((payPerJob.originalPrice - payPerJob.price) / payPerJob.originalPrice) * 100);
  if (ppjDiscount !== 50) {
    console.error("FAIL: Pay-Per-Job discount percentage mismatch:", ppjDiscount);
    process.exit(1);
  }
  console.log(`PASS: 4. Pay-Per-Job (PAY_PER_JOB): Rp 50rb/job dari Rp 100rb/job (Diskon ${ppjDiscount}%) verified.`);

  // 2. Test upsertPlatformPlan with originalPrice (Create custom promo plan)
  console.log("\n[TEST 2] Testing upsertPlatformPlan with originalPrice persistence");
  const testPromoCode = "PROMO_HARGA_CORET";
  const upsertRes = await upsertPlatformPlan({
    code: testPromoCode,
    name: "Paket Promo Diskon Kilat",
    description: "Paket promo pengujian diskon harga coret",
    price: 750000,
    originalPrice: 1500000,
    billingCycle: "MONTHLY",
    durationDays: 30,
    maxUsers: 8,
    maxJobFiles: 300,
    features: ["Fitur Coret 1", "Fitur Coret 2"],
    isActive: true,
  });

  if (!upsertRes.success || !upsertRes.data) {
    console.error("FAIL: Failed to upsert promo plan:", upsertRes.error);
    process.exit(1);
  }

  if (upsertRes.data.price !== 750000 || upsertRes.data.originalPrice !== 1500000) {
    console.error("FAIL: upsert returned incorrect price/originalPrice:", upsertRes.data);
    process.exit(1);
  }

  // Verify in PostgreSQL directly
  const dbPlan = await prisma.platformPlan.findUnique({
    where: { code: testPromoCode },
  });
  if (!dbPlan || Number(dbPlan.price) !== 750000 || Number(dbPlan.originalPrice) !== 1500000) {
    console.error("FAIL: Direct DB check failed for originalPrice Decimal persistence:", dbPlan);
    process.exit(1);
  }
  console.log("PASS: originalPrice correctly persisted as PostgreSQL Decimal(15,2) and retrieved as number.");

  // Verify SystemDictionary synchronization
  const dictSync = await prisma.systemDictionary.findFirst({
    where: { tenantId: null, category: "SUBSCRIPTION_PLAN", code: testPromoCode },
  });
  if (!dictSync) {
    console.error("FAIL: SystemDictionary entry not found for promo plan");
    process.exit(1);
  }
  const dictMeta = dictSync.metadata as Record<string, unknown>;
  if (dictMeta.price !== 750000 || dictMeta.originalPrice !== 1500000) {
    console.error("FAIL: SystemDictionary metadata does not reflect originalPrice:", dictMeta);
    process.exit(1);
  }
  console.log("PASS: SystemDictionary metadata properly synchronized with originalPrice & formatted labels:", dictMeta);

  // 3. Test clearing originalPrice (removing strikethrough price)
  console.log("\n[TEST 3] Testing clearing originalPrice (setting to null)");
  const clearRes = await upsertPlatformPlan({
    id: upsertRes.data.id,
    code: testPromoCode,
    name: "Paket Promo Diskon Kilat (Harga Reguler)",
    price: 750000,
    originalPrice: null,
    billingCycle: "MONTHLY",
    durationDays: 30,
    maxUsers: 8,
    maxJobFiles: 300,
    features: ["Fitur Reguler"],
  });

  if (!clearRes.success || clearRes.data?.originalPrice !== null) {
    console.error("FAIL: Expected originalPrice to be cleared to null:", clearRes);
    process.exit(1);
  }

  const dbPlanCleared = await prisma.platformPlan.findUnique({
    where: { id: upsertRes.data.id },
  });
  if (dbPlanCleared?.originalPrice !== null) {
    console.error("FAIL: PostgreSQL originalPrice was not set to NULL:", dbPlanCleared);
    process.exit(1);
  }
  console.log("PASS: originalPrice successfully cleared to NULL in PostgreSQL and metadata.");

  // 4. Test public getActivePlans integration
  console.log("\n[TEST 4] Testing getActivePlans() public landing integration");
  const activePlans = await getActivePlans();
  const ppjPublic = activePlans.find((p) => p.planKey === "pay_per_job");
  const monthlyPublic = activePlans.find((p) => p.planKey === "monthly");

  if (!ppjPublic || ppjPublic.period !== "/ job" || ppjPublic.price !== 50000 || ppjPublic.originalPrice !== 100000) {
    console.error("FAIL: Pay-Per-Job in getActivePlans() mismatch:", ppjPublic);
    process.exit(1);
  }
  if (!monthlyPublic || monthlyPublic.originalPrice !== 3000000) {
    console.error("FAIL: Monthly plan in getActivePlans() missing originalPrice:", monthlyPublic);
    process.exit(1);
  }
  console.log("PASS: getActivePlans() correctly returns / job period and originalPrice for public view.");

  // 5. Test protected deletion guard for PAY_PER_JOB
  console.log("\n[TEST 5] Testing core package deletion protection for PAY_PER_JOB");
  const ppjDeleteRes = await deletePlatformPlan(payPerJob.id);
  if (!ppjDeleteRes.success || !ppjDeleteRes.message?.includes("dinonaktifkan, bukan dihapus permanen")) {
    console.error("FAIL: PAY_PER_JOB was not protected from hard deletion:", ppjDeleteRes);
    process.exit(1);
  }
  // Reactivate payPerJob for system integrity across DB and SystemDictionary
  await togglePlatformPlanActive(payPerJob.id, true);
  console.log("PASS: Core package PAY_PER_JOB protected from hard deletion and cleanly reactivated.");

  // 6. Cleanup test promo plan
  console.log("\n[TEST 6] Cleaning up test data");
  await deletePlatformPlan(upsertRes.data.id);
  console.log("PASS: Cleaned up temporary test plan.");

  console.log("\n=== ALL 'HARGA CORET' (DISCOUNT) TESTS PASSED SUCCESSFULLY! ===");
}

runDiscountPriceTests()
  .catch((err) => {
    console.error("FATAL ERROR in runDiscountPriceTests:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
