-- Polymarket positions and trades tables
-- Run: psql $DATABASE_URL < scripts/migrations/004_polymarket_tables.sql

CREATE TABLE IF NOT EXISTS polymarket_positions (
  id SERIAL PRIMARY KEY,
  asset TEXT NOT NULL UNIQUE,
  condition_id TEXT,
  title TEXT,
  slug TEXT,
  outcome TEXT,
  size DECIMAL,
  avg_price DECIMAL,
  initial_value DECIMAL,
  current_value DECIMAL,
  cash_pnl DECIMAL,
  percent_pnl DECIMAL,
  cur_price DECIMAL,
  redeemable BOOLEAN DEFAULT FALSE,
  icon TEXT,
  end_date TEXT,
  event_slug TEXT,
  event_id TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS polymarket_trades (
  id SERIAL PRIMARY KEY,
  asset TEXT NOT NULL,
  side TEXT,
  title TEXT,
  slug TEXT,
  outcome TEXT,
  size DECIMAL,
  price DECIMAL,
  timestamp BIGINT,
  transaction_hash TEXT UNIQUE,
  event_slug TEXT,
  condition_id TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_polymarket_positions_asset ON polymarket_positions(asset);
CREATE INDEX IF NOT EXISTS idx_polymarket_trades_timestamp ON polymarket_trades(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_polymarket_trades_hash ON polymarket_trades(transaction_hash);
