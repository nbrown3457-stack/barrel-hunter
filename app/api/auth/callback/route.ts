import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // 1. HARDCODED URI TO MATCH YAHOO EXACTLY
    const REDIRECT_URI = 'https://www.rotofilter.com/api/auth/callback';

    if (error) {
      return NextResponse.json({ error: "Yahoo Error", details: error });
    }

    if (!code) {
      return NextResponse.json({ error: "No code returned" }, { status: 400 });
    }

    const { YAHOO_CLIENT_ID, YAHOO_CLIENT_SECRET } = process.env;

    // 2. Exchange Code for Token
    const tokenResponse = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${YAHOO_CLIENT_ID}:${YAHOO_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code: code,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      return NextResponse.json({ error: tokens.error, description: tokens.error_description });
    }

    // 3. Success! Redirect to success page
    const response = NextResponse.redirect("https://www.rotofilter.com/league-sync?status=success");
    
    response.cookies.set("yahoo_access_token", tokens.access_token, {
      httpOnly: true,
      secure: true,
      path: "/",
      maxAge: 3600
    });

    return response;

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}