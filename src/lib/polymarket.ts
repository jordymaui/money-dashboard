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
/**
 * Calculate 24hr P&L from resolved positions only (not from trade activity)
 * This fixes the bug where daily P&L was calculated from buys/sells instead of actual resolved profits
 */
export function calculate24hrPnL(
  positions: PolymarketPosition[],
  closedPositions: PolymarketClosedPosition[]
): { change: number; changePercent: number } {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  
  // Wins from closed positions in last 24hr
  const recentWins = closedPositions.filter(p => {
    const ts = p.timestamp < 1e12 ? p.timestamp * 1000 : p.timestamp
    return ts >= oneDayAgo
  })
  const winPnL = recentWins.reduce((sum, p) => sum + (p.realized_pnl || 0), 0)
  
  // Losses from positions that resolved to 0 in last 24hr
  const recentLosses = positions.filter(p => {
    if ((p.current_value || 0) !== 0) return false
    const endDate = p.end_date && p.end_date !== '1970-01-01' 
      ? new Date(p.end_date).getTime()
      : 0
    return endDate >= oneDayAgo
  })
  const lossPnL = recentLosses.reduce((sum, p) => sum + (p.cash_pnl || 0), 0)
  
  const totalChange = winPnL + lossPnL
  
  return { change: totalChange, changePercent: 0 } // Percent calculated in component
}

/**
 * Categorize a Polymarket market by its title
 */
export type MarketCategory = 'sports' | 'politics' | 'crypto' | 'culture' | 'finance' | 'other'

export function categorizeMarket(title: string): MarketCategory {
  const t = title.toLowerCase()
  
  // Sports keywords
  if (/\b(nfl|nba|mlb|nhl|ufc|boxing|tennis|f1|formula|soccer|football|sports?|game|match|win|championship|playoffs?|super\s?bowl|world\s?series|grand\s?prix|premier\s?league|champions?\s?league)\b/.test(t)) {
    return 'sports'
  }
  
  // Politics keywords
  if (/\b(trump|biden|election|congress|senate|political|president|governor|vote|republican|democrat|gop|dnc|cabinet|administration|impeach|legislation|bill\s+(pass|fail)|supreme\s?court|executive\s?order)\b/.test(t)) {
    return 'politics'
  }
  
  // Crypto keywords
  if (/\b(btc|eth|bitcoin|ethereum|crypto|solana|sol|price|token|defi|nft|blockchain|altcoin|memecoin|doge|xrp)\b/.test(t)) {
    return 'crypto'
  }
  
  // Pop Culture keywords
  if (/\b(oscar|grammy|emmy|movie|celebrity|album|show|entertainment|tv|netflix|streaming|billboard|box\s?office|actor|actress|singer|artist)\b/.test(t)) {
    return 'culture'
  }
  
  // Finance keywords
  if (/\b(fed|federal\s?reserve|interest\s?rate|inflation|gdp|economy|stock|market|s&p|nasdaq|dow|recession|unemployment|cpi|fomc)\b/.test(t)) {
    return 'finance'
  }
  
  return 'other'
}

/**
 * Get category display info
 */
export function getCategoryInfo(category: MarketCategory): { emoji: string; label: string; color: string } {
  const info: Record<MarketCategory, { emoji: string; label: string; color: string }> = {
    sports: { emoji: '🏈', label: 'Sports', color: 'text-orange-400' },
    politics: { emoji: '🏛️', label: 'Politics', color: 'text-blue-400' },
    crypto: { emoji: '💰', label: 'Crypto', color: 'text-yellow-400' },
    culture: { emoji: '🎬', label: 'Culture', color: 'text-pink-400' },
    finance: { emoji: '📈', label: 'Finance', color: 'text-green-400' },
    other: { emoji: '📊', label: 'Other', color: 'text-zinc-400' }
  }
  return info[category]
}

/**
 * Calculate analytics breakdown by category
 */
export interface CategoryStats {
  category: MarketCategory
  wins: number
  losses: number
  totalBets: number
  winRate: number
  totalPnL: number
  roi: number
  totalStaked: number
}

