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
