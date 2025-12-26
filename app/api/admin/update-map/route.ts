import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function GET() {
  try {
    console.log("Starting ID Map update from GitHub...");

    // 1. Fetch from GitHub (More stable than Google Sheets)
    const response = await fetch('https://raw.githubusercontent.com/lbenz730/MLB_Data/master/playeridmap.csv');
    
    if (!response.ok) {
        throw new Error(`GitHub Fetch Failed: ${response.statusText}`);
    }

    const csvText = await response.text();

    // 2. Parse the CSV
    const rows = csvText.split('\n');
    // Remove quotes and whitespace from headers
    const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, '').toUpperCase());
    
    // Debug: Log headers to Vercel logs if something goes wrong
    console.log("CSV Headers found:", headers);

    // 3. Find the magic columns (Handle variations like "IDMLB" vs "MLBID")
    const yahooIndex = headers.indexOf('IDYAHOO');
    const mlbIndex = headers.indexOf('MLBID') !== -1 ? headers.indexOf('MLBID') : headers.indexOf('IDMLB');
    const nameIndex = headers.indexOf('PLAYERNAME');

    if (yahooIndex === -1 || mlbIndex === -1) {
      return NextResponse.json({ error: "Could not find ID columns", found_headers: headers });
    }

    const upsertData = [];

    // 4. Loop through rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].split(',');
      
      // Skip broken rows
      if (row.length < headers.length) continue;

      // Clean up the data (remove quotes, trim spaces)
      const yahooId = row[yahooIndex]?.replace(/"/g, '').trim();
      const mlbId = row[mlbIndex]?.replace(/"/g, '').trim();
      const name = row[nameIndex]?.replace(/"/g, '').trim();

      // Only save valid mappings
      if (yahooId && mlbId && yahooId !== '') {
        upsertData.push({
          yahoo_id: yahooId,
          mlb_id: mlbId,
          full_name: name,
          last_updated: new Date()
        });
      }
    }

    // 5. Batch Insert into Supabase
    // We do this in chunks of 1000 to be safe
    const chunkSize = 1000;
    for (let i = 0; i < upsertData.length; i += chunkSize) {
        const chunk = upsertData.slice(i, i + chunkSize);
        const { error } = await supabase
            .from('player_mappings')
            .upsert(chunk, { onConflict: 'yahoo_id' });
            
        if (error) {
            console.error("Batch insert error:", error);
            throw error;
        }
    }

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