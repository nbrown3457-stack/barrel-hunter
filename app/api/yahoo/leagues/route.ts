import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  // FIX: Add 'await' because cookies() is async in Next.js 15+
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('yahoo_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not connected to Yahoo. Please sync again." }, { status: 401 });
  }

  try {
    // 1. Fetch the user's teams
    const teamsResponse = await fetch(
      'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=mlb/teams?format=json', 
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    const teamsData: any = await teamsResponse.json();
    
    // 2. Extract the first Team Key found
    let teamKey = null;
    try {
        const game = teamsData.fantasy_content.users[0].games[0];
        const league = game.leagues[0];
        const team = league.teams[0];
        teamKey = team.team_key;
    } catch (e) {
        return NextResponse.json({ error: "No teams found. Are you in a 2024/2025 MLB league?", raw_data: teamsData });
    }

    // 3. Fetch that specific team's ROSTER
    const rosterResponse = await fetch(
        `https://fantasysports.yahooapis.com/fantasy/v2/team/${teamKey}/roster?format=json`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const rosterData: any = await rosterResponse.json();

    // 4. Return the RAW data
    return NextResponse.json({ 
        debug_mode: true, 
        team_key: teamKey,
        roster_sample: rosterData 
    });

  } catch (error) {
    return NextResponse.json({ error: "Fetch failed", details: String(error) }, { status: 500 });
  }
}