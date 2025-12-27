import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js'; // Ensure Supabase is set up

export async function POST(req: Request) {
  const { league_key } = await req.json();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('yahoo_access_token')?.value;

  if (!accessToken || !league_key) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    // 1. Fetch EVERY rostered player in this specific league
    const response = await fetch(
      `https://fantasysports.yahooapis.com/fantasy/v2/leagues;league_keys=${league_key}/teams/roster?format=json`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await response.json();

    const rosteredPlayers: any[] = [];

    // 2. Recursive Digger to find all player objects
    const findPlayers = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      if (obj.player_key && obj.player_id) {
        rosteredPlayers.push({
          league_key: league_key,
          yahoo_id: obj.player_id,
          player_name: obj.name?.full,
          // We'll map this to MLB_ID later using your Rosetta Stone
        });
      }
      const values = Array.isArray(obj) ? obj : Object.values(obj);
      values.forEach(findPlayers);
    };

    findPlayers(data);

    // 3. Update Supabase so the search box knows who is "Taken"
    // You'll need a 'league_rosters' table with league_key and yahoo_id
    /*
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    await supabase.from('league_rosters').delete().eq('league_key', league_key);
    await supabase.from('league_rosters').insert(rosteredPlayers);
    */

    return NextResponse.json({ 
      success: true, 
      count: rosteredPlayers.length 
    });

  } catch (error) {
    return NextResponse.json({ error: "League sync failed" }, { status: 500 });
  }
}