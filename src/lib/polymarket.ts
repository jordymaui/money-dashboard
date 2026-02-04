// Polymarket API client - fetches directly from official APIs

const POLYGON_RPC = 'https://polygon-rpc.com'
const USDC_E_CONTRACT = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
const DATA_API = 'https://data-api.polymarket.com'

// Wallet configurations
export const POLYMARKET_WALLETS = {
  jordy: {
    address: '0xDa50B2Ca697Ee1A325d3c6f965B69Eb9EC632A41',
    name: 'Jordy',
    description: 'Personal account'
  },
  mauibot: {
    address: '0x3D67102FB34C01C5615603a7ce9FE8C5E1A9e6b3',
    name: 'Mauibot 🌺',
    description: 'AI Trading Bot'
  }
} as const

export type WalletKey = keyof typeof POLYMARKET_WALLETS

// Default wallet (can be overridden)
let currentWallet: WalletKey = 'mauibot'

export function setCurrentWallet(wallet: WalletKey) {
  currentWallet = wallet
}

export function getCurrentWallet(): WalletKey {
  return currentWallet
}

export function getWalletAddress(wallet?: WalletKey): string {
  return POLYMARKET_WALLETS[wallet || currentWallet].address
}

// Legacy constant for backward compatibility
const POLYMARKET_WALLET = POLYMARKET_WALLETS.jordy.address

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
export async function fetchPolymarketUSDCBalance(wallet?: WalletKey): Promise<number> {
  try {
    const walletAddress = getWalletAddress(wallet)
    const paddedAddress = walletAddress.replace('0x', '').padStart(64, '0')
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
export async function fetchPositions(wallet?: WalletKey): Promise<PolymarketPosition[]> {
  try {
    const walletAddress = getWalletAddress(wallet)
    const response = await fetch(`${DATA_API}/positions?user=${walletAddress}&limit=500`)
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
export async function fetchClosedPositions(wallet?: WalletKey): Promise<PolymarketClosedPosition[]> {
  try {
    const walletAddress = getWalletAddress(wallet)
    const response = await fetch(`${DATA_API}/closed-positions?user=${walletAddress}&limit=500`)
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
export async function fetchActivity(wallet?: WalletKey): Promise<PolymarketActivity[]> {
  try {
    const walletAddress = getWalletAddress(wallet)
    const response = await fetch(`${DATA_API}/activity?user=${walletAddress}&limit=500`)
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
 * Granular categories for better performance tracking
 */
export type MarketCategory = 
  | 'sports-football'      // Soccer, Premier League, Champions League
  | 'sports-nfl'           // American Football, NFL, Super Bowl
  | 'sports-nba'           // Basketball, NBA
  | 'sports-ufc'           // UFC, Boxing, MMA
  | 'sports-tennis'        // Tennis, Grand Slams
  | 'sports-f1'            // Formula 1, Racing
  | 'sports-other'         // MLB, NHL, Golf, etc.
  | 'politics-us'          // US Politics
  | 'politics-intl'        // International Politics
  | 'crypto'               // Crypto markets
  | 'finance'              // Finance/Economics
  | 'culture'              // Pop Culture, Entertainment
  | 'other'                // Everything else

export function categorizeMarket(title: string): MarketCategory {
  const t = title.toLowerCase()
  
  // === SPORTS SUBCATEGORIES (check specific first) ===
  
  // Soccer/Football (the world's football)
  if (/\b(premier\s?league|champions?\s?league|la\s?liga|serie\s?a|bundesliga|ligue\s?1|uefa|fifa|world\s?cup|euro\s?(20\d{2})?|epl|soccer|fc\s|manchester|liverpool|chelsea|arsenal|barcelona|real\s?madrid|psg|bayern|juventus|inter\s?milan|ac\s?milan|tottenham|man\s?(utd|united|city)|leeds|everton|wolves|newcastle|aston\s?villa|west\s?ham|messi|ronaldo|haaland|mbappe|salah)\b/.test(t)) {
    return 'sports-football'
  }
  
  // American Football / NFL
  if (/\b(nfl|super\s?bowl|touchdown|quarterback|chiefs|eagles|49ers|cowboys|patriots|packers|bills|ravens|bengals|dolphins|jets|lions|bears|vikings|saints|buccaneers|falcons|panthers|seahawks|rams|cardinals|broncos|raiders|chargers|colts|texans|titans|jaguars|steelers|browns|commanders|giants|afc|nfc|mahomes|kelce|brady|rodgers)\b/.test(t)) {
    return 'sports-nfl'
  }
  
  // Basketball / NBA
  if (/\b(nba|basketball|lakers|celtics|warriors|nets|bucks|76ers|suns|mavericks|nuggets|heat|bulls|knicks|clippers|grizzlies|timberwolves|pelicans|spurs|rockets|thunder|jazz|blazers|kings|hawks|hornets|magic|pistons|pacers|cavaliers|wizards|lebron|curry|durant|giannis|jokic|embiid|tatum|doncic)\b/.test(t)) {
    return 'sports-nba'
  }
  
  // UFC / Boxing / MMA
  if (/\b(ufc|mma|boxing|fight|fighter|knockout|ko|tko|bout|heavyweight|lightweight|middleweight|welterweight|featherweight|bantamweight|flyweight|dana\s?white|mcgregor|khabib|jones|adesanya|poirier|ngannou|volkanovski|makhachev|o'?malley|pereira|silva|canelo|fury|wilder|joshua|tyson|paul\s+(vs|v\.?s?\.?)|jake\s?paul|logan\s?paul)\b/.test(t)) {
    return 'sports-ufc'
  }
  
  // Tennis
  if (/\b(tennis|wimbledon|us\s?open|french\s?open|australian\s?open|roland\s?garros|grand\s?slam|atp|wta|djokovic|nadal|federer|alcaraz|sinner|medvedev|zverev|tsitsipas|swiatek|sabalenka|gauff|rybakina)\b/.test(t)) {
    return 'sports-tennis'
  }
  
  // Formula 1 / Racing
  if (/\b(f1|formula\s?(1|one)|grand\s?prix|verstappen|hamilton|leclerc|norris|sainz|perez|russell|red\s?bull|ferrari|mercedes|mclaren|aston\s?martin|alpine|williams|haas|alfa\s?romeo|fia|monaco\s?gp|silverstone|monza|spa|suzuka|drs|pit\s?stop)\b/.test(t)) {
    return 'sports-f1'
  }
  
  // Other Sports (MLB, NHL, Golf, etc.)
  if (/\b(mlb|baseball|nhl|hockey|golf|pga|masters|lpga|ryder\s?cup|cricket|rugby|cycling|tour\s?de\s?france|olympics|marathon|athletics|swimming|esports|league\s?of\s?legends|dota|csgo|valorant|world\s?series|stanley\s?cup|home\s?run|touchdown|slam\s?dunk|hat\s?trick|ohtani|trout|judge|mcdavid|ovechkin|crosby|woods|mcilroy|scheffler|rahm)\b/.test(t)) {
    return 'sports-other'
  }
  
  // Generic sports catch-all (if mentions game/match/win in sports context)
  if (/\b(score|playoff|championship|finals|season|draft|trade|roster|coach|manager|stadium|league|division|conference|seed|bracket|tournament)\b/.test(t) && 
      !/\b(election|vote|political|congress|president)\b/.test(t)) {
    return 'sports-other'
  }
  
  // === POLITICS ===
  
  // US Politics
  if (/\b(trump|biden|harris|obama|desantis|newsom|haley|ramaswamy|pence|aoc|pelosi|mccarthy|mcconnell|schumer|congress|senate|house\s?(of\s?rep)?|scotus|supreme\s?court|gop|dnc|rnc|republican|democrat|2024\s?election|2028\s?election|electoral|swing\s?state|iowa|new\s?hampshire|nevada|georgia|arizona|pennsylvania|michigan|wisconsin|white\s?house|oval\s?office|potus|executive\s?order|impeach|indictment|fbi|doj|irs|sec\s|cftc|federal)\b/.test(t)) {
    return 'politics-us'
  }
  
  // International Politics
  if (/\b(ukraine|russia|putin|zelensky|china|xi\s?jinping|taiwan|eu\s|european\s?union|brexit|uk\s?prime|starmer|sunak|macron|france|germany|scholz|merkel|nato|un\s|united\s?nations|israel|gaza|palestine|netanyahu|iran|north\s?korea|kim\s?jong|modi|india|bolsonaro|brazil|trudeau|canada|australia|japan|kishida|south\s?korea|yoon|mexico|amlo|sanctions|diplomat|embassy|minister|parliament|referendum)\b/.test(t)) {
    return 'politics-intl'
  }
  
  // Generic politics catch-all
  if (/\b(election|vote|ballot|poll|candidate|campaign|political|government|legislation|bill\s+(pass|fail)|veto|cabinet|administration|governor|senator|mayor)\b/.test(t)) {
    return 'politics-us' // Default to US if unclear
  }
  
  // === CRYPTO ===
  if (/\b(btc|eth|bitcoin|ethereum|crypto|solana|sol|xrp|ripple|cardano|ada|dogecoin|doge|shib|bnb|binance|coinbase|defi|nft|token|blockchain|altcoin|memecoin|stablecoin|usdt|usdc|tether|ledger|metamask|web3|dao|airdrop|halving|etf|sec\s?(crypto|bitcoin|ethereum)|gensler)\b/.test(t)) {
    return 'crypto'
  }
  
  // === FINANCE / ECONOMICS ===
  if (/\b(fed|federal\s?reserve|interest\s?rate|inflation|cpi|ppi|gdp|economy|recession|unemployment|jobs\s?report|nonfarm|fomc|powell|yellen|treasury|bond|yield|stock|s&p|nasdaq|dow|nyse|market\s?(crash|correction|rally)|earnings|ipo|merger|acquisition|bailout|debt\s?ceiling|deficit|tariff|trade\s?war)\b/.test(t)) {
    return 'finance'
  }
  
  // === POP CULTURE / ENTERTAINMENT ===
  if (/\b(oscar|grammy|emmy|tony|golden\s?globe|bafta|movie|film|box\s?office|netflix|disney|hbo|streaming|album|billboard|spotify|concert|tour|celebrity|kardashian|swift|taylor|beyonce|drake|kanye|ye\s|travis\s?scott|rihanna|bieber|harry\s?styles|dua\s?lipa|bad\s?bunny|weeknd|actor|actress|director|premiere|trailer|sequel|marvel|dc\s|superhero|anime|tv\s?show|series|finale|season\s?\d|bachelor|bachelorette|survivor|big\s?brother|love\s?island|reality\s?tv)\b/.test(t)) {
    return 'culture'
  }
  
  return 'other'
}

/**
 * Get category display info
 */
export function getCategoryInfo(category: MarketCategory): { emoji: string; label: string; color: string } {
  const info: Record<MarketCategory, { emoji: string; label: string; color: string }> = {
    'sports-football': { emoji: '⚽', label: 'Football (Soccer)', color: 'text-green-400' },
    'sports-nfl': { emoji: '🏈', label: 'NFL', color: 'text-orange-400' },
    'sports-nba': { emoji: '🏀', label: 'NBA', color: 'text-orange-500' },
    'sports-ufc': { emoji: '🥊', label: 'UFC/Boxing', color: 'text-red-400' },
    'sports-tennis': { emoji: '🎾', label: 'Tennis', color: 'text-lime-400' },
    'sports-f1': { emoji: '🏎️', label: 'F1', color: 'text-red-500' },
    'sports-other': { emoji: '🏅', label: 'Sports (Other)', color: 'text-amber-400' },
    'politics-us': { emoji: '🇺🇸', label: 'US Politics', color: 'text-blue-400' },
    'politics-intl': { emoji: '🌍', label: 'Intl Politics', color: 'text-blue-300' },
    'crypto': { emoji: '₿', label: 'Crypto', color: 'text-yellow-400' },
    'finance': { emoji: '📈', label: 'Finance', color: 'text-emerald-400' },
    'culture': { emoji: '🎬', label: 'Pop Culture', color: 'text-pink-400' },
    'other': { emoji: '📊', label: 'Other', color: 'text-zinc-400' }
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
  
  // Initialize all categories (granular)
  const categories: MarketCategory[] = [
    'sports-football', 'sports-nfl', 'sports-nba', 'sports-ufc', 
    'sports-tennis', 'sports-f1', 'sports-other',
    'politics-us', 'politics-intl',
    'crypto', 'finance', 'culture', 'other'
  ]
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

export async function fetchAllPolymarketData(wallet?: WalletKey) {
  const [usdcBalance, positions, closedPositions, activity] = await Promise.all([
    fetchPolymarketUSDCBalance(wallet),
    fetchPositions(wallet),
    fetchClosedPositions(wallet),
    fetchActivity(wallet)
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
