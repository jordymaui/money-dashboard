'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { HyperliquidFill } from '@/lib/hyperliquid'

interface HyperliquidAnalyticsProps {
  fills: HyperliquidFill[]
}

interface AssetStats {
  coin: string
  trades: number
  wins: number
  losses: number
  winRate: number
  totalPnL: number
}

interface DirectionStats {
  direction: 'LONG' | 'SHORT'
  trades: number
  wins: number
  losses: number
  winRate: number
  totalPnL: number
  avgPnL: number
}

interface DurationStats {
  label: string
  trades: number
  wins: number
  winRate: number
  totalPnL: number
}

interface OverallStats {
  profitFactor: number
  expectancy: number
  avgWinner: number
  avgLoser: number
  largestWin: number
  largestLoss: number
  totalTrades: number
  winRate: number
}

function formatCurrency(value: number, decimals = 0): string {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}$${Math.abs(value).toLocaleString(undefined, { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })}`
}

function calculateAnalytics(fills: HyperliquidFill[]) {
  // Filter to only closed trades (with P&L)
  const closedTrades = fills.filter(f => parseFloat(f.closedPnl) !== 0)
  
  // Asset breakdown
  const assetMap = new Map<string, { wins: number; losses: number; pnl: number; trades: number }>()
  
  closedTrades.forEach(fill => {
    const pnl = parseFloat(fill.closedPnl)
    const coin = fill.coin
    
    if (!assetMap.has(coin)) {
      assetMap.set(coin, { wins: 0, losses: 0, pnl: 0, trades: 0 })
    }
    
    const stats = assetMap.get(coin)!
    stats.trades++
    stats.pnl += pnl
    if (pnl > 0) stats.wins++
    else if (pnl < 0) stats.losses++
  })
  
  const assetStats: AssetStats[] = Array.from(assetMap.entries())
    .map(([coin, stats]) => ({
      coin,
      trades: stats.trades,
      wins: stats.wins,
      losses: stats.losses,
      winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
      totalPnL: stats.pnl
    }))
    .sort((a, b) => b.totalPnL - a.totalPnL)
    .slice(0, 10) // Top 10 assets
  
  // Direction breakdown - use dir field which contains "Open Long", "Close Long", "Open Short", "Close Short"
  // Only the dir field correctly identifies the position direction
  const longTrades = closedTrades.filter(f => f.dir?.includes('Long'))
  const shortTrades = closedTrades.filter(f => f.dir?.includes('Short'))
  
  const calcDirectionStats = (trades: HyperliquidFill[], direction: 'LONG' | 'SHORT'): DirectionStats => {
    const wins = trades.filter(t => parseFloat(t.closedPnl) > 0).length
    const losses = trades.filter(t => parseFloat(t.closedPnl) < 0).length
    const totalPnL = trades.reduce((sum, t) => sum + parseFloat(t.closedPnl), 0)
    
    return {
      direction,
      trades: trades.length,
      wins,
      losses,
      winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
      totalPnL,
      avgPnL: trades.length > 0 ? totalPnL / trades.length : 0
    }
  }
  
  const directionStats: DirectionStats[] = [
    calcDirectionStats(longTrades, 'LONG'),
    calcDirectionStats(shortTrades, 'SHORT')
  ]
  
  // Overall stats
  const allPnLs = closedTrades.map(t => parseFloat(t.closedPnl))
  const wins = allPnLs.filter(p => p > 0)
  const losses = allPnLs.filter(p => p < 0)
  
  const totalWins = wins.reduce((s, v) => s + v, 0)
  const totalLosses = Math.abs(losses.reduce((s, v) => s + v, 0))
  
  const overallStats: OverallStats = {
    totalTrades: closedTrades.length,
    winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
    profitFactor: totalLosses > 0 ? totalWins / totalLosses : (totalWins > 0 ? Infinity : 0),
    expectancy: closedTrades.length > 0 ? (totalWins - totalLosses) / closedTrades.length : 0,
    avgWinner: wins.length > 0 ? totalWins / wins.length : 0,
    avgLoser: losses.length > 0 ? totalLosses / losses.length : 0,
    largestWin: wins.length > 0 ? Math.max(...wins) : 0,
    largestLoss: losses.length > 0 ? Math.min(...allPnLs.filter(p => p < 0)) : 0
  }
  
  return { assetStats, directionStats, overallStats }
}

function AssetRow({ stats }: { stats: AssetStats }) {
  const isProfitable = stats.totalPnL >= 0
  
  return (
    <tr className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
      <td className="px-3 py-2.5">
        <span className="font-medium text-white">{stats.coin}</span>
      </td>
      <td className="px-3 py-2.5 text-center font-mono text-zinc-300">{stats.trades}</td>
      <td className="px-3 py-2.5 text-center">
        <span className="text-green-400">{stats.wins}</span>
        <span className="text-zinc-600 mx-1">/</span>
        <span className="text-red-400">{stats.losses}</span>
      </td>
      <td className="px-3 py-2.5 text-center">
        <span className={cn('font-mono', stats.winRate >= 50 ? 'text-green-400' : 'text-red-400')}>
          {stats.winRate.toFixed(0)}%
        </span>
      </td>
      <td className="px-3 py-2.5 text-right">
        <span className={cn('font-mono font-medium', isProfitable ? 'text-green-400' : 'text-red-400')}>
          {formatCurrency(stats.totalPnL)}
        </span>
      </td>
    </tr>
  )
}

function DirectionCard({ stats }: { stats: DirectionStats }) {
  const isProfitable = stats.totalPnL >= 0
  const isLong = stats.direction === 'LONG'
  
  return (
    <div className={cn(
      'p-4 rounded-lg border',
      isLong ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn('font-bold text-lg', isLong ? 'text-green-400' : 'text-red-400')}>
          {stats.direction}
        </span>
        <span className={cn('font-mono font-medium', isProfitable ? 'text-green-400' : 'text-red-400')}>
          {formatCurrency(stats.totalPnL)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-zinc-500">Trades:</span>
          <span className="ml-2 text-white font-mono">{stats.trades}</span>
        </div>
        <div>
          <span className="text-zinc-500">Win %:</span>
          <span className={cn('ml-2 font-mono', stats.winRate >= 50 ? 'text-green-400' : 'text-red-400')}>
            {stats.winRate.toFixed(0)}%
          </span>
        </div>
        <div className="col-span-2">
          <span className="text-zinc-500">Avg P&L:</span>
          <span className={cn('ml-2 font-mono', stats.avgPnL >= 0 ? 'text-green-400' : 'text-red-400')}>
            {formatCurrency(stats.avgPnL, 2)}
          </span>
        </div>
      </div>
    </div>
  )
}

function StatItem({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-zinc-500 text-sm">{label}</span>
      <span className={cn('font-mono', color)}>{value}</span>
    </div>
  )
}

export function HyperliquidAnalytics({ fills }: HyperliquidAnalyticsProps) {
  const { assetStats, directionStats, overallStats } = useMemo(
    () => calculateAnalytics(fills),
    [fills]
  )
  
  if (overallStats.totalTrades === 0) {
    return null
  }

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden mt-6">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-chart-line text-emerald-400"></i>
          <h3 className="font-medium text-white">Trading Analytics</h3>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Performance by Asset */}
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Performance by Asset</div>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-zinc-500 uppercase">
                  <th className="px-3 py-2 text-left">Coin</th>
                  <th className="px-3 py-2 text-center">Trades</th>
                  <th className="px-3 py-2 text-center">W/L</th>
                  <th className="px-3 py-2 text-center">Win %</th>
                  <th className="px-3 py-2 text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody>
                {assetStats.slice(0, 8).map((stats) => (
                  <AssetRow key={stats.coin} stats={stats} />
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {assetStats.slice(0, 6).map((stats) => (
              <div key={stats.coin} className="bg-zinc-800/30 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{stats.coin}</div>
                  <div className="text-xs text-zinc-500">
                    {stats.trades} trades · 
                    <span className="text-green-400 ml-1">{stats.wins}W</span>
                    <span className="mx-0.5">/</span>
                    <span className="text-red-400">{stats.losses}L</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn('font-mono font-medium', stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400')}>
                    {formatCurrency(stats.totalPnL)}
                  </div>
                  <div className={cn('text-xs', stats.winRate >= 50 ? 'text-green-400/70' : 'text-red-400/70')}>
                    {stats.winRate.toFixed(0)}% win
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Direction Analysis */}
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Direction Analysis</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {directionStats.map((stats) => (
              <DirectionCard key={stats.direction} stats={stats} />
            ))}
          </div>
        </div>

        {/* Key Stats */}
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Key Stats</div>
          <div className="bg-zinc-800/30 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
              <StatItem 
                label="Profit Factor" 
                value={overallStats.profitFactor === Infinity ? '∞' : overallStats.profitFactor.toFixed(2)}
                color={overallStats.profitFactor >= 1 ? 'text-green-400' : 'text-red-400'}
              />
              <StatItem 
                label="Expectancy" 
                value={formatCurrency(overallStats.expectancy, 2) + '/trade'}
                color={overallStats.expectancy >= 0 ? 'text-green-400' : 'text-red-400'}
              />
              <StatItem 
                label="Avg Winner" 
                value={`$${overallStats.avgWinner.toFixed(0)}`}
                color="text-green-400"
              />
              <StatItem 
                label="Avg Loser" 
                value={`$${overallStats.avgLoser.toFixed(0)}`}
                color="text-red-400"
              />
              <StatItem 
                label="Largest Win" 
                value={formatCurrency(overallStats.largestWin)}
                color="text-green-400"
              />
              <StatItem 
                label="Largest Loss" 
                value={formatCurrency(overallStats.largestLoss)}
                color="text-red-400"
              />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
