import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
// We need the SERVICE_ROLE key here because we are writing to a protected table
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function GET() {
  try {
    console.log("Starting ID Map update...");

    // 1. Fetch the Master CSV from Smart Fantasy Baseball
    const response = await fetch('https://docs.google.com/spreadsheets/d/1JgczhD5VDQ1EiXqVG-8FjDNXAkUxWXADBt85HOOAikI/export?format=csv');
    const csvText = await response.text();

    // 2. Parse the CSV
    const rows = csvText.split('\n');
    const headers = rows[0].split(',').map(h => h.trim().toUpperCase());
    
    // Find the magic columns
    const yahooIndex = headers.indexOf('IDYAHOO');
    const mlbIndex = headers.indexOf('IDMLB'); // Sometimes labeled MLBID
    const nameIndex = headers.indexOf('PLAYERNAME');

    if (yahooIndex === -1 || mlbIndex === -1) {
      return NextResponse.json({ error: "Could not find ID columns in CSV", headers });
    }

    const upsertData = [];

    // 3. Loop through rows and prepare data
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].split(',');
      if (row.length < headers.length) continue;

      const yahooId = row[yahooIndex]?.trim();
      const mlbId = row[mlbIndex]?.trim();
      const name = row[nameIndex]?.trim();

      // Only save if we have BOTH IDs
      if (yahooId && mlbId && yahooId !== '') {
        upsertData.push({
          yahoo_id: yahooId,
          mlb_id: mlbId,
          full_name: name,
          last_updated: new Date()
        });
      }
    }

    console.log(`Found ${upsertData.length} valid mappings.`);

    // 4. Batch Insert into Supabase (Upsert = Update if exists, Insert if new)
    const { error } = await supabase
      .from('player_mappings')
      .upsert(upsertData, { onConflict: 'yahoo_id' });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      count: upsertData.length,
      message: "Rosetta Stone updated successfully" 
    });

  } catch (error) {
    console.error("Map Update Error:", error);
    return NextResponse.json({ error: "Failed to update map", details: String(error) }, { status: 500 });
  }
}