export interface HyperliquidSnapshot {
  id: number
  timestamp: string
  account_value: number
  unrealized_pnl: number
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
}

export interface PortfolioStats {
  totalValue: number
  dailyPnl: number
  dailyPnlPercent: number
  unrealizedPnl: number
  activePositions: number
}
