#!/usr/bin/env node

/**
 * Hyperliquid Trade Sync Script
 * Fetches fills from Hyperliquid API and aggregates them into trades for Supabase
 * 
 * Schema: id, coin, side, size, price, trade_id, timestamp
 * (Using existing minimal table structure + optional extended columns)
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ermlxtokxwhgfbcakibo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_9yjvpKbspZ5x07a7CPGcGQ_3Q7QWzMk';
const WALLET = '0xf9988f32e52e59638b5275c9A66CD1D0B51c29eD';

async function fetchFills() {
  const response = await fetch('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'userFills', user: WALLET })
  });
  return response.json();
}

async function supabaseRequest(endpoint, method, body) {
  const url = `${SUPABASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=minimal' : ''
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error ${response.status}: ${text}`);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Check which columns exist in the table
async function detectColumns() {
  const testCols = ['entry_price', 'exit_price', 'pnl', 'realized_pnl', 'fees', 'opened_at', 'closed_at', 'duration_ms'];
  const hasColumn = {};
  
  for (const col of testCols) {
    try {
      await supabaseRequest(`/rest/v1/hyperliquid_trades?select=${col}&limit=0`, 'GET');
      hasColumn[col] = true;
    } catch {
      hasColumn[col] = false;
    }
  }
  
  return hasColumn;
}

function aggregateFillsToTrades(fills) {
  const trades = [];
  const openPositions = {};
  
  // Sort fills by time (oldest first)
  fills.sort((a, b) => a.time - b.time);
  
  for (const fill of fills) {
    const coin = fill.coin;
    const isOpen = fill.dir.includes('Open');
    const isLong = fill.dir.includes('Long');
    const side = isLong ? 'Long' : 'Short';
    const posKey = `${coin}-${side}`;
    
    if (isOpen) {
      // Opening or adding to a position
      if (!openPositions[posKey]) {
        openPositions[posKey] = {
          coin,
          side,
          fills: [],
          totalSize: 0,
          totalCost: 0,
          totalFees: 0,
          openedAt: fill.time
        };
      }
      
      const pos = openPositions[posKey];
      const size = parseFloat(fill.sz);
      const price = parseFloat(fill.px);
      
      pos.fills.push(fill);
      pos.totalSize += size;
      pos.totalCost += size * price;
      pos.totalFees += parseFloat(fill.fee);
    } else {
      // Closing a position
      const closedPnl = parseFloat(fill.closedPnl);
      const closeFee = parseFloat(fill.fee);
      const closeSize = parseFloat(fill.sz);
      const exitPrice = parseFloat(fill.px);
      
      const pos = openPositions[posKey];
      
      if (pos && pos.totalSize > 0) {
        const entryPrice = pos.totalCost / pos.totalSize;
        const tradeSize = Math.min(closeSize, pos.totalSize);
        const proportionalFees = pos.totalFees * (tradeSize / pos.totalSize);
        
        trades.push({
          coin,
          side: pos.side,
          size: tradeSize,
          price: entryPrice, // Entry price for existing schema
          entry_price: entryPrice,
          exit_price: exitPrice,
          pnl: closedPnl,
          fees: proportionalFees + closeFee,
          opened_at: new Date(pos.openedAt).toISOString(),
          closed_at: new Date(fill.time).toISOString(),
          timestamp: new Date(fill.time).toISOString(), // For existing schema
          duration_ms: fill.time - pos.openedAt,
          trade_id: String(fill.tid) // Use fill tid as trade_id
        });
        
        // Reduce position
        const ratio = tradeSize / pos.totalSize;
        pos.totalSize -= tradeSize;
        pos.totalCost *= (1 - ratio);
        pos.totalFees *= (1 - ratio);
        
        if (pos.totalSize <= 0.0001) {
          delete openPositions[posKey];
        }
      } else {
        // Standalone close without matching open
        trades.push({
          coin,
          side,
          size: closeSize,
          price: exitPrice,
          entry_price: null,
          exit_price: exitPrice,
          pnl: closedPnl,
          fees: closeFee,
          opened_at: null,
          closed_at: new Date(fill.time).toISOString(),
          timestamp: new Date(fill.time).toISOString(),
          duration_ms: null,
          trade_id: String(fill.tid)
        });
      }
    }
  }
  
  return trades;
}

async function main() {
  console.log(`[${new Date().toISOString()}] Starting Hyperliquid trade sync...`);
  
  // Detect available columns
  console.log('Detecting table schema...');
  const columns = await detectColumns();
  console.log('Extended columns available:', Object.entries(columns).filter(([,v]) => v).map(([k]) => k).join(', ') || 'none');
  
  // Fetch fills from Hyperliquid
  console.log('Fetching fills from Hyperliquid...');
  const fills = await fetchFills();
  console.log(`Fetched ${fills.length} fills`);
  
  // Aggregate into trades
  const trades = aggregateFillsToTrades(fills);
  console.log(`Aggregated into ${trades.length} trades`);
  
  if (trades.length === 0) {
    console.log('No trades to sync');
    return;
  }
  
  // Get existing trade_ids to avoid duplicates
  console.log('Checking for existing trades...');
  const existing = await supabaseRequest('/rest/v1/hyperliquid_trades?select=trade_id', 'GET');
  
  const existingIds = new Set();
  if (existing) {
    for (const t of existing) {
      if (t.trade_id) existingIds.add(t.trade_id);
    }
  }
  
  // Filter to new trades only
  const newTrades = trades.filter(t => !existingIds.has(t.trade_id));
  console.log(`${newTrades.length} new trades to insert (${existing?.length || 0} existing)`);
  
  if (newTrades.length === 0) {
    console.log('No new trades to insert');
    return;
  }
  
  // Build insert data based on available columns
  const tradesToInsert = newTrades.map(t => {
    const record = {
      coin: t.coin,
      side: t.side,
      size: t.size,
      price: t.price,
      trade_id: t.trade_id,
      timestamp: t.timestamp
    };
    
    // Add extended columns if they exist
    if (columns.entry_price) record.entry_price = t.entry_price;
    if (columns.exit_price) record.exit_price = t.exit_price;
    if (columns.pnl) record.pnl = t.pnl;
    if (columns.realized_pnl) record.realized_pnl = t.pnl; // Use pnl for realized_pnl
    if (columns.fees) record.fees = t.fees;
    if (columns.opened_at) record.opened_at = t.opened_at;
    if (columns.closed_at) record.closed_at = t.closed_at;
    if (columns.duration_ms) record.duration_ms = t.duration_ms;
    
    return record;
  });
  
  await supabaseRequest('/rest/v1/hyperliquid_trades', 'POST', tradesToInsert);
  console.log(`✓ Inserted ${tradesToInsert.length} new trades`);
  
  console.log(`[${new Date().toISOString()}] Sync complete`);
}

main().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
