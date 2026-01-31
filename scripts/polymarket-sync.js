#!/usr/bin/env node

/**
 * Polymarket Sync Script
 * Fetches positions and trades from Polymarket API and syncs to Supabase
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ermlxtokxwhgfbcakibo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_9yjvpKbspZ5x07a7CPGcGQ_3Q7QWzMk';
const WALLET = '0xDa50B2Ca697Ee1A325d3c6f965B69Eb9EC632A41';

const POSITIONS_URL = `https://data-api.polymarket.com/positions?user=${WALLET}`;
const TRADES_URL = `https://data-api.polymarket.com/trades?user=${WALLET}`;

async function fetchPositions() {
  const response = await fetch(POSITIONS_URL);
  if (!response.ok) throw new Error(`Failed to fetch positions: ${response.status}`);
  return response.json();
}

async function fetchTrades() {
  const response = await fetch(TRADES_URL);
  if (!response.ok) throw new Error(`Failed to fetch trades: ${response.status}`);
  return response.json();
}

async function supabaseRequest(endpoint, method, body) {
  const url = `${SUPABASE_URL}${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
  
  if (method === 'POST') {
    headers['Prefer'] = 'return=minimal,resolution=merge-duplicates';
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error ${response.status}: ${text}`);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function transformPosition(pos) {
  return {
    asset: pos.asset,
    condition_id: pos.conditionId,
    title: pos.title,
    slug: pos.slug,
    outcome: pos.outcome,
    size: pos.size,
    avg_price: pos.avgPrice,
    initial_value: pos.initialValue,
    current_value: pos.currentValue,
    cash_pnl: pos.cashPnl,
    percent_pnl: pos.percentPnl,
    cur_price: pos.curPrice,
    redeemable: pos.redeemable,
    icon: pos.icon,
    end_date: pos.endDate,
    event_slug: pos.eventSlug,
    event_id: pos.eventId,
    raw_data: pos,
    updated_at: new Date().toISOString()
  };
}

function transformTrade(trade) {
  return {
    asset: trade.asset,
    side: trade.side,
    title: trade.title,
    slug: trade.slug,
    outcome: trade.outcome,
    size: trade.size,
    price: trade.price,
    timestamp: trade.timestamp,
    transaction_hash: trade.transactionHash,
    event_slug: trade.eventSlug,
    condition_id: trade.conditionId,
    raw_data: trade
  };
}

async function syncPositions(positions) {
  if (positions.length === 0) {
    console.log('No positions to sync');
    return 0;
  }

  const transformed = positions.map(transformPosition);
  
  // Upsert positions using asset as the unique key
  // First, delete old positions not in current list
  const currentAssets = positions.map(p => p.asset);
  
  // Insert/update current positions one by one (simpler approach)
  let upserted = 0;
  for (const pos of transformed) {
    try {
      // Check if exists
      const existing = await supabaseRequest(
        `/rest/v1/polymarket_positions?asset=eq.${encodeURIComponent(pos.asset)}&select=id`,
        'GET'
      );
      
      if (existing && existing.length > 0) {
        // Update
        await supabaseRequest(
          `/rest/v1/polymarket_positions?asset=eq.${encodeURIComponent(pos.asset)}`,
          'PATCH',
          pos
        );
      } else {
        // Insert
        await supabaseRequest('/rest/v1/polymarket_positions', 'POST', pos);
      }
      upserted++;
    } catch (err) {
      console.error(`Error upserting position ${pos.title}:`, err.message);
    }
  }
  
  return upserted;
}

async function syncTrades(trades) {
  if (trades.length === 0) {
    console.log('No trades to sync');
    return 0;
  }

  // Get existing transaction hashes
  const existing = await supabaseRequest(
    '/rest/v1/polymarket_trades?select=transaction_hash',
    'GET'
  );
  const existingHashes = new Set((existing || []).map(t => t.transaction_hash));
  
  // Filter to new trades only
  const newTrades = trades
    .filter(t => !existingHashes.has(t.transactionHash))
    .map(transformTrade);
  
  if (newTrades.length === 0) {
    console.log('No new trades to insert');
    return 0;
  }
  
  // Insert in batches
  const BATCH_SIZE = 100;
  let inserted = 0;
  
  for (let i = 0; i < newTrades.length; i += BATCH_SIZE) {
    const batch = newTrades.slice(i, i + BATCH_SIZE);
    await supabaseRequest('/rest/v1/polymarket_trades', 'POST', batch);
    inserted += batch.length;
  }
  
  return inserted;
}

async function main() {
  console.log(`[${new Date().toISOString()}] Starting Polymarket sync...`);
  console.log(`Wallet: ${WALLET}`);
  
  try {
    // Fetch data from Polymarket API
    console.log('\nFetching positions...');
    const positions = await fetchPositions();
    console.log(`Fetched ${positions.length} positions`);
    
    console.log('\nFetching trades...');
    const trades = await fetchTrades();
    console.log(`Fetched ${trades.length} trades`);
    
    // Calculate some stats
    const totalValue = positions.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    const totalPnl = positions.reduce((sum, p) => sum + (p.cashPnl || 0), 0);
    const openPositions = positions.filter(p => !p.redeemable && p.currentValue > 0);
    const redeemablePositions = positions.filter(p => p.redeemable);
    
    console.log('\n--- Portfolio Stats ---');
    console.log(`Total Current Value: $${totalValue.toFixed(2)}`);
    console.log(`Total PnL: $${totalPnl.toFixed(2)}`);
    console.log(`Open Positions: ${openPositions.length}`);
    console.log(`Redeemable (resolved): ${redeemablePositions.length}`);
    
    // Sync to Supabase
    console.log('\n--- Syncing to Supabase ---');
    
    const positionsUpserted = await syncPositions(positions);
    console.log(`✓ Upserted ${positionsUpserted} positions`);
    
    const tradesInserted = await syncTrades(trades);
    console.log(`✓ Inserted ${tradesInserted} new trades`);
    
    console.log(`\n[${new Date().toISOString()}] Sync complete!`);
    
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
}

main();
