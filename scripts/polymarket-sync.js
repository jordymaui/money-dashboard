#!/usr/bin/env node

/**
 * Polymarket Sync Script
 * Fetches positions, closed positions, trades, and activity from Polymarket API
 * Syncs everything to Supabase for accurate P&L tracking
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ermlxtokxwhgfbcakibo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_9yjvpKbspZ5x07a7CPGcGQ_3Q7QWzMk';
const WALLET = '0xDa50B2Ca697Ee1A325d3c6f965B69Eb9EC632A41';

const API_BASE = 'https://data-api.polymarket.com';
const POSITIONS_URL = `${API_BASE}/positions?user=${WALLET}`;
const CLOSED_POSITIONS_URL = `${API_BASE}/closed-positions?user=${WALLET}&limit=100`;
const TRADES_URL = `${API_BASE}/trades?user=${WALLET}`;
const ACTIVITY_URL = `${API_BASE}/activity?user=${WALLET}`;

// Fetch helpers
async function fetchJson(url, name) {
  console.log(`Fetching ${name}...`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${name}: ${response.status}`);
  const data = await response.json();
  console.log(`  → Got ${data.length} ${name}`);
  return data;
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

// Transform functions
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

function transformClosedPosition(pos) {
  return {
    asset: pos.asset,
    condition_id: pos.conditionId,
    title: pos.title,
    slug: pos.slug,
    outcome: pos.outcome,
    avg_price: pos.avgPrice,
    total_bought: pos.totalBought,
    realized_pnl: pos.realizedPnl,
    cur_price: pos.curPrice,
    icon: pos.icon,
    end_date: pos.endDate,
    event_slug: pos.eventSlug,
    timestamp: pos.timestamp,
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
    usdc_size: trade.usdcSize,
    timestamp: trade.timestamp,
    transaction_hash: trade.transactionHash,
    event_slug: trade.eventSlug,
    condition_id: trade.conditionId,
    raw_data: trade
  };
}

function transformActivity(activity) {
  return {
    asset: activity.asset,
    condition_id: activity.conditionId,
    transaction_hash: activity.transactionHash,
    type: activity.type,
    side: activity.side,
    size: activity.size,
    usdc_size: activity.usdcSize,
    price: activity.price,
    outcome: activity.outcome,
    outcome_index: activity.outcomeIndex,
    title: activity.title,
    slug: activity.slug,
    icon: activity.icon,
    event_slug: activity.eventSlug,
    timestamp: activity.timestamp,
    raw_data: activity
  };
}

// Sync functions
async function syncPositions(positions) {
  // Get all existing positions from database
  const existing = await supabaseRequest(
    '/rest/v1/polymarket_positions?select=id,asset',
    'GET'
  );
  const existingAssets = new Set((existing || []).map(p => p.asset));
  const apiAssets = new Set(positions.map(p => p.asset));
  
  // Find positions in DB that are NOT in API (stale/closed)
  const staleAssets = [...existingAssets].filter(asset => !apiAssets.has(asset));
  
  // Delete stale positions (they're fully closed/settled)
  if (staleAssets.length > 0) {
    console.log(`  Removing ${staleAssets.length} stale positions...`);
    for (const asset of staleAssets) {
      try {
        await supabaseRequest(
          `/rest/v1/polymarket_positions?asset=eq.${encodeURIComponent(asset)}`,
          'DELETE'
        );
      } catch (err) {
        console.error(`  Error deleting stale position:`, err.message);
      }
    }
  }
  
  if (positions.length === 0) return { upserted: 0, deleted: staleAssets.length };

  const transformed = positions.map(transformPosition);
  let upserted = 0;
  
  for (const pos of transformed) {
    try {
      const posExists = await supabaseRequest(
        `/rest/v1/polymarket_positions?asset=eq.${encodeURIComponent(pos.asset)}&select=id`,
        'GET'
      );
      
      if (posExists && posExists.length > 0) {
        await supabaseRequest(
          `/rest/v1/polymarket_positions?asset=eq.${encodeURIComponent(pos.asset)}`,
          'PATCH',
          pos
        );
      } else {
        await supabaseRequest('/rest/v1/polymarket_positions', 'POST', pos);
      }
      upserted++;
    } catch (err) {
      console.error(`  Error upserting position ${pos.title?.slice(0, 40)}:`, err.message);
    }
  }
  
  return { upserted, deleted: staleAssets.length };
}

async function syncClosedPositions(positions) {
  if (positions.length === 0) return 0;

  const transformed = positions.map(transformClosedPosition);
  let upserted = 0;
  
  for (const pos of transformed) {
    try {
      const existing = await supabaseRequest(
        `/rest/v1/polymarket_closed_positions?asset=eq.${encodeURIComponent(pos.asset)}&select=id`,
        'GET'
      );
      
      if (existing && existing.length > 0) {
        await supabaseRequest(
          `/rest/v1/polymarket_closed_positions?asset=eq.${encodeURIComponent(pos.asset)}`,
          'PATCH',
          pos
        );
      } else {
        await supabaseRequest('/rest/v1/polymarket_closed_positions', 'POST', pos);
      }
      upserted++;
    } catch (err) {
      console.error(`  Error upserting closed position ${pos.title?.slice(0, 40)}:`, err.message);
    }
  }
  
  return upserted;
}

async function syncTrades(trades) {
  if (trades.length === 0) return 0;

  const existing = await supabaseRequest(
    '/rest/v1/polymarket_trades?select=transaction_hash',
    'GET'
  );
  const existingHashes = new Set((existing || []).map(t => t.transaction_hash));
  
  const newTrades = trades
    .filter(t => !existingHashes.has(t.transactionHash))
    .map(transformTrade);
  
  if (newTrades.length === 0) return 0;
  
  const BATCH_SIZE = 100;
  let inserted = 0;
  
  for (let i = 0; i < newTrades.length; i += BATCH_SIZE) {
    const batch = newTrades.slice(i, i + BATCH_SIZE);
    await supabaseRequest('/rest/v1/polymarket_trades', 'POST', batch);
    inserted += batch.length;
  }
  
  return inserted;
}

async function syncActivity(activities) {
  if (activities.length === 0) return 0;

  const existing = await supabaseRequest(
    '/rest/v1/polymarket_activity?select=transaction_hash',
    'GET'
  );
  const existingHashes = new Set((existing || []).map(t => t.transaction_hash));
  
  const newActivities = activities
    .filter(a => a.transactionHash && !existingHashes.has(a.transactionHash))
    .map(transformActivity);
  
  if (newActivities.length === 0) return 0;
  
  let inserted = 0;
  
  // Insert one at a time to handle any remaining duplicates gracefully
  for (const activity of newActivities) {
    try {
      await supabaseRequest('/rest/v1/polymarket_activity', 'POST', activity);
      inserted++;
    } catch (err) {
      // Ignore duplicate key errors
      if (!err.message.includes('duplicate key')) {
        console.error(`  Error inserting activity:`, err.message);
      }
    }
  }
  
  return inserted;
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${new Date().toISOString()}] Polymarket Sync`);
  console.log(`Wallet: ${WALLET}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    // Fetch all data from Polymarket API
    const [positions, closedPositions, trades, activity] = await Promise.all([
      fetchJson(POSITIONS_URL, 'positions'),
      fetchJson(CLOSED_POSITIONS_URL, 'closed-positions'),
      fetchJson(TRADES_URL, 'trades'),
      fetchJson(ACTIVITY_URL, 'activity')
    ]);
    
    // Calculate stats
    const openPositions = positions.filter(p => !p.redeemable && p.currentValue > 0);
    const openValue = openPositions.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    const unrealizedPnl = positions.reduce((sum, p) => sum + (p.cashPnl || 0), 0);
    const realizedPnl = closedPositions.reduce((sum, p) => sum + (p.realizedPnl || 0), 0);
    const totalPnl = realizedPnl + unrealizedPnl;
    
    console.log('\n--- Portfolio Stats ---');
    console.log(`Open Positions: ${openPositions.length} ($${openValue.toFixed(2)})`);
    console.log(`Closed Positions: ${closedPositions.length}`);
    console.log(`Realized P&L: $${realizedPnl.toFixed(2)}`);
    console.log(`Unrealized P&L: $${unrealizedPnl.toFixed(2)}`);
    console.log(`Total P&L: $${totalPnl.toFixed(2)}`);
    
    // Sync to Supabase
    console.log('\n--- Syncing to Supabase ---');
    
    const positionsResult = await syncPositions(positions);
    console.log(`✓ Positions: ${positionsResult.upserted} upserted, ${positionsResult.deleted} stale removed`);
    
    const closedUpserted = await syncClosedPositions(closedPositions);
    console.log(`✓ Closed positions: ${closedUpserted} upserted`);
    
    const tradesInserted = await syncTrades(trades);
    console.log(`✓ Trades: ${tradesInserted} new inserted`);
    
    const activityInserted = await syncActivity(activity);
    console.log(`✓ Activity: ${activityInserted} new inserted`);
    
    console.log(`\n[${new Date().toISOString()}] Sync complete!`);
    console.log(`${'='.repeat(60)}\n`);
    
  } catch (err) {
    console.error('\n❌ Sync failed:', err);
    process.exit(1);
  }
}

main();
