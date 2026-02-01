// Polymarket API client - fetches directly from official APIs

const POLYGON_RPC = 'https://polygon-rpc.com'
const USDC_E_CONTRACT = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
const DATA_API = 'https://data-api.polymarket.com'
const POLYMARKET_WALLET = '0xDa50B2Ca697Ee1A325d3c6f965B69Eb9EC632A41'

// API returns camelCase, we transform to snake_case for consistency with existing code
export interface PolymarketPosition {
  asset: string
  condition_id: string
  title: string
  slug: string
  outcome: string
  size: number
  avg_price: number
  initial_value: number
  current_value: number
  cash_pnl: number
  percent_pnl: number
  total_bought: number
  realized_pnl: number
  cur_price: number
  redeemable: boolean
  icon: string
  end_date: string
  event_slug: string
  // Also keep camelCase for internal use
  currentValue?: number
  cashPnl?: number
  endDate?: string
}

export interface PolymarketClosedPosition {
  asset: string
  condition_id: string
  title: string
  slug: string
  outcome: string
  avg_price: number
  total_bought: number
  realized_pnl: number
  cur_price: number
  icon: string
  end_date: string
  event_slug: string
  timestamp: number
  // camelCase aliases
  realizedPnl?: number
}

export interface PolymarketActivity {
  asset: string
  condition_id: string
  transaction_hash: string
  type: string
  side: string
  size: number
  usdc_size: number
  price: number
  outcome: string
  title: string
  slug: string
  icon: string
  event_slug: string
  timestamp: number
  // camelCase aliases
  usdcSize?: number
}

export interface PnLTimelinePoint {
  timestamp: number
  date: string
  pnl: number
  cumulativePnl: number
  title: string
  type: 'win' | 'loss'
}

/**
 * Fetch USDC.e balance from Polygon
 */
export async function fetchPolymarketUSDCBalance(): Promise<number> {
  try {
    const paddedAddress = POLYMARKET_WALLET.replace('0x', '').padStart(64, '0')
    const data = `0x70a08231${paddedAddress}`

    const response = await fetch(POLYGON_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: USDC_E_CONTRACT, data }, 'latest'],
        id: 1
      })
    })

    if (!response.ok) return 0
    const result = await response.json()
    if (result.result) {
      return parseInt(result.result, 16) / 1_000_000
    }
    return 0
  } catch (error) {
    console.error('Error fetching USDC balance:', error)
    return 0
  }
}

// Transform API response from camelCase to snake_case
function transformPosition(p: any): PolymarketPosition {
  return {
    asset: p.asset,
    condition_id: p.conditionId,
    title: p.title,
    slug: p.slug,
    outcome: p.outcome,
    size: p.size,
    avg_price: p.avgPrice,
    initial_value: p.initialValue,
    current_value: p.currentValue,
    cash_pnl: p.cashPnl,
    percent_pnl: p.percentPnl,
    total_bought: p.totalBought,
    realized_pnl: p.realizedPnl,
    cur_price: p.curPrice,
    redeemable: p.redeemable,
    icon: p.icon,
    end_date: p.endDate,
    event_slug: p.eventSlug,
    // Keep camelCase too
    currentValue: p.currentValue,
    cashPnl: p.cashPnl,
    endDate: p.endDate
  }
}

function transformClosedPosition(p: any): PolymarketClosedPosition {
  return {
    asset: p.asset,
    condition_id: p.conditionId,
    title: p.title,
    slug: p.slug,
    outcome: p.outcome,
    avg_price: p.avgPrice,
    total_bought: p.totalBought,
    realized_pnl: p.realizedPnl,
    cur_price: p.curPrice,
    icon: p.icon,
    end_date: p.endDate,
    event_slug: p.eventSlug,
    timestamp: p.timestamp,
    realizedPnl: p.realizedPnl
  }
}

function transformActivity(a: any): PolymarketActivity {
  return {
    asset: a.asset,
    condition_id: a.conditionId,
    transaction_hash: a.transactionHash,
    type: a.type,
    side: a.side,
    size: a.size,
    usdc_size: a.usdcSize,
    price: a.price,
    outcome: a.outcome,
    title: a.title,
    slug: a.slug,
    icon: a.icon,
    event_slug: a.eventSlug,
    timestamp: a.timestamp,
    usdcSize: a.usdcSize
  }
}

/**
 * Fetch positions from Data API
 */
export async function fetchPositions(): Promise<PolymarketPosition[]> {
  try {
    const response = await fetch(`${DATA_API}/positions?user=${POLYMARKET_WALLET}&limit=500`)
    if (!response.ok) return []
    const data = await response.json()
    return data.map(transformPosition)
  } catch (error) {
    console.error('Error fetching positions:', error)
    return []
  }
}

/**
 * Fetch closed positions from Data API
 */
