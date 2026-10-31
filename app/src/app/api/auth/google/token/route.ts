import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code, redirectUri } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Authorization code missing" }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    const redirect = redirectUri || "https://www.sistemforwarding.com";

    // 1. Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirect,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[Google Auth Token Error]", tokenData);
      return NextResponse.json({ error: tokenData.error_description || "Failed to exchange token" }, { status: 400 });
    }

    // 2. Fetch User Profile from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();

    if (!userRes.ok) {
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        name: userData.name || userData.email,
        email: userData.email,
        avatarUrl: userData.picture || "https://lh3.googleusercontent.com/a/default-user=s96-c",
      },
    });
  } catch (error: any) {
    console.error("[Google Auth Server Error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
