import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('yahoo_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not connected" }, { status: 401 });
  }

  try {
    // 1. Fetch HISTORY (game_codes=mlb gets all seasons, not just current)
    const teamsResponse = await fetch(
      'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_codes=mlb/teams?format=json', 
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    const teamsData: any = await teamsResponse.json();
    
    // 2. Hunt for a Valid Team
    let teamKey = null;
    let seasonFound = null;

    try {
        const games = teamsData.fantasy_content.users[0].games;
        
        // Loop through all seasons (2026, 2025, 2024...)
        // Yahoo returns games as an object, not a simple array
        for (const key in games) {
            const game = games[key];
            if (game.game && game.leagues && game.leagues[0].teams) {
                // Found a season with teams!
                teamKey = game.leagues[0].teams[0].team_key;
                seasonFound = game.game[0].season;
                break; // Stop looking, we found one
            }
        }

        if (!teamKey) {
             return NextResponse.json({ error: "No teams found in ANY season.", raw_data: teamsData });
        }

    } catch (e) {
        return NextResponse.json({ error: "Error parsing historical games", raw_data: teamsData });
    }

    // 3. Fetch the Roster from that Past Season
    const rosterResponse = await fetch(
        `https://fantasysports.yahooapis.com/fantasy/v2/team/${teamKey}/roster?format=json`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const rosterData: any = await rosterResponse.json();

    return NextResponse.json({ 
        success: true,
        season: seasonFound,
        team_key: teamKey,
        roster_sample: rosterData 
    });

  } catch (error) {
    return NextResponse.json({ error: "Fetch failed", details: String(error) }, { status: 500 });
  }
}