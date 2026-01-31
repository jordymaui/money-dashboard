import { supabase } from '@/lib/supabase'
import { PolymarketHeader } from '@/components/polymarket-header'
import { PolymarketPositionsTable } from '@/components/polymarket-positions-table'
import { PolymarketPosition, ChartDataPoint } from '@/types'

// Sidebar Panel Component
function SidebarPanel({ 
  totalValue, 
  totalPnl, 
  openPositions,
  resolvedPositions,
  categoryBreakdown
}: { 
  totalValue: number
  totalPnl: number
  openPositions: number
  resolvedPositions: number
  categoryBreakdown: { category: string; value: number; pnl: number }[]
}) {
  const pnlPercent = totalValue > 0 ? (totalPnl / totalValue) * 100 : 0
  
  return (
    <div className="w-80 space-y-4 flex-shrink-0">
      {/* Portfolio Value */}
      <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800/50">
        <div className="text-sm text-zinc-500 mb-1">Portfolio Value</div>
        <div className="text-3xl font-bold text-white font-mono">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`text-sm mt-2 ${totalPnl >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
          <i className={`fa-solid ${totalPnl >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1`}></i>
          {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-zinc-500 ml-1">({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)</span>
        </div>
      </div>

      {/* Position Breakdown */}
      <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800/50">
        <div className="text-sm text-zinc-500 mb-3">Position Status</div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="text-zinc-400 text-sm">Open</span>
            </div>
            <span className="text-white font-mono">{openPositions}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-zinc-500"></div>
              <span className="text-zinc-400 text-sm">Resolved</span>
            </div>
            <span className="text-white font-mono">{resolvedPositions}</span>
          </div>
        </div>
        {/* Visual bar */}
        <div className="mt-4 h-2 bg-zinc-700 rounded-full overflow-hidden flex">
          <div 
            className="bg-blue-500" 
            style={{ width: `${(openPositions / (openPositions + resolvedPositions || 1)) * 100}%` }}
          />
          <div 
            className="bg-zinc-500" 
            style={{ width: `${(resolvedPositions / (openPositions + resolvedPositions || 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800/50">
        <div className="text-sm text-zinc-500 mb-3">By Category</div>
        <div className="space-y-3">
          {categoryBreakdown.slice(0, 5).map((cat) => {
            const maxValue = Math.max(...categoryBreakdown.map(c => c.value), 1)
            return (
              <div key={cat.category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-zinc-400 text-sm">{cat.category}</span>
                  <span className="text-white font-mono text-sm">
                    ${cat.value.toFixed(0)}
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{ width: `${(cat.value / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Top Stats Bar Component
function TopStatsBar({ 
  totalValue, 
  totalPnl, 
  openPositions,
  winRate 
}: { 
  totalValue: number
  totalPnl: number
  openPositions: number
  winRate: number
}) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-4">
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
        <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Total Value</div>
        <div className="text-2xl font-bold text-white font-mono">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
        <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Total PnL</div>
        <div className={`text-2xl font-bold font-mono ${totalPnl >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
          {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
        <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Open Positions</div>
        <div className="text-2xl font-bold text-white font-mono">{openPositions}</div>
      </div>
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
        <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Win Rate</div>
        <div className="text-2xl font-bold text-white font-mono">{winRate.toFixed(1)}%</div>
      </div>
    </div>
  )
}

// Simple PnL Chart Component
function PnLChart({ 
  data, 
  totalPnl 
}: { 
  data: { date: string; pnl: number }[]
  totalPnl: number
}) {
  if (data.length === 0) {
    return (
      <div className="flex-1 bg-zinc-900/50 rounded-xl p-5 border border-zinc-800/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-zinc-500">PnL (Predictions)</div>
            <div className={`text-2xl font-bold font-mono ${totalPnl >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        <div className="h-48 flex items-center justify-center text-zinc-500">
          <div className="text-center">
            <i className="fa-solid fa-chart-line text-3xl mb-2 opacity-30"></i>
            <p className="text-sm">PnL chart will populate with trade history</p>
          </div>
        </div>
      </div>
    )
  }

  const minPnl = Math.min(...data.map(d => d.pnl))
  const maxPnl = Math.max(...data.map(d => d.pnl))
  const range = maxPnl - minPnl || 1

  return (
    <div className="flex-1 bg-zinc-900/50 rounded-xl p-5 border border-zinc-800/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-zinc-500">PnL (Predictions)</div>
          <div className={`text-2xl font-bold font-mono ${totalPnl >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
      <div className="h-48 flex items-end gap-1">
        {data.map((point, i) => {
          const height = ((point.pnl - minPnl) / range) * 100
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center"
            >
              <div 
                className={`w-full rounded-t ${point.pnl >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                style={{ height: `${Math.max(height, 5)}%` }}
              />
              <span className="text-[9px] text-zinc-600 mt-1 rotate-45 origin-left">{point.date}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function categorizePosition(title: string | null, eventSlug: string | null): string {
  const text = (title || '') + ' ' + (eventSlug || '')
  const lower = text.toLowerCase()
  
  if (lower.includes('bitcoin') || lower.includes('btc') || lower.includes('eth') || lower.includes('crypto')) {
    return 'Crypto'
  }
  if (lower.includes('nfl') || lower.includes('nba') || lower.includes('premier') || lower.includes('f1') || 
      lower.includes('football') || lower.includes('soccer') || lower.includes('bun-') || 
      lower.includes('epl-') || lower.includes('elc-') || lower.includes('win on') ||
      lower.includes('spread') || lower.includes('bulls') || lower.includes('lakers')) {
    return 'Sports'
  }
  if (lower.includes('trump') || lower.includes('biden') || lower.includes('election') || 
      lower.includes('president') || lower.includes('senate') || lower.includes('congress')) {
    return 'Politics'
  }
  if (lower.includes('airdrop') || lower.includes('fdv') || lower.includes('launch') || lower.includes('lighter')) {
    return 'Airdrops/Tokens'
  }
  return 'Other'
}

async function getPositions(): Promise<PolymarketPosition[]> {
  try {
    const { data, error } = await supabase
      .from('polymarket_positions')
      .select('*')
      .order('current_value', { ascending: false })

    if (error) {
      // Table might not exist yet
      console.error('Error fetching positions:', error.message)
      return []
    }
    return data as PolymarketPosition[]
  } catch (err) {
    console.error('Failed to fetch positions:', err)
    return []
  }
}

export const revalidate = 60 // Revalidate every 60 seconds

export default async function PolymarketPage() {
  const positions = await getPositions()

  // Calculate stats
  const totalValue = positions.reduce((sum, p) => sum + (p.current_value || 0), 0)
  const totalInitialValue = positions.reduce((sum, p) => sum + (p.initial_value || 0), 0)
  const totalPnl = positions.reduce((sum, p) => sum + (p.cash_pnl || 0), 0)
  
  const openPositions = positions.filter(p => !p.redeemable && p.current_value > 0)
  const resolvedPositions = positions.filter(p => p.redeemable || p.cur_price === 0 || p.cur_price === 1)
  
  // Win rate based on resolved positions
  const wins = resolvedPositions.filter(p => (p.cash_pnl || 0) > 0)
  const winRate = resolvedPositions.length > 0 ? (wins.length / resolvedPositions.length) * 100 : 0

  // Category breakdown
  const categoryMap = new Map<string, { value: number; pnl: number }>()
  for (const pos of positions) {
    const category = categorizePosition(pos.title, pos.event_slug)
    const existing = categoryMap.get(category) || { value: 0, pnl: 0 }
    existing.value += pos.current_value || 0
    existing.pnl += pos.cash_pnl || 0
    categoryMap.set(category, existing)
  }
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.value - a.value)

  // Generate simple PnL data from positions (aggregate by date)
  const pnlData: { date: string; pnl: number }[] = []
  // For now, just show cumulative - we'd need trades for real time series
  const sortedByPnl = [...positions]
    .filter(p => p.cash_pnl !== null)
    .sort((a, b) => (a.cash_pnl || 0) - (b.cash_pnl || 0))
  
  let cumulative = 0
  for (let i = 0; i < Math.min(20, sortedByPnl.length); i++) {
    cumulative += sortedByPnl[i].cash_pnl || 0
    pnlData.push({
      date: `P${i + 1}`,
      pnl: cumulative
    })
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <PolymarketHeader />

      {/* Top Stats Bar */}
      <TopStatsBar
        totalValue={totalValue}
        totalPnl={totalPnl}
        openPositions={openPositions.length}
        winRate={winRate}
      />

      {/* Main Content */}
      <div className="flex gap-4 mb-4">
        {/* Sidebar */}
        <SidebarPanel
          totalValue={totalValue}
          totalPnl={totalPnl}
          openPositions={openPositions.length}
          resolvedPositions={resolvedPositions.length}
          categoryBreakdown={categoryBreakdown}
        />

        {/* Chart */}
        <PnLChart data={pnlData} totalPnl={totalPnl} />
      </div>

      {/* Positions Table */}
      <PolymarketPositionsTable positions={positions} />

      {/* Data Info */}
      <div className="mt-4 text-xs text-zinc-600 text-right">
        <i className="fa-solid fa-clock-rotate-left mr-1"></i>
        {positions.length > 0 
          ? `Showing ${positions.length} positions • Last synced: ${new Date(positions[0].updated_at).toLocaleString()}`
          : 'No data - run polymarket-sync.js to import positions'}
      </div>

      {/* Setup Notice (shown when no positions) */}
      {positions.length === 0 && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-database text-2xl text-blue-400"></i>
            </div>
            <div>
              <h3 className="font-medium text-white">
                <i className="fa-solid fa-wrench mr-2"></i>
                Setup Required
              </h3>
              <p className="text-sm text-zinc-400 mt-1 mb-3">
                To display Polymarket data, run these steps:
              </p>
              <ol className="text-sm text-zinc-400 space-y-2 list-decimal list-inside">
                <li>Create tables in Supabase SQL Editor: <code className="text-blue-400">scripts/migrations/004_polymarket_tables.sql</code></li>
                <li>Run sync script: <code className="text-blue-400">node scripts/polymarket-sync.js</code></li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
