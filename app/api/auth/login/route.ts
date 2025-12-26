import { NextResponse } from 'next/server';

export async function GET() {
  const CLIENT_ID = process.env.YAHOO_CLIENT_ID;
  const REDIRECT_URI = 'https://www.rotofilter.com/api/auth/callback';
  
  // 1. Create the base Yahoo URL
  const url = new URL('https://api.login.yahoo.com/oauth2/request_auth');
  
  // 2. Add parameters safely (This handles the encoding automatically!)
  url.searchParams.append('client_id', CLIENT_ID as string);
  url.searchParams.append('redirect_uri', REDIRECT_URI);
  url.searchParams.append('response_type', 'code');
  
  // 3. Go!
  return NextResponse.redirect(url.toString());
}