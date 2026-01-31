export interface HyperliquidSnapshot {
  id: number
  timestamp: string
  account_value: number
  unrealized_pnl: number
  withdrawable?: number
  margin_used?: number
  total_position_value?: number
  raw_data?: Record<string, unknown>
}

export interface HyperliquidPosition {
  id: number
  snapshot_id: number
  coin: string
  size: number
  entry_price: number
  unrealized_pnl: number
  leverage: number
  liquidation_price?: number
  current_price?: number
  margin_used?: number
  funding?: number
}

export interface PortfolioStats {
  totalValue: number
  dailyPnl: number
  dailyPnlPercent: number
  unrealizedPnl: number
  activePositions: number
}

export interface ChartDataPoint {
  date: string
  timestamp: number
  value: number
  pnl?: number
}

export type TimeRange = '24H' | '1W' | '1M' | 'All'
export type ChartType = 'Combined' | 'Perp Only' | 'PnL' | 'Account Value' | 'Show Trades'
export type AccentColor = 'green' | 'blue' | 'white'

// Polymarket types
export interface PolymarketPosition {
  id: number
  asset: string
  condition_id: string | null
  title: string | null
  slug: string | null
  outcome: string | null
  size: number
  avg_price: number
  initial_value: number
  current_value: number
  cash_pnl: number
  percent_pnl: number
  cur_price: number
  redeemable: boolean
  icon: string | null
  end_date: string | null
  event_slug: string | null
  event_id: string | null
  raw_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface PolymarketTrade {
  id: number
  asset: string
  side: string | null
  title: string | null
  slug: string | null
  outcome: string | null
  size: number
  price: number
  usdc_size: number | null
  timestamp: number
  transaction_hash: string
  event_slug: string | null
  condition_id: string | null
  raw_data: Record<string, unknown> | null
  created_at: string
}

export interface PolymarketClosedPosition {
  id: number
  asset: string
  condition_id: string | null
  title: string | null
  slug: string | null
  outcome: string | null
  avg_price: number
  total_bought: number
  realized_pnl: number
  cur_price: number
  icon: string | null
  end_date: string | null
  event_slug: string | null
  timestamp: number
  raw_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface PolymarketActivity {
  id: number
  asset: string
  condition_id: string | null
  transaction_hash: string
  type: string | null
  side: string | null
  size: number
  usdc_size: number
  price: number
  outcome: string | null
  outcome_index: number | null
  title: string | null
  slug: string | null
  icon: string | null
  event_slug: string | null
  timestamp: number
  raw_data: Record<string, unknown> | null
  created_at: string
}
