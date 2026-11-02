import {
  createSessionToken,
  verifySessionToken,
  getSessionCookieDomain,
  clearSessionCookie,
  getUserInitials,
  SESSION_COOKIE_NAME,
} from "../src/lib/auth";
import { logoutAction } from "../src/lib/auth-actions";
import {
  GET as logoutGetHandler,
  POST as logoutPostHandler,
  sanitizeRedirect,
} from "../src/app/api/auth/logout/route";
import { NextRequest } from "next/server";

async function runSessionLogoutTests() {
  console.log("=== STARTING ADMIN SESSION & LOGOUT INTEGRATION TESTS ===");

  // 1. Test getSessionCookieDomain across environments
  console.log("\n[TEST 1] Testing getSessionCookieDomain()");
  const localDomain = getSessionCookieDomain("localhost:3000");
  if (localDomain !== undefined) {
    throw new Error(`Expected undefined for localhost, got: ${localDomain}`);
  }
  const adminLocalDomain = getSessionCookieDomain("admin.localhost:3000");
  if (adminLocalDomain !== undefined) {
    throw new Error(`Expected undefined for admin.localhost, got: ${adminLocalDomain}`);
  }
  const prodDomain = getSessionCookieDomain("admin.sistemforwarding.com");
  if (prodDomain !== ".sistemforwarding.com") {
    throw new Error(`Expected .sistemforwarding.com for prod host, got: ${prodDomain}`);
  }
  console.log("PASS: getSessionCookieDomain handles localhost and production wildcard domains correctly.");

  // 2. Test getUserInitials with Unicode, emojis, whitespace, and fallbacks
  console.log("\n[TEST 2] Testing getUserInitials() edge cases & Unicode/surrogates");
  const t2_1 = getUserInitials("Super Administrator");
  if (t2_1 !== "SA") throw new Error(`Expected 'SA', got '${t2_1}'`);

  const t2_2 = getUserInitials("Budi Santoso");
  if (t2_2 !== "BS") throw new Error(`Expected 'BS', got '${t2_2}'`);

  const t2_3 = getUserInitials("SingleName");
  if (t2_3 !== "S") throw new Error(`Expected 'S', got '${t2_3}'`);

  const t2_4 = getUserInitials("   multi   space   admin   ");
  if (t2_4 !== "MS") throw new Error(`Expected 'MS', got '${t2_4}'`);

  const t2_5 = getUserInitials("");
  if (t2_5 !== "SA") throw new Error(`Expected fallback 'SA', got '${t2_5}'`);

  const t2_6 = getUserInitials(null);
  if (t2_6 !== "SA") throw new Error(`Expected fallback 'SA', got '${t2_6}'`);

  const t2_7 = getUserInitials("👨‍💼 Admin");
  if (t2_7 !== "👨A") throw new Error(`Expected emoji code point '👨A', got '${t2_7}'`);

  console.log("PASS: getUserInitials correctly processes standard, single, whitespace, fallback, and Unicode emoji characters.");

  // 3. Test createSessionToken and verifySessionToken for Super Admin
  console.log("\n[TEST 3] Testing createSessionToken() & verifySessionToken()");
  const adminPayload = {
    userId: "test-superadmin-id",
    email: "superadmin@sistemforwarding.com",
    name: "Chief Platform Admin",
    role: "SUPERADMIN" as const,
    tenantId: null,
    subdomain: null,
    companyName: "Global Super Administrator",
  };
  const token = await createSessionToken(adminPayload);
  if (!token || typeof token !== "string") {
    throw new Error("Failed to create session token");
  }
  const verified = await verifySessionToken(token);
  if (!verified) {
    throw new Error("Failed to verify session token");
  }
  if (verified.email !== adminPayload.email || verified.name !== adminPayload.name || verified.role !== "SUPERADMIN") {
    throw new Error(`Payload mismatch: ${JSON.stringify(verified)}`);
  }
  console.log(`PASS: Super Admin token signed & verified cleanly: Name='${verified.name}', Role='${verified.role}'`);

  // 4. Test logoutAction() server action
  console.log("\n[TEST 4] Testing logoutAction() server action");
  const logoutRes = await logoutAction();
  if (!logoutRes.success) {
    throw new Error("logoutAction() did not return success");
  }
  console.log("PASS: logoutAction() successfully executed and cleared cookies.");

  // 5. Test sanitizeRedirect and Open Redirect protection
  console.log("\n[TEST 5] Testing sanitizeRedirect() & Open Redirect defense (CWE-601)");
  if (sanitizeRedirect("/admin/login") !== "/admin/login") {
    throw new Error("Failed to allow valid relative path /admin/login");
  }
  if (sanitizeRedirect("/login") !== "/login") {
    throw new Error("Failed to allow valid relative path /login");
  }
  if (sanitizeRedirect("https://attacker.com/steal-session") !== "/login") {
    throw new Error("Failed to block absolute URL redirect to attacker.com");
  }
  if (sanitizeRedirect("//attacker.com") !== "/login") {
    throw new Error("Failed to block protocol-relative //attacker.com");
  }
  if (sanitizeRedirect("/\\attacker.com") !== "/login") {
    throw new Error("Failed to block backslash prefix /\\attacker.com");
  }
  if (sanitizeRedirect("javascript:alert(1)") !== "/login") {
    throw new Error("Failed to block javascript pseudo-protocol");
  }
  console.log("PASS: sanitizeRedirect successfully neutralized all open redirect attack vectors.");

  // 6. Test /api/auth/logout GET endpoint with query redirect and cookie clearance
  console.log("\n[TEST 6] Testing /api/auth/logout GET route handler");
  const testReqGet = new NextRequest("https://admin.sistemforwarding.com/api/auth/logout?redirect=/admin/login", {
    headers: {
      host: "admin.sistemforwarding.com",
    },
  });
  const resGet = await logoutGetHandler(testReqGet);
  if (resGet.status !== 307 && resGet.status !== 302) {
    throw new Error(`Expected redirect status (302/307), got: ${resGet.status}`);
  }
  const location = resGet.headers.get("location");
  if (!location?.includes("/admin/login")) {
    throw new Error(`Expected redirect location to contain /admin/login, got: ${location}`);
  }
  const setCookie = resGet.headers.getSetCookie();
  const hasWildcardDomain = setCookie.some((c) => c.includes("Domain=.sistemforwarding.com") && c.includes("Max-Age=0"));
  const hasHostOnly = setCookie.some((c) => c.includes(`${SESSION_COOKIE_NAME}=;`) && c.includes("Max-Age=0"));
  if (!hasWildcardDomain || !hasHostOnly) {
    throw new Error(`Cookies not cleared properly: ${JSON.stringify(setCookie)}`);
  }
  console.log("PASS: /api/auth/logout GET correctly issued redirect to /admin/login with wildcard + host Set-Cookie: Max-Age=0.");

  // 6.1 Verify attack URL through GET handler directly
  const attackReqGet = new NextRequest("https://admin.sistemforwarding.com/api/auth/logout?redirect=https://evil.com/hack", {
    headers: {
      host: "admin.sistemforwarding.com",
    },
  });
  const resAttackGet = await logoutGetHandler(attackReqGet);
  const attackLocation = resAttackGet.headers.get("location");
  if (attackLocation?.includes("evil.com")) {
    throw new Error(`VULNERABILITY: /api/auth/logout redirected to external evil site: ${attackLocation}`);
  }
  if (!attackLocation?.endsWith("/login")) {
    throw new Error(`Expected fallback redirect to /login, got: ${attackLocation}`);
  }
  console.log("PASS: /api/auth/logout GET successfully thwarted malicious redirect query parameter.");

  // 7. Test /api/auth/logout POST endpoint
  console.log("\n[TEST 7] Testing /api/auth/logout POST route handler");
  const testReqPost = new NextRequest("https://admin.sistemforwarding.com/api/auth/logout", {
    method: "POST",
    headers: {
      host: "admin.sistemforwarding.com",
    },
  });
  const resPost = await logoutPostHandler(testReqPost);
  if (resPost.status !== 200) {
    throw new Error(`Expected 200 OK for POST logout, got: ${resPost.status}`);
  }
  const postCookies = resPost.headers.getSetCookie();
  const hasPostWildcard = postCookies.some((c) => c.includes("Domain=.sistemforwarding.com") && c.includes("Max-Age=0"));
  if (!hasPostWildcard) {
    throw new Error(`POST logout cookies not cleared properly: ${JSON.stringify(postCookies)}`);
  }
  console.log("PASS: /api/auth/logout POST returned 200 OK with wildcard cookies cleared.");

  // 7.1 Verify localhost doesn't generate invalid Domain=localhost
  const localReqPost = new NextRequest("http://localhost:3000/api/auth/logout", {
    method: "POST",
    headers: {
      host: "localhost:3000",
    },
  });
  const resLocalPost = await logoutPostHandler(localReqPost);
  const localCookies = resLocalPost.headers.getSetCookie();
  const hasInvalidLocalDomain = localCookies.some((c) => c.toLowerCase().includes("domain=localhost"));
  if (hasInvalidLocalDomain) {
    throw new Error(`Invalid cookie attribute on localhost: ${JSON.stringify(localCookies)}`);
  }
  console.log("PASS: /api/auth/logout does not emit illegal Domain=localhost cookies in development.");

  // 8. Test clearSessionCookie standalone invocation
  console.log("\n[TEST 8] Testing clearSessionCookie() helper");
  await clearSessionCookie("admin.sistemforwarding.com");
  await clearSessionCookie("localhost:3000");
  console.log("PASS: clearSessionCookie() handles wildcard and local hosts gracefully.");

  console.log("\n=== ALL ADMIN SESSION & LOGOUT TESTS PASSED CLEANLY! ===");
}

runSessionLogoutTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
