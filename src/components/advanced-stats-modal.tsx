'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

interface Trade {
  id: number
  coin: string
  side: 'Long' | 'Short'
  size: number
  price: number
  trade_id: string
  timestamp: string
  realized_pnl: number | null
}

interface AssetStats {
  coin: string
  tradeCount: number
  pnl: number
  fees: number
  maxPnl: number
}

interface AdvancedStatsModalProps {
  isOpen: boolean
  onClose: () => void
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function formatDuration(ms: number | null): string {
  if (!ms) return '-'
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

function formatMoney(value: number, showSign = false): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(value))
  
  if (showSign && value !== 0) {
    return value >= 0 ? `+${formatted}` : `-${formatted}`
  }
  return value < 0 ? `-${formatted}` : formatted
}

export function AdvancedStatsModal({ isOpen, onClose }: AdvancedStatsModalProps) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchTrades()
    }
  }, [isOpen])

  async function fetchTrades() {
    setLoading(true)
    const { data, error } = await supabase
      .from('hyperliquid_trades')
      .select('*')
      .not('realized_pnl', 'is', null)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching trades:', error)
    } else {
      setTrades(data || [])
    }
    setLoading(false)
  }

  const stats = useMemo(() => {
    if (trades.length === 0) {
      return {
        totalPnl: 0,
        grossPnl: 0,
        totalFees: 0,
        longPnl: 0,
        shortPnl: 0,
        winRate: 0,
        winningCount: 0,
        totalCount: 0,
        assetStats: [] as AssetStats[],
        bestTrades: [] as Trade[],
        dateRange: { start: '', end: '' }
      }
    }

    // Using realized_pnl from the actual schema
    const grossPnl = trades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0)
    // Estimate fees at ~0.035% of notional (taker fee on Hyperliquid)
    const estimatedFees = trades.reduce((sum, t) => sum + (t.size * t.price * 0.00035), 0)
    const totalPnl = grossPnl - estimatedFees

    const longTrades = trades.filter(t => t.side === 'Long')
    const shortTrades = trades.filter(t => t.side === 'Short')
    
    const longPnl = longTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0)
    const shortPnl = shortTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0)

    const winningTrades = trades.filter(t => (t.realized_pnl || 0) > 0)
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0

    // Asset performance
    const assetMap = new Map<string, AssetStats>()
    for (const trade of trades) {
      const existing = assetMap.get(trade.coin) || {
        coin: trade.coin,
        tradeCount: 0,
        pnl: 0,
        fees: 0,
        maxPnl: 0
      }
      existing.tradeCount++
      const tradePnl = trade.realized_pnl || 0
      const tradeFees = trade.size * trade.price * 0.00035
      existing.pnl += tradePnl
      existing.fees += tradeFees
      if (tradePnl > existing.maxPnl) {
        existing.maxPnl = tradePnl
      }
      assetMap.set(trade.coin, existing)
    }
    
    const assetStats = Array.from(assetMap.values())
      .sort((a, b) => b.pnl - a.pnl)

    // Best trades (top 6 by PnL)
    const bestTrades = [...trades]
      .filter(t => (t.realized_pnl || 0) > 0)
      .sort((a, b) => (b.realized_pnl || 0) - (a.realized_pnl || 0))
      .slice(0, 6)

    // Date range (using timestamp)
    const dates = trades
      .map(t => t.timestamp)
      .filter((d): d is string => d !== null)
      .sort()
    
    const dateRange = {
      start: dates.length > 0 ? new Date(dates[0]).toLocaleDateString('en-GB') : '',
      end: dates.length > 0 ? new Date(dates[dates.length - 1]).toLocaleDateString('en-GB') : ''
    }

    return {
      totalPnl,
      grossPnl,
      totalFees: estimatedFees,
      longPnl,
      shortPnl,
      winRate,
      winningCount: winningTrades.length,
      totalCount: trades.length,
      assetStats,
      bestTrades,
      dateRange
    }
  }, [trades])

  if (!isOpen) return null

  const maxAssetPnl = Math.max(...stats.assetStats.map(a => Math.abs(a.pnl)), 1)
  const totalAbsPnl = Math.abs(stats.longPnl) + Math.abs(stats.shortPnl)
  const longPercent = totalAbsPnl > 0 ? (Math.abs(stats.longPnl) / totalAbsPnl) * 100 : 50

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-zinc-900 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-auto shadow-2xl border border-zinc-800">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Detailed Trading Statistics</h2>
            <p className="text-sm text-zinc-500">
              {stats.dateRange.start} - {stats.dateRange.end}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
            Loading trade data...
          </div>
        ) : trades.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            No closed trades found. Run the sync script to import trades.
          </div>
        ) : (
          <div className="p-6">
            {/* Main Grid: Stats + Sidebar */}
            <div className="flex gap-6">
              {/* Left: 2x2 Stats Grid */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                {/* Total PnL */}
                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                  <div className="text-sm text-zinc-500 mb-2">Total PnL</div>
                  <div className={`text-3xl font-bold ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatMoney(stats.totalPnl)}
                  </div>
                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Gross:</span>
                      <span className="text-zinc-300">{formatMoney(stats.grossPnl)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Fees:</span>
                      <span className="text-red-400">-{formatMoney(stats.totalFees)}</span>
                    </div>
                  </div>
                </div>

                {/* Position Split */}
                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                  <div className="text-sm text-zinc-500 mb-2">Position Split</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        <span className="text-zinc-400 text-sm">Long PnL</span>
                      </div>
                      <span className={stats.longPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {formatMoney(stats.longPnl, true)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                        <span className="text-zinc-400 text-sm">Short PnL</span>
                      </div>
                      <span className={stats.shortPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {formatMoney(stats.shortPnl, true)}
                      </span>
                    </div>
                  </div>
                  {/* Visual bar */}
                  <div className="mt-4">
                    <div className="h-2 bg-zinc-700 rounded-full overflow-hidden flex">
                      <div 
                        className={`${stats.longPnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${longPercent}%` }}
                      />
                      <div 
                        className={`${stats.shortPnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${100 - longPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-zinc-500">
                      <span>Long {formatMoney(stats.longPnl)}</span>
                      <span>Short {formatMoney(stats.shortPnl, true)}</span>
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                  <div className="text-sm text-zinc-500 mb-2">Performance</div>
                  <div className="text-3xl font-bold text-white">
                    Winrate: {stats.winRate.toFixed(2)}%
                  </div>
                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Winning:</span>
                      <span className="text-emerald-400">{stats.winningCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Total:</span>
                      <span className="text-zinc-300">{stats.totalCount}</span>
                    </div>
                  </div>
                </div>

                {/* Trade Volume */}
                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                  <div className="text-sm text-zinc-500 mb-2">Trade Summary</div>
                  <div className="text-3xl font-bold text-white">
                    {trades.length} trades
                  </div>
                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Long trades:</span>
                      <span className="text-zinc-300">
                        {trades.filter(t => t.side === 'Long').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Short trades:</span>
                      <span className="text-zinc-300">{trades.filter(t => t.side === 'Short').length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Performance by Asset */}
              <div className="w-72 bg-zinc-800/30 rounded-xl p-5 border border-zinc-700/50">
                <div className="text-sm font-medium text-white mb-4">Performance by Asset</div>
                <div className="space-y-4">
                  {stats.assetStats.map((asset) => (
                    <div key={asset.coin}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="font-medium text-white">{asset.coin}</span>
                          <span className="text-zinc-500 text-sm ml-2">{asset.tradeCount} trades</span>
                        </div>
                        <div className="text-right">
                          <span className={asset.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {formatMoney(asset.pnl)}
                          </span>
                          <span className="text-zinc-500 text-xs ml-2">
                            Fees: {formatMoney(asset.fees)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${asset.pnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, (Math.abs(asset.pnl) / maxAssetPnl) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Best Trades Section */}
            {stats.bestTrades.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-white mb-4">Best Trades</h3>
                <div className="grid grid-cols-2 gap-4">
                  {stats.bestTrades.map((trade) => (
                    <div 
                      key={trade.id}
                      className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{trade.coin}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            trade.side === 'Short' 
                              ? 'bg-red-500/20 text-red-400' 
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {trade.side}
                          </span>
                        </div>
                        <span className="text-emerald-400 font-medium">
                          {formatMoney(trade.realized_pnl || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-zinc-500">
                        <span>Size: {trade.size.toLocaleString()}</span>
                        <span>
                          {trade.timestamp 
                            ? new Date(trade.timestamp).toLocaleDateString('en-GB')
                            : '-'
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
