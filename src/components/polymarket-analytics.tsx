'use client'

import { cn } from '@/lib/utils'
import { 
  CategoryStats, 
  PerformanceStats, 
  getCategoryInfo,
  MarketCategory 
} from '@/lib/polymarket'

interface PolymarketAnalyticsProps {
  categoryBreakdown: CategoryStats[]
  performanceStats: PerformanceStats
  totalPnL: number
}

function formatCurrency(value: number, decimals = 0): string {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}$${Math.abs(value).toLocaleString(undefined, { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })}`
}

function formatPercent(value: number): string {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${value.toFixed(0)}%`
}

function CategoryRow({ stats }: { stats: CategoryStats }) {
  const info = getCategoryInfo(stats.category)
  const isProfitable = stats.totalPnL >= 0
  
  return (
    <tr className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{info.emoji}</span>
          <span className={cn('font-medium', info.color)}>{info.label}</span>
        </div>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="text-green-400 font-mono">{stats.wins}</span>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="text-red-400 font-mono">{stats.losses}</span>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="text-white font-mono">{stats.winRate.toFixed(0)}%</span>
      </td>
      <td className="px-3 py-3 text-right">
        <span className={cn('font-mono font-medium', isProfitable ? 'text-green-400' : 'text-red-400')}>
          {formatPercent(stats.roi)}
        </span>
      </td>
    </tr>
  )
}

function MobileCategoryCard({ stats }: { stats: CategoryStats }) {
  const info = getCategoryInfo(stats.category)
  const isProfitable = stats.totalPnL >= 0
  
  return (
    <div className="bg-zinc-800/30 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{info.emoji}</span>
        <div>
          <div className={cn('font-medium', info.color)}>{info.label}</div>
          <div className="text-xs text-zinc-500">
            <span className="text-green-400">{stats.wins}W</span>
            <span className="mx-1">/</span>
            <span className="text-red-400">{stats.losses}L</span>
            <span className="ml-2">({stats.winRate.toFixed(0)}%)</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={cn('font-mono font-medium', isProfitable ? 'text-green-400' : 'text-red-400')}>
          {formatCurrency(stats.totalPnL)}
        </div>
        <div className={cn('text-xs', isProfitable ? 'text-green-400/70' : 'text-red-400/70')}>
          {formatPercent(stats.roi)} ROI
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, subValue, color = 'text-white' }: { 
  label: string
  value: string
  subValue?: string
  color?: string
}) {
  return (
    <div className="bg-zinc-800/30 rounded-lg p-3">
      <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={cn('font-mono font-medium text-lg', color)}>{value}</div>
      {subValue && <div className="text-xs text-zinc-500">{subValue}</div>}
    </div>
  )
}

export function PolymarketAnalytics({ 
  categoryBreakdown, 
  performanceStats,
  totalPnL
}: PolymarketAnalyticsProps) {
  if (performanceStats.totalBets === 0) {
    return null
  }

  const isProfitable = totalPnL >= 0

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-chart-pie text-blue-400"></i>
          <h3 className="font-medium text-white">Betting Analytics</h3>
        </div>
      </div>

      <div className="p-4">
        {/* Two-column layout on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Category Breakdown */}
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Category Breakdown</div>
            
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-zinc-500 uppercase">
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-center">W</th>
                    <th className="px-3 py-2 text-center">L</th>
                    <th className="px-3 py-2 text-center">Win %</th>
                    <th className="px-3 py-2 text-right">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown.map((stats) => (
                    <CategoryRow key={stats.category} stats={stats} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {categoryBreakdown.map((stats) => (
                <MobileCategoryCard key={stats.category} stats={stats} />
              ))}
            </div>
          </div>

          {/* Performance Stats */}
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Performance Stats</div>
            
            <div className="grid grid-cols-2 gap-2">
              <StatBox 
                label="Total Bets" 
                value={performanceStats.totalBets.toString()} 
              />
              <StatBox 
                label="Win Rate" 
                value={`${performanceStats.winRate.toFixed(0)}%`}
                color={performanceStats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}
              />
              <StatBox 
                label="Avg Stake" 
                value={`$${performanceStats.avgStake.toFixed(0)}`} 
              />
              <StatBox 
                label="Profit Factor" 
                value={performanceStats.profitFactor === Infinity 
                  ? '∞' 
                  : performanceStats.profitFactor.toFixed(2) + 'x'}
                color={performanceStats.profitFactor >= 1 ? 'text-green-400' : 'text-red-400'}
              />
              <StatBox 
                label="Best Win" 
                value={formatCurrency(performanceStats.bestWin)}
                color="text-green-400"
              />
              <StatBox 
                label="Worst Loss" 
                value={`-$${Math.abs(performanceStats.worstLoss).toFixed(0)}`}
                color="text-red-400"
              />
              <StatBox 
                label="Avg Winner" 
                value={`$${performanceStats.avgWin.toFixed(0)}`}
                color="text-green-400"
              />
              <StatBox 
                label="Avg Loser" 
                value={`$${performanceStats.avgLoss.toFixed(0)}`}
                color="text-red-400"
              />
            </div>

            {/* Total P&L highlight */}
            <div className={cn(
              'mt-4 p-4 rounded-lg text-center',
              isProfitable ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
            )}>
              <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Total P&L</div>
              <div className={cn(
                'text-3xl font-bold font-mono',
                isProfitable ? 'text-green-400' : 'text-red-400'
              )}>
                {formatCurrency(totalPnL)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