export async function fetchClosedPositions(): Promise<PolymarketClosedPosition[]> {
  try {
    const response = await fetch(`${DATA_API}/closed-positions?user=${POLYMARKET_WALLET}&limit=500`)
    if (!response.ok) return []
    const data = await response.json()
    return data.map(transformClosedPosition)
  } catch (error) {
    console.error('Error fetching closed positions:', error)
    return []
  }
}

/**
 * Fetch activity from Data API
 */
export async function fetchActivity(): Promise<PolymarketActivity[]> {
  try {
    const response = await fetch(`${DATA_API}/activity?user=${POLYMARKET_WALLET}&limit=500`)
    if (!response.ok) return []
    const data = await response.json()
    return data.map(transformActivity)
  } catch (error) {
    console.error('Error fetching activity:', error)
    return []
  }
}

/**
 * Calculate total P&L properly:
 * - Winners from closed-positions API
 * - Losers from positions API (current_value = 0)
 */
export function calculatePnL(
  positions: PolymarketPosition[],
  closedPositions: PolymarketClosedPosition[]
): { realizedPnL: number; unrealizedPnL: number; totalPnL: number; wins: number; losses: number } {
  // Winners from closed positions
  const winningPnL = closedPositions.reduce((sum, p) => sum + (p.realized_pnl || 0), 0)
  const wins = closedPositions.filter(p => (p.realized_pnl || 0) > 0).length
  
  // Losers from positions with current_value = 0 (resolved losses)
  const resolvedLosses = positions.filter(p => p.current_value === 0 || p.current_value === null)
  const losingPnL = resolvedLosses.reduce((sum, p) => sum + (p.cash_pnl || 0), 0)
  const losses = resolvedLosses.filter(p => (p.cash_pnl || 0) < 0).length
  
  // Unrealized from open positions
  const openPositions = positions.filter(p => (p.current_value || 0) > 0 && !p.redeemable)
  const unrealizedPnL = openPositions.reduce((sum, p) => sum + (p.cash_pnl || 0), 0)
  
  const realizedPnL = winningPnL + losingPnL
  const totalPnL = realizedPnL + unrealizedPnL
  
  return { realizedPnL, unrealizedPnL, totalPnL, wins, losses }
}

/**
 * Build P&L timeline from closed positions and resolved losses
 */
export function buildPnLTimeline(
  positions: PolymarketPosition[],
  closedPositions: PolymarketClosedPosition[]
): PnLTimelinePoint[] {
  const timeline: PnLTimelinePoint[] = []
  
  // Add closed positions (winners and partial)
  closedPositions.forEach(p => {
    if (p.timestamp) {
      timeline.push({
        timestamp: p.timestamp * 1000, // Convert to ms
        date: new Date(p.timestamp * 1000).toISOString(),
        pnl: p.realized_pnl || 0,
        cumulativePnl: 0, // Will calculate after sorting
        title: p.title,
        type: (p.realized_pnl || 0) >= 0 ? 'win' : 'loss'
      })
    }
  })
  
  // Add resolved losses from positions (using end_date)
  positions.filter(p => p.current_value === 0 && (p.cash_pnl || 0) < 0).forEach(p => {
    const endDate = p.end_date && p.end_date !== '1970-01-01' 
      ? new Date(p.end_date).getTime()
      : Date.now() // Use now for positions without valid endDate
    
    timeline.push({
      timestamp: endDate,
      date: new Date(endDate).toISOString(),
      pnl: p.cash_pnl || 0,
      cumulativePnl: 0,
      title: p.title,
      type: 'loss'
    })
  })
  
  // Sort by timestamp
  timeline.sort((a, b) => a.timestamp - b.timestamp)
  
  // Calculate cumulative P&L
  let cumulative = 0
  timeline.forEach(point => {
    cumulative += point.pnl
    point.cumulativePnl = cumulative
  })
  
  return timeline
}

/**
 * Fetch all Polymarket data in one call
 */
export async function fetchAllPolymarketData() {
  const [usdcBalance, positions, closedPositions, activity] = await Promise.all([
    fetchPolymarketUSDCBalance(),
    fetchPositions(),
    fetchClosedPositions(),
    fetchActivity()
  ])
  
  const pnlStats = calculatePnL(positions, closedPositions)
  const timeline = buildPnLTimeline(positions, closedPositions)
  
  // Open positions
  const openPositions = positions.filter(p => (p.current_value || 0) > 0 && !p.redeemable)
  const positionsValue = openPositions.reduce((sum, p) => sum + (p.current_value || 0), 0)
  
  return {
    usdcBalance,
    positionsValue,
    totalPortfolioValue: usdcBalance + positionsValue,
    positions,
    openPositions,
    closedPositions,
    activity,
    pnlStats,
    timeline
  }
}
