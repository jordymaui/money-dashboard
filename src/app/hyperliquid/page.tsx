import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/dashboard'
import { HyperliquidSnapshot, HyperliquidPosition, ChartDataPoint } from '@/types'

async function getSnapshots() {
  const { data, error } = await supabase
    .from('hyperliquid_snapshots')
    .select('*')
    .order('timestamp', { ascending: true })
    .limit(100)

  if (error) {
    console.error('Error fetching snapshots:', error)
    return []
  }
  return data as HyperliquidSnapshot[]
}

async function getLatestPositions() {
  // Get the latest snapshot id first
  const { data: latestSnapshot } = await supabase
    .from('hyperliquid_snapshots')
    .select('id')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (!latestSnapshot) return []

  const { data, error } = await supabase
    .from('hyperliquid_positions')
    .select('*')
    .eq('snapshot_id', latestSnapshot.id)

  if (error) {
    console.error('Error fetching positions:', error)
    return []
  }
  return data as HyperliquidPosition[]
}

async function getLatestSnapshot() {
  const { data, error } = await supabase
    .from('hyperliquid_snapshots')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching latest snapshot:', error)
    return null
  }
  return data as HyperliquidSnapshot
}

export const revalidate = 60 // Revalidate every 60 seconds

export default async function HyperliquidPage() {
  const [snapshots, positions, latestSnapshot] = await Promise.all([
    getSnapshots(),
    getLatestPositions(),
    getLatestSnapshot()
  ])

  // Transform snapshots for the chart
  const chartData: ChartDataPoint[] = snapshots.map(snapshot => ({
    date: new Date(snapshot.timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    timestamp: new Date(snapshot.timestamp).getTime(),
    value: snapshot.account_value,
    pnl: snapshot.unrealized_pnl
  }))

  // Calculate stats
  const accountValue = latestSnapshot?.account_value ?? 0
  const unrealizedPnl = latestSnapshot?.unrealized_pnl ?? 0
  const withdrawable = latestSnapshot?.withdrawable ?? accountValue * 0.8 // Estimate if not available
  
  // Calculate from positions
  const longPositions = positions.filter(p => p.size > 0)
  const shortPositions = positions.filter(p => p.size < 0)
  
  const longExposure = longPositions.reduce((sum, p) => sum + Math.abs(p.size * (p.current_price || p.entry_price)), 0)
  const shortExposure = shortPositions.reduce((sum, p) => sum + Math.abs(p.size * (p.current_price || p.entry_price)), 0)
  const totalPositionSize = longExposure + shortExposure
  
  // Calculate margin used and leverage
  const marginUsed = positions.reduce((sum, pos) => {
    const positionValue = Math.abs(pos.size * pos.entry_price)
    return sum + (positionValue / pos.leverage)
  }, 0)
  
  const marginUsagePercent = accountValue > 0 ? (marginUsed / accountValue) * 100 : 0
  const effectiveLeverage = accountValue > 0 ? totalPositionSize / accountValue : 0

  // Calculate current week PnL
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const weekStartSnapshot = snapshots.find(s => new Date(s.timestamp).getTime() >= oneWeekAgo)
  const weekPnl = weekStartSnapshot 
    ? accountValue - weekStartSnapshot.account_value 
    : unrealizedPnl

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Sub-header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-full text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
            <i className="fa-solid fa-arrow-left"></i> Back
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
            <i className="fa-solid fa-chart-line text-emerald-400"></i>
            <span className="font-mono text-white">Hyperliquid</span>
            <i className="fa-solid fa-circle text-[6px] text-emerald-400"></i>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors">
            <i className="fa-solid fa-sliders"></i> Advanced
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors">
            <i className="fa-solid fa-file-lines"></i> Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium text-white transition-colors">
            <i className="fa-solid fa-copy"></i> Copytrade
          </button>
        </div>
      </div>

      <DashboardLayout
        totalValue={accountValue}
        withdrawable={withdrawable}
        leverage={effectiveLeverage}
        totalPositionSize={totalPositionSize}
        perpEquity={accountValue}
        marginUsage={marginUsagePercent}
        longExposure={longExposure}
        shortExposure={shortExposure}
        chartData={chartData}
        currentPnl={weekPnl}
        positions={positions}
        accentColor="green"
        title="PnL (Combined)"
      />

      {/* Data Info */}
      <div className="mt-4 text-xs text-zinc-600 text-right">
        <i className="fa-solid fa-clock-rotate-left mr-1"></i>
        Last updated: {latestSnapshot ? new Date(latestSnapshot.timestamp).toLocaleString() : 'Never'}
      </div>
    </div>
  )
}
