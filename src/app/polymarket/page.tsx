'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PolymarketPosition, PolymarketTrade } from '@/types'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type TimePeriod = '1D' | '1W' | '1M' | 'ALL'
type TabType = 'positions' | 'orders' | 'history'

function formatCurrency(value: number, decimals = 2): string {
  return `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

function formatPercent(value: number): string {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${value.toFixed(2)}%`
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const months = Math.floor(diff / 2592000000)
  
  if (months > 0) return `in ${months} mo`
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'just now'
}

// Portfolio Value Chart Component (Area Chart)
function PortfolioChart({ 
  data, 
  height = 120 
}: { 
  data: { timestamp: number; value: number }[]
  height?: number
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        <span>Chart data loading...</span>
      </div>
    )
  }

  const minValue = Math.min(...data.map(d => d.value))
  const maxValue = Math.max(...data.map(d => d.value))
  const range = maxValue - minValue || 1
  
  const width = 400
  const padding = 10
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  
  // Generate SVG path for the line
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((d.value - minValue) / range) * chartHeight
    return `${x},${y}`
  })
  
  const linePath = `M${points.join(' L')}`
  const areaPath = `${linePath} L${padding + chartWidth},${padding + chartHeight} L${padding},${padding + chartHeight} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGradient)" />
      <path d={linePath} fill="none" stroke="rgb(59, 130, 246)" strokeWidth="2" />
    </svg>
  )
}

// History Row Component
function HistoryRow({ trade, position }: { trade: PolymarketTrade; position?: PolymarketPosition }) {
  const isLoss = trade.side === 'SELL' || (position && (position.cur_price === 0 || position.redeemable))
  const isBuy = trade.side === 'BUY'
  const value = trade.size * trade.price
  
  // Determine activity type based on trade data
  const getActivityType = () => {
    if (trade.side === 'BUY') return 'Bought'
    if (trade.side === 'SELL') return 'Sold'
    if (position?.redeemable && position.cur_price === 0) return 'Lost'
    if (position?.redeemable && position.cur_price === 1) return 'Won'
    return 'Trade'
  }
  
  const activity = getActivityType()
  const isPositive = activity === 'Won' || activity === 'Bought'
  
  return (
    <tr className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {activity === 'Lost' || activity === 'Sold' ? (
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-400 text-sm font-bold">×</span>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400 text-sm font-bold">+</span>
            </div>
          )}
          <span className={cn(
            'font-medium',
            activity === 'Lost' || activity === 'Sold' ? 'text-red-400' : 'text-green-400'
          )}>
            {activity}
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          {position?.icon && (
            <img 
              src={position.icon} 
              alt="" 
              className="w-8 h-8 rounded-full object-cover bg-zinc-800"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          {!position?.icon && (
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
              <span className="text-xs text-zinc-400">?</span>
            </div>
          )}
          <div>
            <div className="text-white text-sm font-medium max-w-xs truncate">
              {trade.title || 'Unknown Market'}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={cn(
                'px-1.5 py-0.5 rounded',
                trade.outcome?.toLowerCase() === 'yes' 
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-red-500/20 text-red-400'
              )}>
                {trade.outcome || 'N/A'}
              </span>
              <span className="text-zinc-500">
                {trade.price?.toFixed(2)}¢ · {trade.size?.toLocaleString()} shares
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <span className={cn(
          'font-mono',
          activity === 'Lost' || activity === 'Sold' ? 'text-red-400' : 'text-zinc-300'
        )}>
          {activity === 'Lost' ? '-' : ''}{formatCurrency(value)}
        </span>
      </td>
      <td className="px-4 py-4 text-right text-zinc-500 text-sm">
        {formatTimeAgo(trade.timestamp)}
      </td>
    </tr>
  )
}

// Positions Table Component
function PositionsTable({ positions }: { positions: PolymarketPosition[] }) {
  const openPositions = positions.filter(p => !p.redeemable && p.current_value > 0)
  
  if (openPositions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
        <i className="fa-solid fa-inbox text-4xl mb-4 opacity-30"></i>
        <p>No open positions</p>
      </div>
    )
  }
  
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-zinc-800/50 text-zinc-500 text-xs uppercase">
          <th className="px-4 py-3 text-left">Market</th>
          <th className="px-4 py-3 text-left">Outcome</th>
          <th className="px-4 py-3 text-right">Shares</th>
          <th className="px-4 py-3 text-right">Avg Price</th>
          <th className="px-4 py-3 text-right">Current</th>
          <th className="px-4 py-3 text-right">Value</th>
          <th className="px-4 py-3 text-right">PnL</th>
        </tr>
      </thead>
      <tbody>
        {openPositions.map((pos) => (
          <tr key={pos.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                {pos.icon && (
                  <img 
                    src={pos.icon} 
                    alt="" 
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <span className="text-white text-sm max-w-xs truncate">
                  {pos.title || 'Unknown Market'}
                </span>
              </div>
            </td>
            <td className="px-4 py-3">
              <span className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                pos.outcome?.toLowerCase() === 'yes' 
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-red-500/20 text-red-400'
              )}>
                {pos.outcome || 'N/A'}
              </span>
            </td>
            <td className="px-4 py-3 text-right font-mono text-white">
              {pos.size?.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </td>
            <td className="px-4 py-3 text-right font-mono text-zinc-400">
              {((pos.avg_price || 0) * 100).toFixed(0)}¢
            </td>
            <td className="px-4 py-3 text-right font-mono text-white">
              {((pos.cur_price || 0) * 100).toFixed(0)}¢
            </td>
            <td className="px-4 py-3 text-right font-mono text-white">
              {formatCurrency(pos.current_value || 0)}
            </td>
            <td className="px-4 py-3 text-right">
              <span className={cn(
                'font-mono',
                (pos.cash_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {(pos.cash_pnl || 0) >= 0 ? '+' : ''}{formatCurrency(pos.cash_pnl || 0)}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function PolymarketPage() {
  const [positions, setPositions] = useState<PolymarketPosition[]>([])
  const [trades, setTrades] = useState<PolymarketTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('ALL')
  const [activeTab, setActiveTab] = useState<TabType>('positions')

  useEffect(() => {
    async function fetchData() {
      try {
        const [positionsRes, tradesRes] = await Promise.all([
          supabase.from('polymarket_positions').select('*').order('current_value', { ascending: false }),
          supabase.from('polymarket_trades').select('*').order('timestamp', { ascending: false })
        ])
        
        if (positionsRes.data) setPositions(positionsRes.data)
        if (tradesRes.data) setTrades(tradesRes.data)
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Calculate portfolio stats
  const openPositions = positions.filter(p => !p.redeemable && p.current_value > 0)
  const totalPortfolioValue = openPositions.reduce((sum, p) => sum + (p.current_value || 0), 0)
  const totalPnL = positions.reduce((sum, p) => sum + (p.cash_pnl || 0), 0)
  
  // Calculate today's change (mock for now - would need daily snapshots)
  const todayChange = 0 // Placeholder
  const todayChangePercent = totalPortfolioValue > 0 ? (todayChange / totalPortfolioValue) * 100 : 0

  // Build portfolio history from trades
  const buildPortfolioHistory = () => {
    if (trades.length === 0) return []
    
    // Sort trades by timestamp ascending
    const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp)
    
    // Calculate running portfolio value
    let runningValue = 0
    const history: { timestamp: number; value: number }[] = []
    
    const now = Date.now()
    const periodMs = {
      '1D': 24 * 60 * 60 * 1000,
      '1W': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000,
      'ALL': now
    }
    
    const cutoff = now - periodMs[timePeriod]
    
    for (const trade of sortedTrades) {
      const value = trade.size * trade.price
      if (trade.side === 'BUY') {
        runningValue += value
      } else {
        runningValue -= value
      }
      
      if (trade.timestamp >= cutoff) {
        history.push({
          timestamp: trade.timestamp,
          value: Math.max(0, runningValue)
        })
      }
    }
    
    // Add current portfolio value as last point
    if (history.length > 0) {
      history.push({
        timestamp: now,
        value: totalPortfolioValue
      })
    }
    
    return history
  }

  const chartData = buildPortfolioHistory()

  // Filter trades by time period for history tab
  const getFilteredTrades = () => {
    const now = Date.now()
    const periodMs = {
      '1D': 24 * 60 * 60 * 1000,
      '1W': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000,
      'ALL': now
    }
    
    const cutoff = now - periodMs[timePeriod]
    return trades.filter(t => t.timestamp >= cutoff)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-full text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <i className="fa-solid fa-arrow-left"></i> Back
        </Link>
        <a 
          href="https://polymarket.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors"
        >
          <i className="fa-solid fa-external-link"></i> Trade
        </a>
      </div>

      {/* Portfolio Summary Section */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Portfolio Value */}
          <div className="lg:w-1/3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-zinc-400 text-sm">Portfolio</span>
              <i className="fa-solid fa-external-link text-zinc-600 text-xs"></i>
              <span className="ml-auto bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                {formatCurrency(0.18)}
              </span>
            </div>
            
            <div className="text-5xl font-bold text-white mb-2 tracking-tight">
              {formatCurrency(totalPortfolioValue)}
            </div>
            
            <div className={cn(
              'text-sm mb-6',
              todayChange >= 0 ? 'text-green-400' : 'text-red-400'
            )}>
              {todayChange >= 0 ? '+' : ''}{formatCurrency(todayChange)} ({formatPercent(todayChangePercent)}) Today
            </div>
            
            {/* Deposit/Withdraw Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white font-medium transition-colors">
                <i className="fa-solid fa-arrow-down"></i>
                Deposit
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-zinc-700 hover:bg-zinc-800 rounded-full text-white font-medium transition-colors">
                <i className="fa-solid fa-arrow-up"></i>
                Withdraw
              </button>
            </div>
          </div>

          {/* Right Side - Profit/Loss Chart */}
          <div className="lg:w-2/3">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-red-400">❤️</span>
                  <span className="text-zinc-400 text-sm">Profit/Loss</span>
                  <i className="fa-solid fa-circle-info text-zinc-600 text-xs"></i>
                </div>
                <div className={cn(
                  'text-4xl font-bold tracking-tight',
                  totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  {totalPnL >= 0 ? '+' : '-'}{formatCurrency(Math.abs(totalPnL))}
                </div>
                <div className="text-zinc-500 text-sm mt-1">All-Time</div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Time Period Toggles */}
                <div className="flex bg-zinc-800 rounded-lg p-1">
                  {(['1D', '1W', '1M', 'ALL'] as TimePeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => setTimePeriod(period)}
                      className={cn(
                        'px-3 py-1 text-sm font-medium rounded transition-colors',
                        timePeriod === period
                          ? 'bg-zinc-700 text-white'
                          : 'text-zinc-500 hover:text-zinc-300'
                      )}
                    >
                      {period}
                    </button>
                  ))}
                </div>
                
                {/* Polymarket Logo */}
                <div className="flex items-center gap-1 text-zinc-500 ml-4">
                  <i className="fa-solid fa-chart-line"></i>
                  <span className="text-sm font-medium">Polymarket</span>
                </div>
              </div>
            </div>
            
            {/* Chart */}
            <div className="h-32">
              <PortfolioChart data={chartData} height={120} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-zinc-800/50">
          <button
            onClick={() => setActiveTab('positions')}
            className={cn(
              'px-6 py-4 text-sm font-medium border-b-2 -mb-[1px] transition-colors',
              activeTab === 'positions'
                ? 'text-white border-white'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            )}
          >
            Positions
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={cn(
              'px-6 py-4 text-sm font-medium border-b-2 -mb-[1px] transition-colors',
              activeTab === 'orders'
                ? 'text-white border-white'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            )}
          >
            Open orders
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'px-6 py-4 text-sm font-medium border-b-2 -mb-[1px] transition-colors',
              activeTab === 'history'
                ? 'text-white border-white'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            )}
          >
            History
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-x-auto">
          {activeTab === 'positions' && (
            <PositionsTable positions={positions} />
          )}
          
          {activeTab === 'orders' && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <i className="fa-solid fa-clock text-4xl mb-4 opacity-30"></i>
              <p className="text-lg">No open orders</p>
              <p className="text-sm text-zinc-600 mt-1">Your limit orders will appear here</p>
            </div>
          )}
          
          {activeTab === 'history' && (
            <>
              {/* History Controls */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search"
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 pl-9 text-sm text-white placeholder-zinc-500 w-64 focus:outline-none focus:border-zinc-600"
                    />
                    <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"></i>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
                    <i className="fa-solid fa-filter"></i>
                    All
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
                    <i className="fa-solid fa-sort"></i>
                    Newest
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
                    <i className="fa-solid fa-calendar"></i>
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
                    <i className="fa-solid fa-download"></i>
                    Export
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
                    <i className="fa-solid fa-box"></i>
                    Close Losses
                  </button>
                </div>
              </div>
              
              {/* History Table */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800/50 text-zinc-500 text-xs uppercase">
                    <th className="px-4 py-3 text-left">Activity</th>
                    <th className="px-4 py-3 text-left">Market</th>
                    <th className="px-4 py-3 text-right">Value</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredTrades().length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                        <i className="fa-solid fa-inbox text-3xl mb-3 opacity-30 block"></i>
                        No trade history for this period
                      </td>
                    </tr>
                  ) : (
                    getFilteredTrades().map((trade) => {
                      const position = positions.find(p => p.asset === trade.asset || p.condition_id === trade.condition_id)
                      return (
                        <HistoryRow 
                          key={trade.id} 
                          trade={trade} 
                          position={position}
                        />
                      )
                    })
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* Data Info Footer */}
      <div className="mt-4 text-xs text-zinc-600 text-right">
        <i className="fa-solid fa-clock-rotate-left mr-1"></i>
        {positions.length > 0 
          ? `${openPositions.length} open positions • ${trades.length} trades • Last synced: ${new Date(positions[0]?.updated_at || Date.now()).toLocaleString()}`
          : 'No data - run polymarket-sync.js to import positions'}
      </div>

      {/* Setup Notice */}
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
