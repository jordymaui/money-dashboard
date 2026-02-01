// Polymarket utilities - fetch USDC balance from Polygon

const POLYGON_RPC = 'https://polygon-rpc.com'
const USDC_E_CONTRACT = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' // USDC.e on Polygon (what Polymarket uses)
const POLYMARKET_WALLET = '0xDa50B2Ca697Ee1A325d3c6f965B69Eb9EC632A41'

/**
 * Fetch USDC.e balance from Polygon for the Polymarket wallet
 * This is the actual cash balance sitting in the account
 */
export async function fetchPolymarketUSDCBalance(): Promise<number> {
  try {
    // balanceOf(address) selector = 0x70a08231
    const paddedAddress = POLYMARKET_WALLET.replace('0x', '').padStart(64, '0')
    const data = `0x70a08231${paddedAddress}`

    const response = await fetch(POLYGON_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          { to: USDC_E_CONTRACT, data },
          'latest'
        ],
        id: 1
      })
    })

    if (!response.ok) {
      console.error('Polygon RPC error:', response.status)
      return 0
    }

    const result = await response.json()
    
    if (result.result) {
      // Convert hex to number, divide by 10^6 (USDC has 6 decimals)
      const balanceWei = parseInt(result.result, 16)
      return balanceWei / 1_000_000
    }

    return 0
  } catch (error) {
    console.error('Error fetching USDC balance:', error)
    return 0
  }
}
