-- Migration: Add closed positions and activity tables for Polymarket
-- Run: psql $DATABASE_URL < scripts/migrations/005_polymarket_closed_activity.sql

-- Closed positions table (for realized PnL tracking)
CREATE TABLE IF NOT EXISTS polymarket_closed_positions (
  id SERIAL PRIMARY KEY,
  asset TEXT NOT NULL UNIQUE,
  condition_id TEXT,
  title TEXT,
  slug TEXT,
  outcome TEXT,
  avg_price DECIMAL,
  total_bought DECIMAL,
  realized_pnl DECIMAL,
  cur_price DECIMAL,
  icon TEXT,
  end_date TEXT,
  event_slug TEXT,
  timestamp BIGINT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity table (for detailed trade history with usdcSize)
CREATE TABLE IF NOT EXISTS polymarket_activity (
  id SERIAL PRIMARY KEY,
  asset TEXT NOT NULL,
  condition_id TEXT,
  transaction_hash TEXT UNIQUE,
  type TEXT,
  side TEXT,
  size DECIMAL,
  usdc_size DECIMAL,
  price DECIMAL,
  outcome TEXT,
  outcome_index INTEGER,
  title TEXT,
  slug TEXT,
  icon TEXT,
  event_slug TEXT,
  timestamp BIGINT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_polymarket_closed_timestamp ON polymarket_closed_positions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_polymarket_closed_pnl ON polymarket_closed_positions(realized_pnl DESC);
CREATE INDEX IF NOT EXISTS idx_polymarket_activity_timestamp ON polymarket_activity(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_polymarket_activity_hash ON polymarket_activity(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_polymarket_activity_type ON polymarket_activity(type);

-- Add usdc_size column to existing trades table if missing
ALTER TABLE polymarket_trades ADD COLUMN IF NOT EXISTS usdc_size DECIMAL;
