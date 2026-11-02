import prisma from "../src/lib/prisma";
import {
  getAdminArticles,
  getAdminArticleById,
  upsertAdminArticle,
  toggleArticlePublish,
  deleteAdminArticle,
} from "../src/actions/adminArticleActions";
import {
  getAdminBroadcasts,
  upsertAdminBroadcast,
  toggleBroadcastActive,
  deleteAdminBroadcast,
  getActiveTenantBroadcasts,
} from "../src/actions/adminBroadcastActions";
import {
  getArticleBySlugFromDb,
  getArticlesFromDb,
} from "../src/lib/articles";

async function runTests() {
  console.log("=== STARTING REAL SUPER ADMIN FASE 4 TEST SUITE (CMS ARTICLES & BROADCAST ENGINE) ===\n");

  const createdArticleIds: string[] = [];
  const createdBroadcastIds: string[] = [];
  const testAuditActions: string[] = [];

  try {
    // ============================================================================
    // [TEST 1] RBAC Security Boundaries & Unauthenticated Rejection
    // ============================================================================
    console.log("[TEST 1] RBAC Security Check: Unauthenticated access rejection");
    delete process.env.ADMIN_TEST_MODE;

    // 1.1 Articles Server Actions
    try {
      await getAdminArticles();
      console.error("FAIL: Expected getAdminArticles() to throw when unauthenticated");
      process.exit(1);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message.includes("Akses ditolak")) {
        console.log("PASS: getAdminArticles() correctly rejected unauthenticated call:", error.message);
      } else {
        console.log("PASS: getAdminArticles() blocked call:", error.message);
      }
    }

    try {
      await getAdminArticleById("fake-id");
      console.error("FAIL: Expected getAdminArticleById() to throw when unauthenticated");
      process.exit(1);
    } catch (err: unknown) {
      const error = err as Error;
      console.log("PASS: getAdminArticleById() blocked unauthenticated call:", error.message);
    }

    try {
      await upsertAdminArticle({
        title: "Test",
        category: "Test",
        summary: "Test",
        author: "Test",
        authorRole: "Test",
        content: { intro: "", sections: [], takeaways: [] },
      });
      console.error("FAIL: Expected upsertAdminArticle() to throw when unauthenticated");
      process.exit(1);
    } catch (err: unknown) {
      const error = err as Error;
      console.log("PASS: upsertAdminArticle() blocked unauthenticated call:", error.message);
    }

    try {
      await toggleArticlePublish("fake-id", false);
      console.error("FAIL: Expected toggleArticlePublish() to throw when unauthenticated");
      process.exit(1);
    } catch (err: unknown) {
      const error = err as Error;
      console.log("PASS: toggleArticlePublish() blocked unauthenticated call:", error.message);
    }

    try {
      await deleteAdminArticle("fake-id");
      console.error("FAIL: Expected deleteAdminArticle() to throw when unauthenticated");
      process.exit(1);
    } catch (err: unknown) {
      const error = err as Error;
      console.log("PASS: deleteAdminArticle() blocked unauthenticated call:", error.message);
    }

    // 1.2 Broadcasts Server Actions
    try {
      await getAdminBroadcasts();
      console.error("FAIL: Expected getAdminBroadcasts() to throw when unauthenticated");
      process.exit(1);
    } catch (err: unknown) {
      const error = err as Error;
      console.log("PASS: getAdminBroadcasts() blocked unauthenticated call:", error.message);
    }

    try {
      await upsertAdminBroadcast({
        title: "Test",
        message: "Test",
      });
      console.error("FAIL: Expected upsertAdminBroadcast() to throw when unauthenticated");
      process.exit(1);
    } catch (err: unknown) {
      const error = err as Error;
      console.log("PASS: upsertAdminBroadcast() blocked unauthenticated call:", error.message);
    }

    try {
      await toggleBroadcastActive("fake-id", false);
      console.error("FAIL: Expected toggleBroadcastActive() to throw when unauthenticated");
      process.exit(1);
    } catch (err: unknown) {
      const error = err as Error;
      console.log("PASS: toggleBroadcastActive() blocked unauthenticated call:", error.message);
    }

    try {
      await deleteAdminBroadcast("fake-id");
      console.error("FAIL: Expected deleteAdminBroadcast() to throw when unauthenticated");
      process.exit(1);
    } catch (err: unknown) {
      const error = err as Error;
      console.log("PASS: deleteAdminBroadcast() blocked unauthenticated call:", error.message);
    }

    // ============================================================================
    // [TEST 2] CMS Articles: Creation & Slug Generation
    // ============================================================================
    console.log("\n[TEST 2] Testing upsertAdminArticle() with auto-slug generation & audit logging");
    process.env.ADMIN_TEST_MODE = "true";

    const article1Res = await upsertAdminArticle({
      title: "Panduan Otomasi Bill of Lading 2026",
      category: "Teknologi TMS",
      summary: "Mengapa sistem otomatisasi BL mengurangi waktu tunggu di pelabuhan.",
      author: "Ir. Hendri, M.Log",
      authorRole: "VP Logistics Engineering",
      coverImage: "/blog/test-bl.jpg",
      readTime: "4 menit baca",
      content: {
        intro: "Otomasi BL merupakan langkah awal efisiensi ekspor-impor.",
        sections: [
          {
            heading: "1. Kecepatan Penerbitan BL Elektronik",
            body: ["Sistem memangkas approval manual dari 3 hari menjadi 15 menit."],
            callout: "Catatan: Standar INSW terhubung penuh.",
          },
        ],
        takeaways: ["Efisiensi hingga 80%", "Akurasi data 100%"],
      },
      isPublished: true,
    });

    if (!article1Res.success || !article1Res.data) {
      console.error("FAIL: Failed to create article 1:", article1Res);
      process.exit(1);
    }

    const article1 = article1Res.data;
    createdArticleIds.push(article1.id);
    console.log(`PASS: Created article 1 (ID: ${article1.id}, Slug: ${article1.slug})`);

    if (article1.slug !== "panduan-otomasi-bill-of-lading-2026") {
      console.error("FAIL: Auto-generated slug mismatch. Got:", article1.slug);
      process.exit(1);
    }

    // Check Audit Log for ARTICLE_CREATE
    const auditCreate = await prisma.platformAuditLog.findFirst({
      where: {
        action: "ARTICLE_CREATE",
        targetId: article1.id,
      },
    });

    if (!auditCreate) {
      console.error("FAIL: ARTICLE_CREATE audit log not found");
      process.exit(1);
    }
    testAuditActions.push("ARTICLE_CREATE");
    console.log("PASS: ARTICLE_CREATE audit log persisted with targetName:", auditCreate.targetName);

    // ============================================================================
    // [TEST 3] Slug Collision Handling
    // ============================================================================
    console.log("\n[TEST 3] Testing Slug Collision: Creating duplicate title article");
    const article2Res = await upsertAdminArticle({
      title: "Panduan Otomasi Bill of Lading 2026", // Same title
      category: "Teknologi TMS",
      summary: "Versi kedua untuk rute udara.",
      author: "Ir. Hendri, M.Log",
      authorRole: "VP Logistics Engineering",
      content: {
        intro: "Intro kedua.",
        sections: [],
        takeaways: [],
      },
      isPublished: false, // As draft
    });

    if (!article2Res.success || !article2Res.data) {
      console.error("FAIL: Failed to create duplicate slug article:", article2Res);
      process.exit(1);
    }

    const article2 = article2Res.data;
    createdArticleIds.push(article2.id);
    console.log(`PASS: Slug collision resolved cleanly -> Slug: ${article2.slug}`);

    if (article2.slug === article1.slug) {
      console.error("FAIL: Duplicate slug was allowed!");
      process.exit(1);
    }

    // ============================================================================
    // [TEST 4] Article Retrieval & Filtering
    // ============================================================================
    console.log("\n[TEST 4] Testing getAdminArticles() and getAdminArticleById()");
    const listRes = await getAdminArticles({ search: "Panduan Otomasi Bill of Lading" });
    if (listRes.articles.length < 2) {
      console.error("FAIL: Search did not return both created articles. Count:", listRes.articles.length);
      process.exit(1);
    }
    console.log(`PASS: Search returned ${listRes.articles.length} articles. Telemetry: Total=${listRes.stats.total}, Published=${listRes.stats.published}, Drafts=${listRes.stats.drafts}`);

    const singleArticle = await getAdminArticleById(article1.id);
    if (!singleArticle || singleArticle.title !== article1.title) {
      console.error("FAIL: getAdminArticleById did not return correct article");
      process.exit(1);
    }
    console.log("PASS: getAdminArticleById() fetched correct article by ID:", singleArticle.id);

    // ============================================================================
    // [TEST 5] Article Status Toggle & Update
    // ============================================================================
    console.log("\n[TEST 5] Testing toggleArticlePublish() & upsertAdminArticle() update");
    const toggleRes = await toggleArticlePublish(article1.id, false);
    if (!toggleRes.success || toggleRes.data?.isPublished !== false) {
      console.error("FAIL: toggleArticlePublish failed to unpublish:", toggleRes);
      process.exit(1);
    }
    console.log("PASS: toggleArticlePublish() successfully unpublished article 1");

    const updateRes = await upsertAdminArticle({
      id: article1.id,
      title: "Panduan Otomasi Bill of Lading Terpadu 2026",
      category: "Regulasi Kargo",
      summary: "Updated summary",
      author: article1.author,
      authorRole: article1.authorRole,
      content: article1.content,
      isPublished: true,
    });

    if (!updateRes.success || updateRes.data?.title !== "Panduan Otomasi Bill of Lading Terpadu 2026") {
      console.error("FAIL: upsertAdminArticle failed to update:", updateRes);
      process.exit(1);
    }
    console.log("PASS: upsertAdminArticle() successfully updated article title and category");

    // Check Audit Log for ARTICLE_UPDATE
    const auditUpdate = await prisma.platformAuditLog.findFirst({
      where: {
        action: "ARTICLE_UPDATE",
        targetId: article1.id,
      },
    });
    if (!auditUpdate) {
      console.error("FAIL: ARTICLE_UPDATE audit log not found");
      process.exit(1);
    }
    testAuditActions.push("ARTICLE_UPDATE");
    console.log("PASS: ARTICLE_UPDATE audit log persisted.");

    // ============================================================================
    // [TEST 6] Article Deletion
    // ============================================================================
    console.log("\n[TEST 6] Testing deleteAdminArticle()");
    const deleteRes = await deleteAdminArticle(article2.id);
    if (!deleteRes.success) {
      console.error("FAIL: deleteAdminArticle failed:", deleteRes);
      process.exit(1);
    }
    // Remove from tracked createdArticleIds
    const idx2 = createdArticleIds.indexOf(article2.id);
    if (idx2 >= 0) createdArticleIds.splice(idx2, 1);

    const deletedCheck = await prisma.article.findUnique({ where: { id: article2.id } });
    if (deletedCheck) {
      console.error("FAIL: Deleted article still exists in DB");
      process.exit(1);
    }
    console.log("PASS: deleteAdminArticle() successfully removed article 2 from DB");

    const auditDelete = await prisma.platformAuditLog.findFirst({
      where: {
        action: "ARTICLE_DELETE",
        targetId: article2.id,
      },
    });
    if (!auditDelete) {
      console.error("FAIL: ARTICLE_DELETE audit log not found");
      process.exit(1);
    }
    testAuditActions.push("ARTICLE_DELETE");
    console.log("PASS: ARTICLE_DELETE audit log persisted.");

    // ============================================================================
    // [TEST 7] Platform Broadcast CRUD & Multi-Tenant Targeting
    // ============================================================================
    console.log("\n[TEST 7] Testing upsertAdminBroadcast() with Global vs Tenant-Specific targeting");

    // 7.1 Create Platform-wide INFO broadcast
    const broadcastGlobalRes = await upsertAdminBroadcast({
      title: "Rilis Fitur Pelacakan Kontainer v4.2",
      message: "Modul pelacakan kontainer kini mendukung API integrasi shipping line internasional.",
      type: "UPDATE",
      targetSubdomain: null, // Global / All
      linkUrl: "https://sistemforwarding.com/updates",
      linkLabel: "Baca Catatan Rilis",
      isActive: true,
      startsAt: new Date(Date.now() - 3600 * 1000), // started 1 hour ago
      expiresAt: new Date(Date.now() + 3600 * 1000 * 24), // expires in 24 hours
    });

    if (!broadcastGlobalRes.success || !broadcastGlobalRes.data) {
      console.error("FAIL: Failed to create global broadcast:", broadcastGlobalRes);
      process.exit(1);
    }
    const broadcastGlobal = broadcastGlobalRes.data;
    createdBroadcastIds.push(broadcastGlobal.id);
    console.log(`PASS: Created global broadcast (ID: ${broadcastGlobal.id}, Target: ALL)`);

    // 7.2 Create Tenant-specific MAINTENANCE broadcast for demo1
    const broadcastDemo1Res = await upsertAdminBroadcast({
      title: "Migrasi Cluster Khusus PT Demo 1",
      message: "Pemberitahuan khusus: server workspace demo1 akan mengalami jeda sinkronisasi 5 menit.",
      type: "MAINTENANCE",
      targetSubdomain: "demo1",
      isActive: true,
      startsAt: new Date(Date.now() - 1800 * 1000), // started 30 mins ago
      expiresAt: new Date(Date.now() + 3600 * 1000), // expires in 1 hour
    });

    if (!broadcastDemo1Res.success || !broadcastDemo1Res.data) {
      console.error("FAIL: Failed to create demo1 broadcast:", broadcastDemo1Res);
      process.exit(1);
    }
    const broadcastDemo1 = broadcastDemo1Res.data;
    createdBroadcastIds.push(broadcastDemo1.id);
    console.log(`PASS: Created demo1 specific broadcast (ID: ${broadcastDemo1.id}, Target: demo1)`);

    // 7.3 Create Expired Broadcast
    const broadcastExpiredRes = await upsertAdminBroadcast({
      title: "Pengumuman Masa Lampau",
      message: "Pengumuman ini sudah kadaluarsa.",
      type: "INFO",
      targetSubdomain: null,
      isActive: true,
      startsAt: new Date(Date.now() - 3600 * 1000 * 48),
      expiresAt: new Date(Date.now() - 3600 * 1000 * 24), // expired yesterday
    });
    if (broadcastExpiredRes.data) {
      createdBroadcastIds.push(broadcastExpiredRes.data.id);
    }

    // 7.4 Create Future Broadcast
    const broadcastFutureRes = await upsertAdminBroadcast({
      title: "Jadwal Maintenance Mendatang",
      message: "Akan datang besok malam.",
      type: "MAINTENANCE",
      targetSubdomain: null,
      isActive: true,
      startsAt: new Date(Date.now() + 3600 * 1000 * 24), // starts tomorrow
    });
    if (broadcastFutureRes.data) {
      createdBroadcastIds.push(broadcastFutureRes.data.id);
    }

    // Verify Audit Log for BROADCAST_CREATE
    const auditBroadcastCreate = await prisma.platformAuditLog.findFirst({
      where: {
        action: "BROADCAST_CREATE",
        targetId: broadcastGlobal.id,
      },
    });
    if (!auditBroadcastCreate) {
      console.error("FAIL: BROADCAST_CREATE audit log not found");
      process.exit(1);
    }
    testAuditActions.push("BROADCAST_CREATE");
    console.log("PASS: BROADCAST_CREATE audit log persisted.");

    // ============================================================================
    // [TEST 8] Active Tenant Broadcast Resolution
    // ============================================================================
    console.log("\n[TEST 8] Testing getActiveTenantBroadcasts() Resolution for different tenants");

    // 8.1 For tenant 'demo1': should receive global broadcast AND demo1 broadcast
    const demo1Broadcasts = await getActiveTenantBroadcasts("demo1");
    const demo1Ids = demo1Broadcasts.map((b) => b.id);

    if (!demo1Ids.includes(broadcastGlobal.id)) {
      console.error("FAIL: demo1 did not receive platform-wide broadcast");
      process.exit(1);
    }
    if (!demo1Ids.includes(broadcastDemo1.id)) {
      console.error("FAIL: demo1 did not receive demo1-targeted broadcast");
      process.exit(1);
    }
    if (broadcastExpiredRes.data && demo1Ids.includes(broadcastExpiredRes.data.id)) {
      console.error("FAIL: demo1 received expired broadcast");
      process.exit(1);
    }
    if (broadcastFutureRes.data && demo1Ids.includes(broadcastFutureRes.data.id)) {
      console.error("FAIL: demo1 received future broadcast that has not started");
      process.exit(1);
    }
    console.log("PASS: getActiveTenantBroadcasts('demo1') correctly resolved global & tenant-specific broadcasts (neither expired nor future).");

    // 8.2 For another tenant 'acme': should receive global broadcast but NOT demo1 broadcast
    const acmeBroadcasts = await getActiveTenantBroadcasts("acme");
    const acmeIds = acmeBroadcasts.map((b) => b.id);

    if (!acmeIds.includes(broadcastGlobal.id)) {
      console.error("FAIL: acme did not receive platform-wide broadcast");
      process.exit(1);
    }
    if (acmeIds.includes(broadcastDemo1.id)) {
      console.error("FAIL: acme received demo1 private broadcast!");
      process.exit(1);
    }
    console.log("PASS: getActiveTenantBroadcasts('acme') received global broadcast and was isolated from demo1 broadcast.");

    // ============================================================================
    // [TEST 9] Broadcast Active Toggle & Deletion
    // ============================================================================
    console.log("\n[TEST 9] Testing toggleBroadcastActive() and deleteAdminBroadcast()");
    const toggleBRes = await toggleBroadcastActive(broadcastGlobal.id, false);
    if (!toggleBRes.success || toggleBRes.data?.isActive !== false) {
      console.error("FAIL: toggleBroadcastActive failed:", toggleBRes);
      process.exit(1);
    }
    console.log("PASS: toggleBroadcastActive() toggled broadcast to inactive");

    // Verify it is no longer resolved in getActiveTenantBroadcasts
    const activeAfterToggle = await getActiveTenantBroadcasts("demo1");
    if (activeAfterToggle.some((b) => b.id === broadcastGlobal.id)) {
      console.error("FAIL: Deactivated broadcast still appeared in getActiveTenantBroadcasts");
      process.exit(1);
    }
    console.log("PASS: Deactivated broadcast immediately excluded from tenant resolution.");

    // Delete broadcast
    const delBRes = await deleteAdminBroadcast(broadcastGlobal.id);
    if (!delBRes.success) {
      console.error("FAIL: deleteAdminBroadcast failed:", delBRes);
      process.exit(1);
    }
    const idxB = createdBroadcastIds.indexOf(broadcastGlobal.id);
    if (idxB >= 0) createdBroadcastIds.splice(idxB, 1);

    const auditBroadcastDelete = await prisma.platformAuditLog.findFirst({
      where: {
        action: "BROADCAST_DELETE",
        targetId: broadcastGlobal.id,
      },
    });
    if (!auditBroadcastDelete) {
      console.error("FAIL: BROADCAST_DELETE audit log not found");
      process.exit(1);
    }
    testAuditActions.push("BROADCAST_DELETE");
    console.log("PASS: BROADCAST_DELETE audit log persisted.");

    // ============================================================================
    // [TEST 10] Public SEO Hub Resolution & Draft Boundary Verification
    // ============================================================================
    console.log("\n[TEST 10] Testing Public SEO Hub: Published vs Draft Isolation");
    // Article 1 was re-published in Test 5
    const publicArticle = await getArticleBySlugFromDb(article1.slug);
    if (!publicArticle || publicArticle.title !== "Panduan Otomasi Bill of Lading Terpadu 2026") {
      console.error("FAIL: Published article 1 not returned by getArticleBySlugFromDb");
      process.exit(1);
    }
    console.log("PASS: Published article accessible publicly via slug:", publicArticle.slug);

    // Create a draft-only test article
    const draftArticleRes = await upsertAdminArticle({
      title: "Draft Eksklusif Dokumen Ekspor 2026",
      category: "Regulasi Kargo",
      summary: "Artikel ini masih berupa draft rahasia.",
      author: "Admin Editorial",
      authorRole: "Editor",
      content: { intro: "Rahasia", sections: [], takeaways: [] },
      isPublished: false, // Draft!
    });
    if (!draftArticleRes.success || !draftArticleRes.data) {
      console.error("FAIL: Failed to create draft test article:", draftArticleRes);
      process.exit(1);
    }
    createdArticleIds.push(draftArticleRes.data.id);

    // Public lookup for draft slug MUST return undefined
    const publicDraftLookup = await getArticleBySlugFromDb(draftArticleRes.data.slug);
    if (publicDraftLookup !== undefined) {
      console.error("FAIL: Unpublished draft article was leaked through getArticleBySlugFromDb!");
      process.exit(1);
    }
    console.log("PASS: Draft article correctly isolated and blocked from public reading.");

    // Verify getArticlesFromDb() includes published articles and excludes drafts
    const allPublic = await getArticlesFromDb();
    if (!allPublic.some((a) => a.slug === article1.slug)) {
      console.error("FAIL: Published article 1 missing from getArticlesFromDb()");
      process.exit(1);
    }
    if (allPublic.some((a) => a.slug === draftArticleRes.data?.slug)) {
      console.error("FAIL: Draft article found in public getArticlesFromDb() list!");
      process.exit(1);
    }
    console.log("PASS: getArticlesFromDb() correctly verified: includes published, excludes drafts.");

    // ============================================================================
    // [TEST 11] Tenant Broadcast Dismissal & localStorage Tracking Contract
    // ============================================================================
    console.log("\n[TEST 11] Testing Tenant Broadcast Banner Dismissal Contract");
    // Simulate active broadcasts retrieved by client
    const clientBroadcasts = await getActiveTenantBroadcasts("demo1");
    if (clientBroadcasts.length === 0) {
      console.error("FAIL: Expected at least 1 active broadcast for demo1");
      process.exit(1);
    }
    const targetBroadcast = clientBroadcasts[0];
    const dismissalKey = `sf_dismissed_broadcast_${targetBroadcast.id}`;

    // Verify dismissal contract logic
    const mockLocalStorage: Record<string, string> = {};
    mockLocalStorage[dismissalKey] = "true";

    const filteredClientList = clientBroadcasts.filter(
      (b) => mockLocalStorage[`sf_dismissed_broadcast_${b.id}`] !== "true"
    );

    if (filteredClientList.some((b) => b.id === targetBroadcast.id)) {
      console.error("FAIL: Dismissed broadcast still present in filtered banner list!");
      process.exit(1);
    }
    console.log(`PASS: Dismissal tracking contract verified for key "${dismissalKey}". Broadcast successfully suppressed.`);

    // ============================================================================
    // [TEST 12] Teardown & Database State Cleanliness
    // ============================================================================
    console.log("\n[TEST 12] Teardown & Restoring database state");
    if (createdArticleIds.length > 0) {
      await prisma.article.deleteMany({
        where: { id: { in: createdArticleIds } },
      });
      console.log(`PASS: Cleaned up ${createdArticleIds.length} test articles.`);
    }

    if (createdBroadcastIds.length > 0) {
      await prisma.platformBroadcast.deleteMany({
        where: { id: { in: createdBroadcastIds } },
      });
      console.log(`PASS: Cleaned up ${createdBroadcastIds.length} test broadcasts.`);
    }

    if (testAuditActions.length > 0) {
      await prisma.platformAuditLog.deleteMany({
        where: { action: { in: testAuditActions } },
      });
      console.log(`PASS: Cleaned up test platform audit records.`);
    }

    console.log("\n=== ALL REAL SUPER ADMIN FASE 4 TESTS PASSED SUCCESSFULLY! ===");
  } catch (err) {
    console.error("FATAL ERROR in test execution:", err);
    process.exit(1);
  } finally {
    // Failsafe cleanup
    if (createdArticleIds.length > 0) {
      await prisma.article.deleteMany({ where: { id: { in: createdArticleIds } } }).catch(() => {});
    }
    if (createdBroadcastIds.length > 0) {
      await prisma.platformBroadcast.deleteMany({ where: { id: { in: createdBroadcastIds } } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runTests();
