import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('yahoo_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not connected" }, { status: 401 });
  }

  try {
    // 1. Fetch every MLB game/league the user has ever been in
    const response = await fetch(
      'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_codes=mlb/teams?format=json',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await response.json();

    const leagueMap: Record<string, any> = {};
    
    // 2. THE DEEP-SCAN DIGGER
    // This function doesn't care about the "Path". It just looks for Team Objects.
    const findTeams = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      // Yahoo often uses arrays for team data like: "team": [{ "team_key": "..." }, { "name": "..." }]
      // If it's an array, we scan each item
      if (Array.isArray(obj)) {
        // Look for a team_key and name inside the array elements
        const teamKeyObj = obj.find((i: any) => i && i.team_key);
        const nameObj = obj.find((i: any) => i && i.name);

        if (teamKeyObj && nameObj && typeof nameObj.name === 'string') {
          processTeam(teamKeyObj.team_key, nameObj.name);
        }
        
        // Continue digging into array items
        obj.forEach(item => findTeams(item));
        return;
      }

      // If it's a standard object with the keys directly on it
      if (obj.team_key && obj.name && typeof obj.name === 'string') {
        processTeam(obj.team_key, obj.name);
      }

      // Keep digging into every sub-property
      Object.values(obj).forEach(val => findTeams(val));
    };

    // Helper to group teams by League and keep the newest one
    const processTeam = (teamKey: string, teamName: string) => {
      const parts = teamKey.split('.');
      const seasonYear = parseInt(parts[0]);
      const leagueId = `${parts[1]}.${parts[2]}`; 
      const leagueKey = `${parts[0]}.${parts[1]}.${parts[2]}`;

      if (!leagueMap[leagueId] || seasonYear > leagueMap[leagueId].seasonYear) {
        leagueMap[leagueId] = {
          team_key: teamKey,
          team_name: teamName,
          league_key: leagueKey,
          seasonYear: seasonYear
        };
      }
    };

    findTeams(data);

    const finalTeams = Object.values(leagueMap).sort((a, b) => b.seasonYear - a.seasonYear);

    return NextResponse.json({ 
      success: true, 
      count: finalTeams.length,
      teams: finalTeams 
    });

  } catch (error) {
    return NextResponse.json({ error: "Sync failed", details: String(error) }, { status: 500 });
  }
}