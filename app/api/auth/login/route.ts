import { NextResponse } from 'next/server';

export async function GET() {
  const CLIENT_ID = process.env.YAHOO_CLIENT_ID;
  const REDIRECT_URI = 'https://www.rotofilter.com/api/auth/callback';
  
  const url = new URL('https://api.login.yahoo.com/oauth2/request_auth');
  url.searchParams.append('client_id', CLIENT_ID as string);
  url.searchParams.append('redirect_uri', REDIRECT_URI);
  url.searchParams.append('response_type', 'code');
  
  return NextResponse.redirect(url.toString());
}