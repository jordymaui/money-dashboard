-- =====================================================
-- Migration 006: Analytics & Journal Tables
-- Created: 2026-02-01
-- Purpose: Support trading journal and extended analytics
-- =====================================================

-- Journal entries table for daily summaries, notes, and rotation tracking
CREATE TABLE IF NOT EXISTS journal_entries (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily_summary', 'note', 'rotation', 'thesis', 'review')),
  platform TEXT CHECK (platform IN ('hyperliquid', 'polymarket', 'sportfun', 'all', NULL)),
  title TEXT,
  content TEXT,
  
  -- Auto-populated for daily summaries
  hl_pnl DECIMAL(18, 2),
  pm_pnl DECIMAL(18, 2),
  fun_change DECIMAL(18, 2),
  total_pnl DECIMAL(18, 2),
  
  -- Rotation tracking
  from_platform TEXT,
  to_platform TEXT,
  amount DECIMAL(18, 2),
  
  -- Metadata
  tags TEXT[], -- Array of tags for filtering
  mood TEXT CHECK (mood IN ('confident', 'cautious', 'neutral', 'frustrated', 'learning', NULL)),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_type ON journal_entries(type);
CREATE INDEX IF NOT EXISTS idx_journal_platform ON journal_entries(platform);

-- $FUN staking snapshots for tracking rewards over time
CREATE TABLE IF NOT EXISTS fun_staking_snapshots (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fun_balance DECIMAL(18, 2),        -- Main $FUN balance
  fun_bonus DECIMAL(18, 2),          -- Bonus earned
  total_fun_value DECIMAL(18, 2),    -- Total (balance + bonus)
  holding_score DECIMAL(18, 2),      -- Current holding score
  level INTEGER,                      -- Staking level (1-5)
  fun_price_usd DECIMAL(18, 8),      -- $FUN price at snapshot time
  total_value_usd DECIMAL(18, 2),    -- USD value of holdings
  season TEXT,                        -- e.g., "Season 3"
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fun_staking_timestamp ON fun_staking_snapshots(timestamp DESC);

-- Polymarket category overrides for manual categorization
CREATE TABLE IF NOT EXISTS polymarket_category_overrides (
  id BIGSERIAL PRIMARY KEY,
  condition_id TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sports', 'politics', 'crypto', 'culture', 'finance', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pm_category_condition ON polymarket_category_overrides(condition_id);

-- Hyperliquid trade annotations for journaling
CREATE TABLE IF NOT EXISTS hyperliquid_trade_annotations (
  id BIGSERIAL PRIMARY KEY,
  trade_hash TEXT UNIQUE NOT NULL,
  strategy TEXT,                      -- e.g., "breakout", "scalp", "swing"
  setup_quality INTEGER CHECK (setup_quality BETWEEN 1 AND 5),
  notes TEXT,
  lessons_learned TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hl_annotation_hash ON hyperliquid_trade_annotations(trade_hash);

-- Daily aggregated stats for quick dashboard loading
CREATE TABLE IF NOT EXISTS daily_stats_cache (
  id BIGSERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  
  -- Hyperliquid stats
  hl_trades INTEGER DEFAULT 0,
  hl_wins INTEGER DEFAULT 0,
  hl_losses INTEGER DEFAULT 0,
  hl_volume DECIMAL(18, 2) DEFAULT 0,
  hl_pnl DECIMAL(18, 2) DEFAULT 0,
  hl_fees DECIMAL(18, 2) DEFAULT 0,
  
  -- Polymarket stats
  pm_bets INTEGER DEFAULT 0,
  pm_wins INTEGER DEFAULT 0,
  pm_losses INTEGER DEFAULT 0,
  pm_volume DECIMAL(18, 2) DEFAULT 0,
  pm_pnl DECIMAL(18, 2) DEFAULT 0,
  
  -- Combined
  total_pnl DECIMAL(18, 2) DEFAULT 0,
  
  -- Cache metadata
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats_cache(date DESC);

-- Enable RLS (Row Level Security) for all new tables
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fun_staking_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE polymarket_category_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE hyperliquid_trade_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data (single user app)
CREATE POLICY "Allow authenticated read" ON journal_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON journal_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON journal_entries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON journal_entries FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON fun_staking_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON fun_staking_snapshots FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read" ON polymarket_category_overrides FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON polymarket_category_overrides FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON polymarket_category_overrides FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON hyperliquid_trade_annotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON hyperliquid_trade_annotations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON hyperliquid_trade_annotations FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON daily_stats_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON daily_stats_cache FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON daily_stats_cache FOR UPDATE TO authenticated USING (true);

-- Also allow anonymous access for public dashboard
CREATE POLICY "Allow anon read" ON journal_entries FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read" ON fun_staking_snapshots FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read" ON polymarket_category_overrides FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read" ON hyperliquid_trade_annotations FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read" ON daily_stats_cache FOR SELECT TO anon USING (true);

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE journal_entries IS 'Trading journal for daily summaries, notes, and capital rotation tracking';
COMMENT ON TABLE fun_staking_snapshots IS '$FUN staking balance and reward snapshots for tracking over time';
COMMENT ON TABLE polymarket_category_overrides IS 'Manual category overrides for Polymarket positions';
COMMENT ON TABLE hyperliquid_trade_annotations IS 'Trade-level notes and strategy annotations for Hyperliquid';
COMMENT ON TABLE daily_stats_cache IS 'Pre-aggregated daily statistics for fast dashboard loading';
