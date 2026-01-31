// Hyperliquid API client for real-time data
const HYPERLIQUID_API = 'https://api.hyperliquid.xyz/info'
const USER_ADDRESS = '0xf9988f32e52e59638b5275c9A66CD1D0B51c29eD'

export interface HyperliquidAssetPosition {
  position: {
    coin: string
    szi: string // size as string
    entryPx: string // entry price
    positionValue: string
    unrealizedPnl: string
    leverage: {
      type: string
      value: number
    }
    liquidationPx: string | null
    marginUsed: string
    returnOnEquity: string
  }
}

export interface HyperliquidState {
  marginSummary: {
    accountValue: string
    totalNtlPos: string
    totalRawUsd: string
    totalMarginUsed: string
    withdrawable: string
  }
  crossMarginSummary: {
    accountValue: string
    totalNtlPos: string
    totalRawUsd: string
    totalMarginUsed: string
  }
  assetPositions: HyperliquidAssetPosition[]
}

export interface HyperliquidFill {
  coin: string
  px: string
  sz: string
  side: string
  time: number
  startPosition: string
  dir: string
  closedPnl: string
  hash: string
  oid: number
  crossed: boolean
  fee: string
  tid: number
}

// Get current account state and positions
export async function fetchHyperliquidState(): Promise<HyperliquidState | null> {
  try {
    const response = await fetch(HYPERLIQUID_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'clearinghouseState',
        user: USER_ADDRESS
      })
    })

    if (!response.ok) {
      console.error('Hyperliquid API error:', response.status)
      return null
    }

    const data = await response.json()
    return data as HyperliquidState
  } catch (error) {
    console.error('Error fetching Hyperliquid state:', error)
    return null
  }
}

// Get user fills (trades)
export async function fetchHyperliquidFills(): Promise<HyperliquidFill[]> {
  try {
    const response = await fetch(HYPERLIQUID_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'userFills',
        user: USER_ADDRESS
      })
    })

    if (!response.ok) {
      console.error('Hyperliquid API error:', response.status)
      return []
    }

    const data = await response.json()
    return data as HyperliquidFill[]
  } catch (error) {
    console.error('Error fetching Hyperliquid fills:', error)
    return []
  }
}

// Get open orders
export async function fetchHyperliquidOpenOrders(): Promise<any[]> {
  try {
    const response = await fetch(HYPERLIQUID_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'openOrders',
        user: USER_ADDRESS
      })
    })

    if (!response.ok) {
      console.error('Hyperliquid API error:', response.status)
      return []
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching Hyperliquid open orders:', error)
    return []
  }
}

// Get all mids (current prices)
export async function fetchAllMids(): Promise<Record<string, string>> {
  try {
    const response = await fetch(HYPERLIQUID_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'allMids'
      })
    })

    if (!response.ok) {
      console.error('Hyperliquid API error:', response.status)
      return {}
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching all mids:', error)
    return {}
  }
}

// Transform Hyperliquid positions to our format
export function transformPositions(state: HyperliquidState, mids: Record<string, string>) {
  return state.assetPositions
    .filter(ap => parseFloat(ap.position.szi) !== 0)
    .map((ap, index) => {
      const size = parseFloat(ap.position.szi)
      const entryPrice = parseFloat(ap.position.entryPx)
      const currentPrice = parseFloat(mids[ap.position.coin] || ap.position.entryPx)
      const unrealizedPnl = parseFloat(ap.position.unrealizedPnl)
      const leverage = ap.position.leverage?.value || 1
      const liquidationPrice = ap.position.liquidationPx ? parseFloat(ap.position.liquidationPx) : undefined
      const marginUsed = parseFloat(ap.position.marginUsed)

      return {
        id: index,
        snapshot_id: 0,
        coin: ap.position.coin,
        size,
        entry_price: entryPrice,
        unrealized_pnl: unrealizedPnl,
        leverage,
        liquidation_price: liquidationPrice,
        current_price: currentPrice,
        margin_used: marginUsed,
        funding: 0
      }
    })
}
