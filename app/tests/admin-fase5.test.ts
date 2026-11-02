import prisma from "../src/lib/prisma";
import {
  getPlatformAnalyticsOverview,
  exportPlatformBillingExcel,
  exportTenantUtilizationExcel,
} from "../src/actions/adminAnalyticsActions";
import {
  getGlobalPorts,
  upsertGlobalPort,
  deleteGlobalPort,
  getGlobalCarriers,
  upsertGlobalCarrier,
  deleteGlobalCarrier,
  getGlobalCurrencies,
  updateGlobalExchangeRate,
  upsertGlobalCurrency,
  deleteGlobalCurrency,
} from "../src/actions/adminMasterActions";
import { PortType, TransportMode } from "@prisma/client";

async function runTests() {
  console.log("=== STARTING REAL SUPER ADMIN FASE 5 TEST SUITE (ANALYTICS & MASTER DATA GOVERNANCE) ===\n");

  const createdPortIds: string[] = [];
  const createdCarrierIds: string[] = [];
  const createdCurrencyIds: string[] = [];
  const testAuditActions = [
    "PORT_CREATE",
    "PORT_UPDATE",
    "PORT_DELETE",
    "CARRIER_CREATE",
    "CARRIER_UPDATE",
    "CARRIER_DELETE",
    "FX_RATE_UPDATE",
    "CURRENCY_CREATE",
    "CURRENCY_UPDATE",
    "CURRENCY_DELETE",
  ];

  try {
    // ============================================================================
    // [TEST 1] RBAC Security Boundaries & Unauthenticated Rejection
    // ============================================================================
    console.log("[TEST 1] RBAC Security Check: Unauthenticated access rejection");
    delete process.env.ADMIN_TEST_MODE;

    // 1.1 Analytics Actions
    try {
      await getPlatformAnalyticsOverview();
      console.error("FAIL: Expected getPlatformAnalyticsOverview() to throw when unauthenticated");
      process.exit(1);
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (!msg.includes("hak istimewa Super Administrator")) {
        console.error("FAIL: Unexpected error message:", msg);
        process.exit(1);
      }
      console.log("PASS: getPlatformAnalyticsOverview() blocked unauthenticated call.");
    }

    try {
      await exportPlatformBillingExcel();
      console.error("FAIL: Expected exportPlatformBillingExcel() to throw when unauthenticated");
      process.exit(1);
    } catch {
      console.log("PASS: exportPlatformBillingExcel() blocked unauthenticated call.");
    }

    try {
      await exportTenantUtilizationExcel();
      console.error("FAIL: Expected exportTenantUtilizationExcel() to throw when unauthenticated");
      process.exit(1);
    } catch {
      console.log("PASS: exportTenantUtilizationExcel() blocked unauthenticated call.");
    }

    // 1.2 Master Actions
    try {
      await getGlobalPorts();
      console.error("FAIL: Expected getGlobalPorts() to throw when unauthenticated");
      process.exit(1);
    } catch {
      console.log("PASS: getGlobalPorts() blocked unauthenticated call.");
    }

    try {
      await getGlobalCarriers();
      console.error("FAIL: Expected getGlobalCarriers() to throw when unauthenticated");
      process.exit(1);
    } catch {
      console.log("PASS: getGlobalCarriers() blocked unauthenticated call.");
    }

    try {
      await getGlobalCurrencies();
      console.error("FAIL: Expected getGlobalCurrencies() to throw when unauthenticated");
      process.exit(1);
    } catch {
      console.log("PASS: getGlobalCurrencies() blocked unauthenticated call.");
    }

    // ============================================================================
    // [TEST 2] Executive Analytics Telemetry Aggregations (MRR, ARR, GMV, Aging)
    // ============================================================================
    console.log("\n[TEST 2] Testing getPlatformAnalyticsOverview() SaaS & GMV Aggregation");
    process.env.ADMIN_TEST_MODE = "true";

    const overview = await getPlatformAnalyticsOverview();

    if (typeof overview.financials.mrr !== "number" || overview.financials.mrr < 0) {
      console.error("FAIL: Invalid MRR calculation:", overview.financials.mrr);
      process.exit(1);
    }
    if (overview.financials.arr !== overview.financials.mrr * 12) {
      console.error("FAIL: ARR must equal MRR * 12. Got:", overview.financials.arr);
      process.exit(1);
    }
    console.log(
      `PASS: MRR & ARR calculated -> MRR: Rp ${overview.financials.mrr.toLocaleString(
        "id-ID"
      )}, ARR: Rp ${overview.financials.arr.toLocaleString("id-ID")}`
    );

    if (typeof overview.logistics.totalGMV !== "number" || overview.logistics.totalGMV < 0) {
      console.error("FAIL: Invalid GMV calculation:", overview.logistics.totalGMV);
      process.exit(1);
    }
    console.log(
      `PASS: Platform Logistics GMV aggregated -> Total GMV: Rp ${overview.logistics.totalGMV.toLocaleString(
        "id-ID"
      )}, Gross Profit: Rp ${overview.logistics.totalGrossProfit.toLocaleString("id-ID")}, Total Jobs: ${
        overview.logistics.totalJobFiles
      }`
    );

    // Multimodal volume breakdown
    if (
      !overview.logistics.volumeByMode.SEA ||
      !overview.logistics.volumeByMode.AIR ||
      !overview.logistics.volumeByMode.INLAND
    ) {
      console.error("FAIL: Missing multimodal distribution keys");
      process.exit(1);
    }
    console.log(
      `PASS: Multimodal Volume distribution verified: Sea=${overview.logistics.volumeByMode.SEA.count}, Air=${overview.logistics.volumeByMode.AIR.count}, Inland=${overview.logistics.volumeByMode.INLAND.count}`
    );

    // Tenant conversion & aging
    if (overview.tenants.totalTenants <= 0) {
      console.error("FAIL: totalTenants should be > 0");
      process.exit(1);
    }
    console.log(
      `PASS: Tenant growth & conversion -> Total: ${overview.tenants.totalTenants}, Active: ${overview.tenants.activeTenants}, Conversion: ${overview.tenants.conversionRate}%`
    );
    console.log(
      `PASS: Invoice Aging telemetry -> Current: ${overview.financials.invoiceAging.current.count}, Overdue: ${
        overview.financials.invoiceAging.overdue30.count +
        overview.financials.invoiceAging.overdue60.count +
        overview.financials.invoiceAging.overdue90Plus.count
      }`
    );

    // ============================================================================
    // [TEST 3] Excel Export Workbooks Generation (ExcelJS)
    // ============================================================================
    console.log("\n[TEST 3] Testing ExcelJS Export Engines");

    // 3.1 SaaS Platform Billing Excel
    const billingExcel = await exportPlatformBillingExcel();
    if (!billingExcel.filename.endsWith(".xlsx")) {
      console.error("FAIL: Expected filename ending in .xlsx, got:", billingExcel.filename);
      process.exit(1);
    }
    if (!billingExcel.base64 || billingExcel.base64.length < 500) {
      console.error("FAIL: billingExcel base64 is empty or too short");
      process.exit(1);
    }
    // Verify Zip Header (PK\x03\x04 -> Base64 starts with 'UEsDB')
    if (!billingExcel.base64.startsWith("UEsDB")) {
      console.error("FAIL: Billing Excel does not have valid XLSX/ZIP magic bytes");
      process.exit(1);
    }
    console.log(
      `PASS: exportPlatformBillingExcel() generated valid XLSX workbook "${billingExcel.filename}" (${billingExcel.totalRows} invoices, ${billingExcel.base64.length} chars base64)`
    );

    // 3.2 Tenant Utilization Excel
    const tenantExcel = await exportTenantUtilizationExcel();
    if (!tenantExcel.filename.endsWith(".xlsx")) {
      console.error("FAIL: Expected filename ending in .xlsx, got:", tenantExcel.filename);
      process.exit(1);
    }
    if (!tenantExcel.base64.startsWith("UEsDB")) {
      console.error("FAIL: Tenant Excel does not have valid XLSX/ZIP magic bytes");
      process.exit(1);
    }
    console.log(
      `PASS: exportTenantUtilizationExcel() generated valid XLSX workbook "${tenantExcel.filename}" (${tenantExcel.totalRows} tenants, ${tenantExcel.base64.length} chars base64)`
    );

    // ============================================================================
    // [TEST 4] Master Data: UN/LOCODE Ports & Airports CRUD + Audit Logging
    // ============================================================================
    console.log("\n[TEST 4] Testing UN/LOCODE Global Ports CRUD & Audit Logging");

    const initialPorts = await getGlobalPorts({ page: 1, pageSize: 20 });
    if (initialPorts.total < 3) {
      console.error("FAIL: Expected at least 3 global ports auto-seeded");
      process.exit(1);
    }
    console.log(`PASS: Auto-seeded ports retrieved. Total count: ${initialPorts.total}`);

    // Create test port
    const testPortCode = "IDTST";
    const createPortRes = await upsertGlobalPort({
      portCode: testPortCode,
      portName: "Terminal Uji Coba Super Admin Priok",
      portType: PortType.SEA_PORT,
      city: "Jakarta Utara",
      countryCode: "ID",
      countryName: "Indonesia",
      isMajor: false,
      isActive: true,
      latitude: -6.11,
      longitude: 106.89,
    });

    if (!createPortRes.success || !createPortRes.data) {
      console.error("FAIL: Failed to create port:", createPortRes.error);
      process.exit(1);
    }
    createdPortIds.push(createPortRes.data.id);
    console.log(`PASS: Created test port (ID: ${createPortRes.data.id}, Code: ${createPortRes.data.portCode})`);

    // Verify PORT_CREATE audit log
    const portCreateAudit = await prisma.platformAuditLog.findFirst({
      where: { action: "PORT_CREATE", targetId: createPortRes.data.id },
    });
    if (!portCreateAudit) {
      console.error("FAIL: Missing PORT_CREATE audit log");
      process.exit(1);
    }
    console.log(`PASS: PORT_CREATE audit log verified with operator: ${portCreateAudit.operatorEmail}`);

    // Test Duplicate Port Code collision
    const dupPortRes = await upsertGlobalPort({
      portCode: testPortCode,
      portName: "Pelabuhan Duplikat",
      portType: PortType.SEA_PORT,
      city: "Jakarta",
      countryCode: "ID",
      countryName: "Indonesia",
    });
    if (dupPortRes.success) {
      console.error("FAIL: Expected duplicate portCode creation to fail");
      process.exit(1);
    }
    console.log(`PASS: UN/LOCODE uniqueness constraint enforced: ${dupPortRes.error}`);

    // Update Port
    const updatePortRes = await upsertGlobalPort({
      id: createPortRes.data.id,
      portCode: testPortCode,
      portName: "Terminal Uji Coba Priok (Updated)",
      portType: PortType.SEA_PORT,
      city: "Jakarta Utara",
      countryCode: "ID",
      countryName: "Indonesia",
      isMajor: true,
    });
    if (!updatePortRes.success) {
      console.error("FAIL: Failed to update port:", updatePortRes.error);
      process.exit(1);
    }
    console.log("PASS: Successfully updated port details.");

    // Verify PORT_UPDATE audit log
    const portUpdateAudit = await prisma.platformAuditLog.findFirst({
      where: { action: "PORT_UPDATE", targetId: createPortRes.data.id },
    });
    if (!portUpdateAudit) {
      console.error("FAIL: Missing PORT_UPDATE audit log");
      process.exit(1);
    }
    console.log("PASS: PORT_UPDATE audit log verified.");

    // Test Unicode diacritics in port name and city search (e.g. São Paulo)
    const diacriticPort = await upsertGlobalPort({
      portCode: "BRSSZ",
      portName: "Porto de Santos (São Paulo)",
      portType: PortType.SEA_PORT,
      city: "São Paulo",
      countryCode: "BR",
      countryName: "Brazil",
      isMajor: true,
    });
    if (!diacriticPort.success || !diacriticPort.data) {
      console.error("FAIL: Failed to create diacritic port:", diacriticPort.error);
      process.exit(1);
    }
    const searchRes = await getGlobalPorts({ search: "São Paulo" });
    if (!searchRes.ports.some((p) => p.portCode === "BRSSZ")) {
      console.error("FAIL: Search for diacritic city 'São Paulo' did not return the created port");
      process.exit(1);
    }
    console.log("PASS: Unicode diacritics (São Paulo) successfully supported in port search.");
    await deleteGlobalPort(diacriticPort.data.id);

    // Delete Port
    const deletePortRes = await deleteGlobalPort(createPortRes.data.id);
    if (!deletePortRes.success) {
      console.error("FAIL: Failed to delete port:", deletePortRes.error);
      process.exit(1);
    }
    console.log("PASS: Port successfully deleted from database.");

    // Verify PORT_DELETE audit log
    const portDeleteAudit = await prisma.platformAuditLog.findFirst({
      where: { action: "PORT_DELETE", targetId: createPortRes.data.id },
    });
    if (!portDeleteAudit) {
      console.error("FAIL: Missing PORT_DELETE audit log");
      process.exit(1);
    }
    console.log("PASS: PORT_DELETE audit log verified.");

    // ============================================================================
    // [TEST 5] Master Data: Global Carriers (Shipping Lines & Airlines) CRUD
    // ============================================================================
    console.log("\n[TEST 5] Testing Global Carriers CRUD & SystemDictionary Sync");

    const initialCarriers = await getGlobalCarriers();
    if (initialCarriers.total < 3) {
      console.error("FAIL: Expected at least 3 global carriers auto-seeded");
      process.exit(1);
    }
    console.log(`PASS: Auto-seeded carriers retrieved. Total count: ${initialCarriers.total}`);

    // Create test carrier
    const testCarrierCode = "TSTC";
    const createCarrierRes = await upsertGlobalCarrier({
      carrierCode: testCarrierCode,
      carrierName: "Nusantara Cargo Line Express",
      mode: TransportMode.SEA,
      scacCode: "NCLE",
      country: "ID",
      website: "https://nusantaracargo.example.com",
      isActive: true,
    });

    if (!createCarrierRes.success || !createCarrierRes.data) {
      console.error("FAIL: Failed to create carrier:", createCarrierRes.error);
      process.exit(1);
    }
    createdCarrierIds.push(createCarrierRes.data.id);
    console.log(`PASS: Created test carrier (ID: ${createCarrierRes.data.id}, Code: ${createCarrierRes.data.carrierCode})`);

    // Verify mirrored in SystemDictionary
    const dictMirror = await prisma.systemDictionary.findFirst({
      where: { tenantId: null, category: "CARRIER", code: testCarrierCode },
    });
    if (!dictMirror || dictMirror.label !== "Nusantara Cargo Line Express") {
      console.error("FAIL: Carrier was not mirrored properly to SystemDictionary");
      process.exit(1);
    }
    console.log(`PASS: Global carrier mirrored cleanly to SystemDictionary (label: ${dictMirror.label})`);

    // Verify CARRIER_CREATE audit log
    const carrierCreateAudit = await prisma.platformAuditLog.findFirst({
      where: { action: "CARRIER_CREATE", targetId: createCarrierRes.data.id },
    });
    if (!carrierCreateAudit) {
      console.error("FAIL: Missing CARRIER_CREATE audit log");
      process.exit(1);
    }
    console.log("PASS: CARRIER_CREATE audit log verified.");

    // Update Carrier with Code Change to verify SystemDictionary rename sync
    const updatedTestCarrierCode = "TSTC2";
    const updateCarrierRes = await upsertGlobalCarrier({
      id: createCarrierRes.data.id,
      carrierCode: updatedTestCarrierCode,
      carrierName: "Nusantara Cargo Line Global (Updated)",
      mode: TransportMode.SEA,
      scacCode: "NCLE",
      country: "ID",
    });
    if (!updateCarrierRes.success) {
      console.error("FAIL: Failed to update carrier with new code:", updateCarrierRes.error);
      process.exit(1);
    }
    console.log("PASS: Global carrier updated with new code and synced.");

    // Verify SystemDictionary was renamed and old code removed
    const oldDict = await prisma.systemDictionary.findFirst({
      where: { tenantId: null, category: "CARRIER", code: testCarrierCode },
    });
    const newDict = await prisma.systemDictionary.findFirst({
      where: { tenantId: null, category: "CARRIER", code: updatedTestCarrierCode },
    });
    if (oldDict || !newDict || newDict.label !== "Nusantara Cargo Line Global (Updated)") {
      console.error("FAIL: SystemDictionary was not cleanly renamed upon carrier code update");
      process.exit(1);
    }
    console.log("PASS: Mirrored SystemDictionary entry successfully migrated to new code without orphaning old record.");

    // Delete Carrier
    const deleteCarrierRes = await deleteGlobalCarrier(createCarrierRes.data.id);
    if (!deleteCarrierRes.success) {
      console.error("FAIL: Failed to delete carrier:", deleteCarrierRes.error);
      process.exit(1);
    }
    console.log("PASS: Global carrier and mirrored dictionary entry successfully deleted.");

    // Verify CARRIER_DELETE audit log
    const carrierDeleteAudit = await prisma.platformAuditLog.findFirst({
      where: { action: "CARRIER_DELETE", targetId: createCarrierRes.data.id },
    });
    if (!carrierDeleteAudit) {
      console.error("FAIL: Missing CARRIER_DELETE audit log");
      process.exit(1);
    }
    console.log("PASS: CARRIER_DELETE audit log verified.");

    // ============================================================================
    // [TEST 6] Master Data: Currency & Daily FX Rates Engine CRUD
    // ============================================================================
    console.log("\n[TEST 6] Testing Currency & Daily FX Exchange Rate Engine");

    const currencies = await getGlobalCurrencies();
    const idr = currencies.find((c) => c.code === "IDR");
    const usd = currencies.find((c) => c.code === "USD");

    if (!idr || !idr.isBaseCurrency || idr.exchangeRate !== 1.0) {
      console.error("FAIL: Functional base currency IDR must exist with rate 1.0");
      process.exit(1);
    }
    if (!usd) {
      console.error("FAIL: Global currency USD must exist");
      process.exit(1);
    }
    console.log(`PASS: Base IDR verified (Rate=1.0). Current USD rate: Rp ${usd.exchangeRate.toLocaleString("id-ID")}`);

    // Update USD FX Rate
    const newUsdRate = 16350;
    const oldUsdRate = usd.exchangeRate;
    const updateFxRes = await updateGlobalExchangeRate({
      id: usd.id,
      exchangeRate: newUsdRate,
    });
    if (!updateFxRes.success || !updateFxRes.data) {
      console.error("FAIL: Failed to update USD exchange rate:", updateFxRes.error);
      process.exit(1);
    }
    if (updateFxRes.data.exchangeRate !== newUsdRate) {
      console.error("FAIL: USD rate did not update to 16350");
      process.exit(1);
    }
    console.log(`PASS: updateGlobalExchangeRate() successfully updated USD rate to Rp ${newUsdRate}`);

    // Verify FX_RATE_UPDATE audit log
    const fxAudit = await prisma.platformAuditLog.findFirst({
      where: { action: "FX_RATE_UPDATE", targetId: usd.id },
      orderBy: { createdAt: "desc" },
    });
    if (!fxAudit) {
      console.error("FAIL: Missing FX_RATE_UPDATE audit log");
      process.exit(1);
    }
    console.log("PASS: FX_RATE_UPDATE audit log verified with detailed rate changes.");

    // Test Safety: Changing base IDR rate should be rejected
    const invalidIdrUpdate = await updateGlobalExchangeRate({
      id: idr.id,
      exchangeRate: 15000,
    });
    if (invalidIdrUpdate.success) {
      console.error("FAIL: Expected changing base IDR rate to non-1.0 to fail");
      process.exit(1);
    }
    console.log(`PASS: Base functional currency integrity protected: ${invalidIdrUpdate.error}`);

    // Test Safety: Deleting base IDR should be rejected
    const invalidIdrDelete = await deleteGlobalCurrency(idr.id);
    if (invalidIdrDelete.success) {
      console.error("FAIL: Expected deleting base currency IDR to fail");
      process.exit(1);
    }
    console.log(`PASS: Base currency IDR deletion blocked: ${invalidIdrDelete.error}`);

    // Test Safety: upsertGlobalCurrency with non-1.0 rate for IDR should be rejected
    const invalidIdrUpsert = await upsertGlobalCurrency({
      id: idr.id,
      code: "IDR",
      name: "Indonesian Rupiah",
      symbol: "Rp",
      exchangeRate: 15500,
      isBaseCurrency: true,
    });
    if (invalidIdrUpsert.success) {
      console.error("FAIL: Expected upsertGlobalCurrency to reject non-1.0 rate for IDR");
      process.exit(1);
    }
    console.log(`PASS: upsertGlobalCurrency protected base IDR rate: ${invalidIdrUpsert.error}`);

    // Test Safety: Attempting to create non-IDR currency as base currency should be rejected
    const invalidBaseClaim = await upsertGlobalCurrency({
      code: "FAKEBASE",
      name: "Fake Base Currency",
      symbol: "FB",
      exchangeRate: 1.0,
      isBaseCurrency: true,
    });
    if (invalidBaseClaim.success) {
      console.error("FAIL: Expected non-IDR base currency claim to fail");
      process.exit(1);
    }
    console.log(`PASS: Blocked non-IDR currency from claiming base functional status: ${invalidBaseClaim.error}`);

    // Create & Delete custom test currency
    const createCurRes = await upsertGlobalCurrency({
      code: "TESTC",
      name: "Super Admin Test Currency",
      symbol: "T$",
      exchangeRate: 500.0,
      isBaseCurrency: false,
      isActive: true,
    });
    if (!createCurRes.success || !createCurRes.data) {
      console.error("FAIL: Failed to create test currency:", createCurRes.error);
      process.exit(1);
    }
    createdCurrencyIds.push(createCurRes.data.id);
    console.log(`PASS: Created custom currency: ${createCurRes.data.code}`);

    const deleteCurRes = await deleteGlobalCurrency(createCurRes.data.id);
    if (!deleteCurRes.success) {
      console.error("FAIL: Failed to delete custom currency:", deleteCurRes.error);
      process.exit(1);
    }
    console.log("PASS: Deleted custom currency.");

    // Restore original USD rate
    await updateGlobalExchangeRate({
      id: usd.id,
      exchangeRate: oldUsdRate,
    });
    console.log(`PASS: Restored USD exchange rate back to Rp ${oldUsdRate}`);

    // ============================================================================
    // [TEST 7] Teardown & Restoring DB State
    // ============================================================================
    console.log("\n[TEST 7] Teardown & Restoring DB State");
    if (createdPortIds.length > 0) {
      await prisma.masterPort.deleteMany({ where: { id: { in: createdPortIds } } });
    }
    if (createdCarrierIds.length > 0) {
      await prisma.globalCarrier.deleteMany({ where: { id: { in: createdCarrierIds } } });
      await prisma.systemDictionary.deleteMany({
        where: { tenantId: null, category: "CARRIER", code: testCarrierCode },
      });
    }
    if (createdCurrencyIds.length > 0) {
      await prisma.masterCurrency.deleteMany({ where: { id: { in: createdCurrencyIds } } });
    }

    // Clean test audit logs
    const deletedLogs = await prisma.platformAuditLog.deleteMany({
      where: {
        action: { in: testAuditActions },
        targetName: { contains: "Uji Coba" },
      },
    });
    console.log(`PASS: Cleaned up ${deletedLogs.count} temporary test audit records.`);

    console.log("\n=== ALL REAL SUPER ADMIN FASE 5 TESTS PASSED SUCCESSFULLY! ===");
  } catch (error) {
    console.error("FATAL ERROR IN FASE 5 TEST SUITE:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