export function calculateCategoryBreakdown(
  positions: PolymarketPosition[],
  closedPositions: PolymarketClosedPosition[]
): CategoryStats[] {
  const categoryMap = new Map<MarketCategory, { wins: number; losses: number; pnl: number; staked: number }>()
  
  // Initialize all categories
  const categories: MarketCategory[] = ['sports', 'politics', 'crypto', 'culture', 'finance', 'other']
  categories.forEach(cat => categoryMap.set(cat, { wins: 0, losses: 0, pnl: 0, staked: 0 }))
  
  // Process closed positions (winners)
  closedPositions.forEach(p => {
    const category = categorizeMarket(p.title || '')
    const stats = categoryMap.get(category)!
    if ((p.realized_pnl || 0) > 0) {
      stats.wins++
      stats.pnl += p.realized_pnl || 0
    } else if ((p.realized_pnl || 0) < 0) {
      stats.losses++
      stats.pnl += p.realized_pnl || 0
    }
    stats.staked += p.total_bought || 0
  })
  
  // Process resolved losses from positions
  positions.filter(p => (p.current_value || 0) === 0 && (p.cash_pnl || 0) < 0).forEach(p => {
    const category = categorizeMarket(p.title || '')
    const stats = categoryMap.get(category)!
    stats.losses++
    stats.pnl += p.cash_pnl || 0
    stats.staked += p.total_bought || 0
  })
  
  // Convert to array and calculate derived stats
  return categories
    .map(category => {
      const stats = categoryMap.get(category)!
      const totalBets = stats.wins + stats.losses
      return {
        category,
        wins: stats.wins,
        losses: stats.losses,
        totalBets,
        winRate: totalBets > 0 ? (stats.wins / totalBets) * 100 : 0,
        totalPnL: stats.pnl,
        roi: stats.staked > 0 ? (stats.pnl / stats.staked) * 100 : 0,
        totalStaked: stats.staked
      }
    })
    .filter(s => s.totalBets > 0) // Only show categories with bets
    .sort((a, b) => b.totalPnL - a.totalPnL) // Sort by P&L descending
}

/**
 * Calculate overall performance stats
 */
export interface PerformanceStats {
  totalBets: number
  winRate: number
  avgStake: number
  bestWin: number
  worstLoss: number
  profitFactor: number
  avgWin: number
  avgLoss: number
}

export function calculatePerformanceStats(
  positions: PolymarketPosition[],
  closedPositions: PolymarketClosedPosition[]
): PerformanceStats {
  const allPnLs: number[] = []
  const allStakes: number[] = []
  
  // Closed positions
  closedPositions.forEach(p => {
    allPnLs.push(p.realized_pnl || 0)
    allStakes.push(p.total_bought || 0)
  })
  
  // Resolved losses
  positions.filter(p => (p.current_value || 0) === 0 && (p.cash_pnl || 0) !== 0).forEach(p => {
    allPnLs.push(p.cash_pnl || 0)
    allStakes.push(p.total_bought || 0)
  })
  
  const wins = allPnLs.filter(p => p > 0)
  const losses = allPnLs.filter(p => p < 0)
  
  const totalWins = wins.reduce((s, v) => s + v, 0)
  const totalLosses = Math.abs(losses.reduce((s, v) => s + v, 0))
  
  return {
    totalBets: allPnLs.length,
    winRate: allPnLs.length > 0 ? (wins.length / allPnLs.length) * 100 : 0,
    avgStake: allStakes.length > 0 ? allStakes.reduce((s, v) => s + v, 0) / allStakes.length : 0,
    bestWin: wins.length > 0 ? Math.max(...wins) : 0,
    worstLoss: losses.length > 0 ? Math.min(...losses) : 0,
    profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
    avgWin: wins.length > 0 ? totalWins / wins.length : 0,
    avgLoss: losses.length > 0 ? totalLosses / losses.length : 0
  }
}

export async function fetchAllPolymarketData() {
  const [usdcBalance, positions, closedPositions, activity] = await Promise.all([
    fetchPolymarketUSDCBalance(),
    fetchPositions(),
    fetchClosedPositions(),
    fetchActivity()
  ])
  
  const pnlStats = calculatePnL(positions, closedPositions)
  const timeline = buildPnLTimeline(positions, closedPositions)
  const dailyPnL = calculate24hrPnL(positions, closedPositions)
  const categoryBreakdown = calculateCategoryBreakdown(positions, closedPositions)
  const performanceStats = calculatePerformanceStats(positions, closedPositions)
  
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
    timeline,
    dailyPnL,
    categoryBreakdown,
    performanceStats
  }
}
