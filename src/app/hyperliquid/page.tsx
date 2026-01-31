import { supabase } from '@/lib/supabase'
import { StatCard } from '@/components/stat-card'
import { EquityChart } from '@/components/equity-chart'
import { PositionTable } from '@/components/position-table'
import { HyperliquidSnapshot, HyperliquidPosition } from '@/types'

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
  const chartData = snapshots.map(snapshot => ({
    date: new Date(snapshot.timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    value: snapshot.account_value
  }))

  // Calculate stats
  const accountValue = latestSnapshot?.account_value ?? 0
  const unrealizedPnl = latestSnapshot?.unrealized_pnl ?? 0
  
  // Calculate daily PnL (compare to previous snapshot)
  const previousSnapshot = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null
  const dailyPnl = previousSnapshot 
    ? accountValue - previousSnapshot.account_value 
    : 0
  const dailyPnlPercent = previousSnapshot && previousSnapshot.account_value > 0
    ? (dailyPnl / previousSnapshot.account_value) * 100
    : 0

  // Calculate margin used from positions
  const marginUsed = positions.reduce((sum, pos) => {
    const positionValue = Math.abs(pos.size * pos.entry_price)
    return sum + (positionValue / pos.leverage)
  }, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Hyperliquid</h1>
        <p className="text-zinc-400 mt-1">Perpetual trading dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Account Value"
          value={`$${accountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend="neutral"
        />
        <StatCard
          title="Daily PnL"
          value={`${dailyPnl >= 0 ? '+' : ''}$${dailyPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${dailyPnlPercent >= 0 ? '+' : ''}${dailyPnlPercent.toFixed(2)}%`}
          trend={dailyPnl >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Unrealized PnL"
          value={`${unrealizedPnl >= 0 ? '+' : ''}$${unrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={unrealizedPnl >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Open Positions"
          value={positions.length.toString()}
          subtitle={positions.length > 0 ? `${marginUsed.toFixed(2)} margin used` : 'No positions'}
          trend="neutral"
        />
      </div>

      {/* Equity Chart */}
      {chartData.length > 0 ? (
        <EquityChart data={chartData} title="Equity Curve" />
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center text-zinc-500">
          No historical data available yet
        </div>
      )}

      {/* Positions Table */}
      <PositionTable positions={positions} />

      {/* Data Info */}
      <div className="text-xs text-zinc-600 text-right">
        Last updated: {latestSnapshot ? new Date(latestSnapshot.timestamp).toLocaleString() : 'Never'}
      </div>
    </div>
  )
}
