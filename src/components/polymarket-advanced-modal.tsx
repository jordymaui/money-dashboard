'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PolymarketPosition, PolymarketTrade } from '@/types'

interface PolymarketAdvancedModalProps {
  isOpen: boolean
  onClose: () => void
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

export function PolymarketAdvancedModal({ isOpen, onClose }: PolymarketAdvancedModalProps) {
  const [positions, setPositions] = useState<PolymarketPosition[]>([])
  const [trades, setTrades] = useState<PolymarketTrade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  async function fetchData() {
    setLoading(true)
    
    const [positionsRes, tradesRes] = await Promise.all([
      supabase.from('polymarket_positions').select('*'),
      supabase.from('polymarket_trades').select('*').order('timestamp', { ascending: false })
    ])

    if (positionsRes.error) console.error('Error fetching positions:', positionsRes.error)
    if (tradesRes.error) console.error('Error fetching trades:', tradesRes.error)
    
    setPositions(positionsRes.data || [])
    setTrades(tradesRes.data || [])
    setLoading(false)
  }

  const stats = useMemo(() => {
    if (positions.length === 0) {
      return {
        totalPnl: 0,
        totalInitialValue: 0,
        totalCurrentValue: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        categoryStats: [] as { category: string; pnl: number; count: number }[],
        bestBets: [] as PolymarketPosition[],
        worstBets: [] as PolymarketPosition[],
        openPositions: 0,
        resolvedPositions: 0,
        redeemableValue: 0
      }
    }

    const totalPnl = positions.reduce((sum, p) => sum + (p.cash_pnl || 0), 0)
    const totalInitialValue = positions.reduce((sum, p) => sum + (p.initial_value || 0), 0)
    const totalCurrentValue = positions.reduce((sum, p) => sum + (p.current_value || 0), 0)
    
    // Win/Loss based on resolved positions
    const resolved = positions.filter(p => p.redeemable || p.cur_price === 0 || p.cur_price === 1)
    const wins = resolved.filter(p => (p.cash_pnl || 0) > 0)
    const losses = resolved.filter(p => (p.cash_pnl || 0) < 0)
    const winRate = resolved.length > 0 ? (wins.length / resolved.length) * 100 : 0

    // Category breakdown
    const categoryMap = new Map<string, { pnl: number; count: number }>()
    for (const pos of positions) {
      const category = categorizePosition(pos.title, pos.event_slug)
      const existing = categoryMap.get(category) || { pnl: 0, count: 0 }
      existing.pnl += pos.cash_pnl || 0
      existing.count++
      categoryMap.set(category, existing)
    }
    const categoryStats = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.pnl - a.pnl)

    // Best and worst bets
    const sortedByPnl = [...positions].sort((a, b) => (b.cash_pnl || 0) - (a.cash_pnl || 0))
    const bestBets = sortedByPnl.filter(p => (p.cash_pnl || 0) > 0).slice(0, 5)
    const worstBets = sortedByPnl.filter(p => (p.cash_pnl || 0) < 0).slice(-5).reverse()

    const openPositions = positions.filter(p => !p.redeemable && p.current_value > 0).length
    const resolvedPositions = positions.filter(p => p.redeemable).length
    const redeemableValue = positions
      .filter(p => p.redeemable && p.current_value > 0)
      .reduce((sum, p) => sum + p.current_value, 0)

    return {
      totalPnl,
      totalInitialValue,
      totalCurrentValue,
      winCount: wins.length,
      lossCount: losses.length,
      winRate,
      categoryStats,
      bestBets,
      worstBets,
      openPositions,
      resolvedPositions,
      redeemableValue
    }
  }, [positions])

  if (!isOpen) return null

