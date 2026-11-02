import prisma from "../src/lib/prisma";
import {
  getSystemHealthOverview,
  testClusterConnectivity,
  flushRedisCache,
  executeRedisCommand,
} from "../src/actions/adminSystemActions";
import {
  formatBytes,
  formatUptime,
  getPlanStorageQuotaBytes,
} from "../src/lib/system-utils";
import fs from "fs/promises";
import path from "path";

async function runTests() {
  console.log("=== STARTING SUPER ADMIN SYSTEM HEALTH & INFRASTRUCTURE TESTS ===");

  // ============================================================================
  // TEST 1: RBAC Security Enforcement (Unauthenticated Calls)
  // ============================================================================
  console.log("\n[TEST 1] RBAC Security Check: Unauthenticated access rejection");
  delete process.env.ADMIN_TEST_MODE;

  try {
    await getSystemHealthOverview();
    console.error("FAIL: Expected getSystemHealthOverview() to throw on unauthenticated call");
    process.exit(1);
  } catch (err) {
    const error = err as Error;
    if (error.message.includes("Akses ditolak")) {
      console.log("PASS: getSystemHealthOverview() correctly rejected unauthenticated call:", error.message);
    } else {
      console.error("FAIL: Unexpected error message:", error.message);
      process.exit(1);
    }
  }

  try {
    await testClusterConnectivity();
    console.error("FAIL: Expected testClusterConnectivity() to throw on unauthenticated call");
    process.exit(1);
  } catch (err) {
    const error = err as Error;
    if (error.message.includes("Akses ditolak")) {
      console.log("PASS: testClusterConnectivity() correctly rejected unauthenticated call:", error.message);
    }
  }

  try {
    await flushRedisCache();
    console.error("FAIL: Expected flushRedisCache() to throw on unauthenticated call");
    process.exit(1);
  } catch (err) {
    const error = err as Error;
    if (error.message.includes("Akses ditolak")) {
      console.log("PASS: flushRedisCache() correctly rejected unauthenticated call:", error.message);
    }
  }

  // Enable test mode for subsequent tests
  process.env.ADMIN_TEST_MODE = "true";

  // ============================================================================
  // TEST 2: Helper Functions & Quota Calculators
  // ============================================================================
  console.log("\n[TEST 2] Testing System Helpers (formatBytes, formatUptime, getPlanStorageQuotaBytes)");
  if (formatBytes(0) !== "0 B") throw new Error("formatBytes(0) failed");
  if (formatBytes(1024) !== "1 KB") throw new Error("formatBytes(1024) failed");
  if (formatBytes(1048576) !== "1 MB") throw new Error("formatBytes(1048576) failed");
  if (formatBytes(1073741824) !== "1 GB") throw new Error("formatBytes(1073741824) failed");

  if (formatUptime(45) !== "45d") throw new Error("formatUptime(45) failed");
  if (formatUptime(125) !== "2m 5d") throw new Error("formatUptime(125) failed");
  if (formatUptime(3665) !== "1j 1m 5d") throw new Error("formatUptime(3665) failed");
  if (formatUptime(90065) !== "1h 1j 1m 5d") throw new Error("formatUptime(90065) failed");

  const trialQuota = getPlanStorageQuotaBytes("TRIAL");
  const proQuota = getPlanStorageQuotaBytes("MONTHLY");
  const entQuota = getPlanStorageQuotaBytes("ENTERPRISE");

  if (trialQuota !== 500 * 1024 * 1024) throw new Error("Trial quota incorrect");
  if (proQuota !== 2 * 1024 * 1024 * 1024) throw new Error("Pro quota incorrect");
  if (entQuota !== 10 * 1024 * 1024 * 1024) throw new Error("Enterprise quota incorrect");
  console.log("PASS: System helpers and quota logic verified cleanly.");

  // ============================================================================
  // TEST 3: Full System Health Overview
  // ============================================================================
  console.log("\n[TEST 3] Testing getSystemHealthOverview() Telemetry Aggregation");
  const overview = await getSystemHealthOverview();

  // 3.1 PostgreSQL Telemetry
  console.log("Checking PostgreSQL telemetry...");
  if (overview.database.status !== "ONLINE") {
    throw new Error(`Database status is not ONLINE: ${overview.database.status}`);
  }
  if (overview.database.sizeBytes <= 0) {
    throw new Error(`Invalid DB sizeBytes: ${overview.database.sizeBytes}`);
  }
  if (!overview.database.version.includes("PostgreSQL 16")) {
    throw new Error(`Unexpected PostgreSQL version: ${overview.database.version}`);
  }
  if (overview.database.activeConnections < 1) {
    throw new Error(`Invalid active connections: ${overview.database.activeConnections}`);
  }
  console.log(`PASS: PostgreSQL online (Size: ${overview.database.sizePretty}, Conns: ${overview.database.activeConnections}, Latency: ${overview.database.latencyMs}ms)`);

  // 3.2 Redis Telemetry
  console.log("Checking Redis 7 telemetry...");
  if (overview.redis.status !== "ONLINE") {
    throw new Error(`Redis status is not ONLINE: ${overview.redis.status}`);
  }
  if (!overview.redis.version.includes("Redis 7")) {
    throw new Error(`Unexpected Redis version: ${overview.redis.version}`);
  }
  console.log(`PASS: Redis 7 online (${overview.redis.version}, Ping: ${overview.redis.pingLatencyMs}ms)`);

  // Test Redis socket error handling with bad credentials
  const badAuthRes = await executeRedisCommand(["PING"], 2000, {
    host: "127.0.0.1",
    port: 6379,
    password: "definitely_wrong_redis_password_123",
  });
  if (badAuthRes.success) {
    throw new Error("Redis command should have failed with invalid password");
  }
  if (!badAuthRes.error || (!badAuthRes.error.includes("WRONGPASS") && !badAuthRes.error.includes("ERR"))) {
    throw new Error(`Unexpected Redis error message: ${badAuthRes.error}`);
  }
  console.log(`PASS: Redis socket client correctly rejected invalid credentials without hanging: ${badAuthRes.error}`);

  // 3.3 Node Runtime Telemetry
  console.log("Checking Node Runtime telemetry...");
  if (overview.runtime.nodeVersion !== process.version) {
    throw new Error("Node version mismatch");
  }
  if (overview.runtime.heapUsedBytes <= 0 || overview.runtime.heapTotalBytes <= 0) {
    throw new Error("Invalid heap memory stats");
  }
  console.log(`PASS: Node runtime verified (${overview.runtime.nodeVersion}, Heap: ${overview.runtime.heapUsedFormatted} / ${overview.runtime.heapTotalFormatted})`);

  // 3.4 Wildcard SSL Telemetry
  console.log("Checking Wildcard SSL telemetry...");
  if (!overview.ssl.isWildcard) {
    throw new Error("SSL is not wildcard");
  }
  if (overview.ssl.daysRemaining <= 0) {
    throw new Error("Invalid daysRemaining for SSL");
  }
  console.log(`PASS: Wildcard SSL verified (${overview.ssl.domain}, ${overview.ssl.daysRemaining} days remaining)`);

  // 3.5 BorderPay Gateway Telemetry
  console.log("Checking BorderPay telemetry...");
  if (overview.borderpay.status !== "ONLINE") {
    throw new Error(`BorderPay status is not ONLINE: ${overview.borderpay.status}`);
  }
  if (!overview.borderpay.hasLiveKey && !overview.borderpay.hasTestKey) {
    throw new Error("BorderPay has no active key configured");
  }
  console.log(`PASS: BorderPay Gateway reachable (Mode: ${overview.borderpay.mode}, Latency: ${overview.borderpay.latencyMs}ms)`);

  // ============================================================================
  // TEST 4: Storage Metering & Disk Walk
  // ============================================================================
  console.log("\n[TEST 4] Testing Storage Metering & Quota Calculation per Tenant");
  if (overview.storage.tenantQuotas.length === 0) {
    throw new Error("No tenant quotas found");
  }

  const demo1Quota = overview.storage.tenantQuotas.find((q) => q.subdomain === "demo1");
  if (!demo1Quota) {
    throw new Error("demo1 tenant quota missing");
  }
  if (demo1Quota.storageQuotaBytes !== 10 * 1024 * 1024 * 1024) {
    throw new Error(`Unexpected quota for demo1 Enterprise: ${demo1Quota.storageQuotaBytes}`);
  }
  console.log(`PASS: demo1 storage quota verified: ${demo1Quota.storageUsedFormatted} / ${demo1Quota.storageQuotaFormatted} (${demo1Quota.percentageUsed}%, Status: ${demo1Quota.statusBadge})`);

  // Test dynamic file addition to ensure directory walk measures real bytes and isolates tenants
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "demo1");
  const demo2Dir = path.join(process.cwd(), "public", "uploads", "demo2");
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.mkdir(demo2Dir, { recursive: true });

  const testFilePath1 = path.join(uploadsDir, "test-metering.txt");
  const testFilePath2 = path.join(demo2Dir, "test-metering-demo2.txt");
  const testPayload1 = "A".repeat(50000); // 50 KB
  const testPayload2 = "B".repeat(25000); // 25 KB
  await fs.writeFile(testFilePath1, testPayload1);
  await fs.writeFile(testFilePath2, testPayload2);

  try {
    const updatedOverview = await getSystemHealthOverview();
    const updatedDemo1 = updatedOverview.storage.tenantQuotas.find((q) => q.subdomain === "demo1");
    const updatedDemo2 = updatedOverview.storage.tenantQuotas.find((q) => q.subdomain === "demo2");

    if (!updatedDemo1 || updatedDemo1.storageUsedBytes < 50000) {
      throw new Error(`Storage metering did not detect newly written file for demo1: ${updatedDemo1?.storageUsedBytes}`);
    }
    if (!updatedDemo2 || updatedDemo2.storageUsedBytes < 25000) {
      throw new Error(`Storage metering did not detect newly written file for demo2: ${updatedDemo2?.storageUsedBytes}`);
    }

    // Verify isolation: demo1 should NOT include demo2 bytes
    const demo1Diff = updatedDemo1.storageUsedBytes - demo1Quota.storageUsedBytes;
    if (demo1Diff < 50000 || demo1Diff > 55000) {
      throw new Error(`Storage isolation breach: demo1 changed by ${demo1Diff} bytes (expected ~50000)`);
    }

    console.log(`PASS: Dynamic storage metering successfully registered new file (+${testPayload1.length} bytes, Total: ${updatedDemo1.storageUsedFormatted})`);
    console.log(`PASS: Multi-tenant storage isolation confirmed (demo2 +${testPayload2.length} bytes did not leak into demo1)`);
  } finally {
    await fs.unlink(testFilePath1).catch(() => {});
    await fs.unlink(testFilePath2).catch(() => {});
  }

  // ============================================================================
  // TEST 5: Tenant Database Distribution
  // ============================================================================
  console.log("\n[TEST 5] Testing Database Data Distribution per Tenant");
  if (overview.distribution.length === 0) {
    throw new Error("Distribution array is empty");
  }

  // Distribution must be sorted by totalRecords descending
  for (let i = 0; i < overview.distribution.length - 1; i++) {
    if (overview.distribution[i].totalRecords < overview.distribution[i + 1].totalRecords) {
      throw new Error("Distribution array is not sorted descending by totalRecords");
    }
  }

  const demo1Dist = overview.distribution.find((d) => d.subdomain === "demo1");
  if (!demo1Dist) throw new Error("demo1 not in distribution");

  if (
    demo1Dist.totalRecords !==
    demo1Dist.jobFilesCount + demo1Dist.invoicesCount + demo1Dist.customersCount + demo1Dist.vendorsCount
  ) {
    throw new Error("Total records sum does not match individual entity counts");
  }
  console.log(`PASS: Distribution verified: demo1 has ${demo1Dist.totalRecords} records (JF: ${demo1Dist.jobFilesCount}, Inv: ${demo1Dist.invoicesCount}, Cust: ${demo1Dist.customersCount}, Vend: ${demo1Dist.vendorsCount})`);

  // ============================================================================
  // TEST 6: Cluster Connectivity Diagnostics Action
  // ============================================================================
  console.log("\n[TEST 6] Testing testClusterConnectivity() Action & Audit Logging");
  const connResult = await testClusterConnectivity();

  if (connResult.postgres.status !== "ONLINE") throw new Error("PostgreSQL ping failed");
  if (connResult.redis.status !== "ONLINE") throw new Error("Redis ping failed");
  if (connResult.borderpay.status !== "ONLINE") throw new Error("BorderPay ping failed");
  if (connResult.storage.status !== "ONLINE") throw new Error("Storage ping failed");

  // Verify audit log creation
  const clusterAudit = await prisma.platformAuditLog.findFirst({
    where: { action: "CLUSTER_CONNECTIVITY_TEST" },
    orderBy: { createdAt: "desc" },
  });
  if (!clusterAudit) throw new Error("CLUSTER_CONNECTIVITY_TEST audit log was not recorded");
  console.log(`PASS: testClusterConnectivity completed in real-time, audit log recorded (${clusterAudit.id})`);

  // ============================================================================
  // TEST 7: Redis Cache Flush Action
  // ============================================================================
  console.log("\n[TEST 7] Testing flushRedisCache() Action & Audit Logging");
  const flushResult = await flushRedisCache();

  if (!flushResult.success) throw new Error(`flushRedisCache failed: ${flushResult.message}`);

  const flushAudit = await prisma.platformAuditLog.findFirst({
    where: { action: "CACHE_FLUSH" },
    orderBy: { createdAt: "desc" },
  });
  if (!flushAudit) throw new Error("CACHE_FLUSH audit log was not recorded");
  console.log(`PASS: flushRedisCache succeeded (${flushResult.message}), audit log recorded (${flushAudit.id})`);

  // Clean up test audit logs
  await prisma.platformAuditLog.deleteMany({
    where: {
      action: { in: ["CLUSTER_CONNECTIVITY_TEST", "CACHE_FLUSH"] },
    },
  });

  console.log("\n=== ALL SUPER ADMIN SYSTEM HEALTH TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
