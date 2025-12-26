import { NextResponse } from 'next/server';

export async function GET() {
  // 1. HARDCODE YOUR ID HERE (The one ending in 4PTJj)
  const CLIENT_ID = 'dj0yJmk9RG9TdHRWUmhFQ0x2JmQ9WVdrOVZGaEVaRTFtV25JbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PTJj'; 
  
  const REDIRECT_URI = 'https://www.rotofilter.com/api/auth/callback';
  
  const url = new URL('https://api.login.yahoo.com/oauth2/request_auth');
  url.searchParams.append('client_id', CLIENT_ID);
  url.searchParams.append('redirect_uri', REDIRECT_URI);
  url.searchParams.append('response_type', 'code');
  
  return NextResponse.redirect(url.toString());
}