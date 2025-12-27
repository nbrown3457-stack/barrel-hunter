import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('yahoo_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not connected" }, { status: 401 });
  }

  try {
    // 1. Fetch all baseball history
    const teamsResponse = await fetch(
      'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_codes=mlb/teams?format=json', 
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const teamsData: any = await teamsResponse.json();

    let teamKey: string | null = null;
    
    // 2. Identify Games and Sort by Season Descending (2026, 2025, 2024...)
    const games = teamsData?.fantasy_content?.users?.[0]?.user?.[1]?.games;
    if (!games) return NextResponse.json({ error: "No games found" });

    const sortedGames = Object.values(games)
      .filter((g: any) => g && typeof g === 'object' && g.game)
      .sort((a: any, b: any) => parseInt(b.game[0].season) - parseInt(a.game[0].season));

    // 3. Recursive Helper to find the first team_key in the newest season that has a roster
    const findTeamKey = (obj: any): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        if (obj.team_key) return obj.team_key;
        for (const value of Object.values(obj)) {
            const result = findTeamKey(value);
            if (result) return result;
        }
        return null;
    };

    // Check each season (newest first) for an active team
    for (const gameObj of (sortedGames as any[])) {
        // Skip games that have an empty teams array (like 2026 right now)
        if (gameObj.teams && Object.keys(gameObj.teams).length > 0) {
            teamKey = findTeamKey(gameObj);
            if (teamKey) break; 
        }
    }

    if (!teamKey) return NextResponse.json({ error: "No active roster found in history" });

    // 4. Fetch the Roster and Map IDs
    const rosterResponse = await fetch(
        `https://fantasysports.yahooapis.com/fantasy/v2/team/${teamKey}/roster?format=json`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const rosterData: any = await rosterResponse.json();
    
    const players: any[] = [];
    const findPlayers = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        if (obj.player) { players.push(obj.player); return; }
        for (const value of Object.values(obj)) { findPlayers(value); }
    };
    findPlayers(rosterData);

    const roster = [];
    const yahooIds: string[] = [];

    for (const playerMeta of players) {
        const metaArray = playerMeta[0];
        const idObj = metaArray.find((item: any) => item.player_id);
        const nameObj = metaArray.find((item: any) => item.name);
        
        if (idObj) {
            yahooIds.push(idObj.player_id);
            roster.push({
                yahoo_id: idObj.player_id,
                name: nameObj?.name?.full || "Unknown Player",
                mlb_id: null
            });
        }
    }

    // 5. Connect to Supabase "Rosetta Stone"
    const { data: mappings } = await supabase
        .from('player_mappings')
        .select('yahoo_id, mlb_id')
        .in('yahoo_id', yahooIds);

    const finalRoster = roster.map(player => ({
        ...player,
        mlb_id: mappings?.find(m => m.yahoo_id === player.yahoo_id)?.mlb_id || null
    }));

    return NextResponse.json({ success: true, team_key: teamKey, roster: finalRoster });

  } catch (error) {
    return NextResponse.json({ error: "Sync failed", details: String(error) }, { status: 500 });
  }
}