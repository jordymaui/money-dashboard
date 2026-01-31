#!/bin/bash

# Hyperliquid Sync Script
# Fetches fills from Hyperliquid API and syncs trades to Supabase

SUPABASE_URL="https://ermlxtokxwhgfbcakibo.supabase.co"
SUPABASE_KEY="${SUPABASE_SERVICE_KEY:-sb_secret_9yjvpKbspZ5x07a7CPGcGQ_3Q7QWzMk}"
WALLET="0xf9988f32e52e59638b5275c9A66CD1D0B51c29eD"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting Hyperliquid sync..."

# Fetch user fills
FILLS=$(curl -s "https://api.hyperliquid.xyz/info" -X POST \
  -H "Content-Type: application/json" \
  -d "{\"type\": \"userFills\", \"user\": \"$WALLET\"}")

if [ -z "$FILLS" ] || [ "$FILLS" = "null" ]; then
  echo "Error: Failed to fetch fills"
  exit 1
fi

FILL_COUNT=$(echo "$FILLS" | jq 'length')
echo "Fetched $FILL_COUNT fills"

# Process fills and aggregate into trades using Node.js
node << 'NODEJS_SCRIPT'
const https = require('https');

const fills = JSON.parse(process.argv[1] || '[]');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ermlxtokxwhgfbcakibo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_secret_9yjvpKbspZ5x07a7CPGcGQ_3Q7QWzMk';

async function supabaseRequest(endpoint, method, body) {
  const url = new URL(endpoint, SUPABASE_URL);
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`${res.statusCode}: ${data}`));
        } else {
          resolve(data ? JSON.parse(data) : null);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const fillsData = process.env.FILLS_DATA;
  if (!fillsData) {
    console.error('No fills data provided');
    process.exit(1);
  }
  
  const fills = JSON.parse(fillsData);
  console.log(`Processing ${fills.length} fills...`);
  
  // Group fills by coin and dir to identify trades
  const openPositions = {};
  const trades = [];
  
  // Sort fills by time
  fills.sort((a, b) => a.time - b.time);
  
  for (const fill of fills) {
    const coin = fill.coin;
    const key = coin;
    const isOpen = fill.dir.includes('Open');
    const isLong = fill.dir.includes('Long');
    const side = isLong ? 'Long' : 'Short';
    
    if (isOpen) {
      // Opening a position - track it
      if (!openPositions[key]) {
        openPositions[key] = {
          coin,
          side,
          fills: [],
          totalSize: 0,
          totalCost: 0,
          totalFees: 0,
          openedAt: fill.time
        };
      }
      const pos = openPositions[key];
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
      
      // Create a trade record
      const pos = openPositions[key];
      if (pos && pos.totalSize > 0) {
        const entryPrice = pos.totalCost / pos.totalSize;
        const exitPrice = parseFloat(fill.px);
        const size = parseFloat(fill.sz);
        
        trades.push({
          coin,
          side: pos.side,
          size: Math.min(size, pos.totalSize),
          entry_price: entryPrice,
          exit_price: exitPrice,
          pnl: closedPnl,
          fees: pos.totalFees + closeFee,
          opened_at: new Date(pos.openedAt).toISOString(),
          closed_at: new Date(fill.time).toISOString(),
          duration_ms: fill.time - pos.openedAt,
          raw_data: { fills: [...pos.fills, fill].map(f => f.tid) }
        });
        
        // Reduce or close position
        pos.totalSize -= size;
        if (pos.totalSize <= 0.0001) {
          delete openPositions[key];
        } else {
          pos.totalFees = 0; // Reset fees for remaining position
        }
      } else {
        // Standalone close (no matching open in this batch)
        trades.push({
          coin,
          side,
          size: parseFloat(fill.sz),
          entry_price: null,
          exit_price: parseFloat(fill.px),
          pnl: closedPnl,
          fees: closeFee,
          opened_at: null,
          closed_at: new Date(fill.time).toISOString(),
          duration_ms: null,
          raw_data: { fill_tid: fill.tid }
        });
      }
    }
  }
  
  console.log(`Aggregated ${trades.length} trades`);
  
  if (trades.length === 0) {
    console.log('No trades to insert');
    return;
  }
  
  // Get existing trade IDs to avoid duplicates (check by raw_data)
  try {
    const existing = await supabaseRequest('/rest/v1/hyperliquid_trades?select=raw_data', 'GET');
    const existingTids = new Set();
    if (existing) {
      for (const t of existing) {
        if (t.raw_data?.fills) {
          t.raw_data.fills.forEach(tid => existingTids.add(tid));
        }
        if (t.raw_data?.fill_tid) {
          existingTids.add(t.raw_data.fill_tid);
        }
      }
    }
    
    // Filter out trades we already have
    const newTrades = trades.filter(t => {
      if (t.raw_data?.fills) {
        return !t.raw_data.fills.some(tid => existingTids.has(tid));
      }
      if (t.raw_data?.fill_tid) {
        return !existingTids.has(t.raw_data.fill_tid);
      }
      return true;
    });
    
    console.log(`${newTrades.length} new trades to insert`);
    
    if (newTrades.length > 0) {
      await supabaseRequest('/rest/v1/hyperliquid_trades', 'POST', newTrades);
      console.log(`Inserted ${newTrades.length} trades`);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
NODEJS_SCRIPT

echo "$(date '+%Y-%m-%d %H:%M:%S') - Sync complete"
