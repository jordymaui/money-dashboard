// Sport.Fun / Football.fun API client using Base Blockscout
const BLOCKSCOUT_API = 'https://base.blockscout.com/api/v2'
const COINGECKO_API = 'https://api.coingecko.com/api/v3'

// Contract addresses
export const SDF_CONTRACTS = {
  FUN_TOKEN: '0x16EE7ecAc70d1028E7712751E2Ee6BA808a7dd92',
  FDF_PLAYERS: '0x71c8b0c5148EdB0399D1EdF9BF0C8C81dEa16918',  // Football players
  NFL_PLAYERS: '0x2EeF466e802Ab2835aB81BE63eEbc55167d35b56',  // NFL players
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
}

// Default wallet - can be overridden
export const SDF_WALLET = '0xFc1A8921eA05bEC9ceb536f8aEE02AF881D72F6B'

export interface TokenBalance {
  symbol: string
  name: string
  balance: string
  balanceFormatted: number
  decimals: number
  contractAddress: string
  priceUsd?: number
  valueUsd?: number
}

export interface PlayerShare {
  tokenId: string
  contractAddress: string
  balance: string
  balanceFormatted: number
  gameType: 'FDF' | 'NFL'
  // Metadata (if available)
  playerName?: string
  imageUrl?: string
}

export interface SDFPortfolio {
  wallet: string
  funToken: TokenBalance | null
  usdcBalance: TokenBalance | null
  playerShares: PlayerShare[]
  totalFunValue: number
  totalPlayersValue: number
  totalPortfolioValue: number
  lastUpdated: Date
}

// Fetch $FUN token price from CoinGecko
export async function fetchFunPrice(): Promise<number> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/token_price/base?contract_addresses=${SDF_CONTRACTS.FUN_TOKEN.toLowerCase()}&vs_currencies=usd`
    )
    
    if (!response.ok) return 0
    
    const data = await response.json()
    return data[SDF_CONTRACTS.FUN_TOKEN.toLowerCase()]?.usd || 0
  } catch (error) {
    console.error('Error fetching FUN price:', error)
    return 0
  }
}

// Fetch ERC-20 token balances for a wallet
export async function fetchTokenBalances(wallet: string = SDF_WALLET): Promise<TokenBalance[]> {
  try {
    const response = await fetch(
      `${BLOCKSCOUT_API}/addresses/${wallet}/tokens?type=ERC-20`
    )
    
    if (!response.ok) return []
    
    const data = await response.json()
    
    return data.items.map((item: any) => {
      const decimals = parseInt(item.token.decimals || '18')
      const balance = item.value || '0'
      const balanceFormatted = parseFloat(balance) / Math.pow(10, decimals)
      
      return {
        symbol: item.token.symbol || 'Unknown',
        name: item.token.name || 'Unknown Token',
        balance,
        balanceFormatted,
        decimals,
        contractAddress: item.token.address_hash,
        priceUsd: item.token.exchange_rate ? parseFloat(item.token.exchange_rate) : undefined
      }
    })
  } catch (error) {
    console.error('Error fetching token balances:', error)
    return []
  }
}

// Fetch ERC-1155 player shares for a wallet
export async function fetchPlayerShares(wallet: string = SDF_WALLET): Promise<PlayerShare[]> {
  try {
    const response = await fetch(
      `${BLOCKSCOUT_API}/addresses/${wallet}/tokens?type=ERC-1155`
    )
    
    if (!response.ok) return []
    
    const data = await response.json()
    
    return data.items.map((item: any) => {
      const contractAddress = item.token.address_hash
      const isFDF = contractAddress.toLowerCase() === SDF_CONTRACTS.FDF_PLAYERS.toLowerCase()
      const isNFL = contractAddress.toLowerCase() === SDF_CONTRACTS.NFL_PLAYERS.toLowerCase()
      
      // Balance is in wei-like format (18 decimals for share amounts)
      const balance = item.value || '0'
      const balanceFormatted = parseFloat(balance) / Math.pow(10, 18)
      
      return {
        tokenId: item.token_id || 'unknown',
        contractAddress,
        balance,
        balanceFormatted,
        gameType: isFDF ? 'FDF' : isNFL ? 'NFL' : 'FDF',
        playerName: item.token_instance?.metadata?.name || undefined,
        imageUrl: item.token_instance?.image_url || undefined
      }
    }).filter((share: PlayerShare) => 
      share.contractAddress.toLowerCase() === SDF_CONTRACTS.FDF_PLAYERS.toLowerCase() ||
      share.contractAddress.toLowerCase() === SDF_CONTRACTS.NFL_PLAYERS.toLowerCase()
    )
  } catch (error) {
    console.error('Error fetching player shares:', error)
    return []
  }
}

// Fetch complete SDF portfolio
export async function fetchSDFPortfolio(wallet: string = SDF_WALLET): Promise<SDFPortfolio> {
  try {
    const [tokens, playerShares, funPrice] = await Promise.all([
      fetchTokenBalances(wallet),
      fetchPlayerShares(wallet),
      fetchFunPrice()
    ])
    
    // Find FUN and USDC tokens
    const funToken = tokens.find(t => 
      t.contractAddress.toLowerCase() === SDF_CONTRACTS.FUN_TOKEN.toLowerCase()
    )
    const usdcBalance = tokens.find(t => 
      t.contractAddress.toLowerCase() === SDF_CONTRACTS.USDC.toLowerCase()
    )
    
    // Calculate FUN value
    const funValue = funToken ? funToken.balanceFormatted * funPrice : 0
    if (funToken) {
      funToken.priceUsd = funPrice
      funToken.valueUsd = funValue
    }
    
    // For now, player shares value is estimated (we'd need market data for accurate pricing)
    // Placeholder: assume each share is worth roughly its balance in "gold" which converts to USD
    const playersValue = playerShares.reduce((sum, p) => sum + p.balanceFormatted * 0.001, 0) // Rough estimate
    
    return {
      wallet,
      funToken: funToken || null,
      usdcBalance: usdcBalance || null,
      playerShares,
      totalFunValue: funValue,
      totalPlayersValue: playersValue,
      totalPortfolioValue: funValue + (usdcBalance?.balanceFormatted || 0),
      lastUpdated: new Date()
    }
  } catch (error) {
    console.error('Error fetching SDF portfolio:', error)
    return {
      wallet,
      funToken: null,
      usdcBalance: null,
      playerShares: [],
      totalFunValue: 0,
      totalPlayersValue: 0,
      totalPortfolioValue: 0,
      lastUpdated: new Date()
    }
  }
}

// Fetch recent token transfers for activity feed
export async function fetchRecentTransfers(wallet: string = SDF_WALLET, limit: number = 20) {
  try {
    const response = await fetch(
      `${BLOCKSCOUT_API}/addresses/${wallet}/token-transfers?type=ERC-20,ERC-1155&limit=${limit}`
    )
    
    if (!response.ok) return []
    
    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('Error fetching transfers:', error)
    return []
  }
}