  const maxCategoryPnl = Math.max(...stats.categoryStats.map(c => Math.abs(c.pnl)), 1)

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
            <h2 className="text-xl font-semibold text-white">Polymarket Detailed Stats</h2>
            <p className="text-sm text-zinc-500">
              {positions.length} positions • {trades.length} trades
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
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            Loading prediction data...
          </div>
        ) : positions.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            No positions found. Run the sync script to import data.
          </div>
        ) : (
          <div className="p-6">
            {/* Main Grid */}
            <div className="flex gap-6">
              {/* Left: Stats Grid */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                {/* Total PnL */}
                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                  <div className="text-sm text-zinc-500 mb-2">Total PnL</div>
                  <div className={`text-3xl font-bold ${stats.totalPnl >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    {formatMoney(stats.totalPnl)}
                  </div>
                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Total Invested:</span>
                      <span className="text-zinc-300">{formatMoney(stats.totalInitialValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Current Value:</span>
                      <span className="text-zinc-300">{formatMoney(stats.totalCurrentValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">ROI:</span>
                      <span className={stats.totalPnl >= 0 ? 'text-blue-400' : 'text-red-400'}>
                        {stats.totalInitialValue > 0 
                          ? `${((stats.totalPnl / stats.totalInitialValue) * 100).toFixed(1)}%`
                          : '0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Win Rate */}
                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                  <div className="text-sm text-zinc-500 mb-2">Win Rate (Resolved)</div>
                  <div className="text-3xl font-bold text-white">
                    {stats.winRate.toFixed(1)}%
                  </div>
                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Wins:</span>
                      <span className="text-blue-400">{stats.winCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Losses:</span>
                      <span className="text-red-400">{stats.lossCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Open:</span>
                      <span className="text-zinc-300">{stats.openPositions}</span>
                    </div>
                  </div>
                </div>

                {/* Position Status */}
                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                  <div className="text-sm text-zinc-500 mb-2">Position Status</div>
                  <div className="text-3xl font-bold text-white">
                    {stats.openPositions} Open
                  </div>
                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Resolved:</span>
                      <span className="text-zinc-300">{stats.resolvedPositions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Redeemable:</span>
                      <span className="text-blue-400">{formatMoney(stats.redeemableValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Total Positions:</span>
                      <span className="text-zinc-300">{positions.length}</span>
                    </div>
                  </div>
                </div>

                {/* Trade Activity */}
                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
                  <div className="text-sm text-zinc-500 mb-2">Trade Activity</div>
                  <div className="text-3xl font-bold text-white">
                    {trades.length} Trades
                  </div>
                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Buys:</span>
                      <span className="text-blue-400">{trades.filter(t => t.side === 'BUY').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Sells:</span>
                      <span className="text-red-400">{trades.filter(t => t.side === 'SELL').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Unique Markets:</span>
                      <span className="text-zinc-300">
                        {new Set(trades.map(t => t.condition_id)).size}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Category Performance */}
              <div className="w-72 bg-zinc-800/30 rounded-xl p-5 border border-zinc-700/50">
                <div className="text-sm font-medium text-white mb-4">Performance by Category</div>
                <div className="space-y-4">
                  {stats.categoryStats.map((cat) => (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="font-medium text-white">{cat.category}</span>
                          <span className="text-zinc-500 text-sm ml-2">{cat.count} bets</span>
                        </div>
                        <span className={cat.pnl >= 0 ? 'text-blue-400' : 'text-red-400'}>
                          {formatMoney(cat.pnl)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${cat.pnl >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, (Math.abs(cat.pnl) / maxCategoryPnl) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Best & Worst Bets */}
            <div className="mt-6 grid grid-cols-2 gap-6">
              {/* Best Bets */}
              <div>
                <h3 className="text-sm font-medium text-white mb-4">
                  <i className="fa-solid fa-trophy text-yellow-400 mr-2"></i>
                  Best Bets
                </h3>
                <div className="space-y-2">
                  {stats.bestBets.map((pos) => (
                    <div 
                      key={pos.id}
                      className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{pos.title}</div>
                          <div className="text-xs text-zinc-500">{pos.outcome}</div>
                        </div>
                        <span className="text-blue-400 font-medium ml-2">
                          +{formatMoney(pos.cash_pnl)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {stats.bestBets.length === 0 && (
                    <div className="text-zinc-500 text-sm">No winning bets yet</div>
                  )}
                </div>
              </div>

              {/* Worst Bets */}
              <div>
                <h3 className="text-sm font-medium text-white mb-4">
                  <i className="fa-solid fa-skull text-red-400 mr-2"></i>
                  Worst Bets
                </h3>
                <div className="space-y-2">
                  {stats.worstBets.map((pos) => (
                    <div 
                      key={pos.id}
                      className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{pos.title}</div>
                          <div className="text-xs text-zinc-500">{pos.outcome}</div>
                        </div>
                        <span className="text-red-400 font-medium ml-2">
                          {formatMoney(pos.cash_pnl)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {stats.worstBets.length === 0 && (
                    <div className="text-zinc-500 text-sm">No losing bets yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
