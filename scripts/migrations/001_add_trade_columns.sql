-- Migration: Add missing columns to hyperliquid_trades table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

ALTER TABLE hyperliquid_trades 
ADD COLUMN IF NOT EXISTS entry_price DECIMAL,
ADD COLUMN IF NOT EXISTS exit_price DECIMAL,
ADD COLUMN IF NOT EXISTS pnl DECIMAL,
ADD COLUMN IF NOT EXISTS fees DECIMAL,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS duration_ms BIGINT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Rename timestamp to closed_at if it exists and closed_at doesn't
-- (Run only if needed)
-- ALTER TABLE hyperliquid_trades RENAME COLUMN timestamp TO closed_at;

-- Update price to entry_price if data exists
-- UPDATE hyperliquid_trades SET entry_price = price WHERE entry_price IS NULL AND price IS NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_hyperliquid_trades_closed_at ON hyperliquid_trades(closed_at);
CREATE INDEX IF NOT EXISTS idx_hyperliquid_trades_coin ON hyperliquid_trades(coin);
