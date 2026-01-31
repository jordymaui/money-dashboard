'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PolymarketPosition, PolymarketClosedPosition, PolymarketActivity } from '@/types'
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
  const tsMs = timestamp < 1e12 ? timestamp * 1000 : timestamp
  const diff = now - tsMs
  
  if (diff < 0) {
    // Future date
    const absDiff = Math.abs(diff)
    const months = Math.floor(absDiff / 2592000000)
    const days = Math.floor(absDiff / 86400000)
    if (months > 0) return `in ${months} mo`
    if (days > 0) return `in ${days}d`
    return 'soon'
  }
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const months = Math.floor(diff / 2592000000)
  
  if (months > 0) return `${months} mo ago`
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

// Portfolio Value Chart Component (Area Chart)
function PortfolioChart({ 
  data, 
  height = 120,
  color = 'rgb(59, 130, 246)'
}: { 
  data: { timestamp: number; value: number }[]
  height?: number
  color?: string
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        <span>Calculating history...</span>
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

  // Determine gradient color based on P&L
  const isPositive = data[data.length - 1]?.value >= 0

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGradient)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  )
}

// Activity/History Row Component
function ActivityRow({ activity }: { activity: PolymarketActivity }) {
  const isBuy = activity.side === 'BUY'
  const isSell = activity.side === 'SELL'
  
  const getActivityLabel = () => {
    if (activity.type === 'TRADE') {
      return isBuy ? 'Bought' : 'Sold'
    }
    return activity.type || 'Trade'
  }
  
  const label = getActivityLabel()
  const isPositive = isBuy
  
  return (
    <tr className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {isPositive ? (
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400 text-sm font-bold">+</span>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-400 text-sm font-bold">−</span>
            </div>
          )}
          <span className={cn(
            'font-medium',
            isPositive ? 'text-green-400' : 'text-red-400'
          )}>
            {label}
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          {activity.icon ? (
            <img 
              src={activity.icon} 
              alt="" 
              className="w-8 h-8 rounded-full object-cover bg-zinc-800"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
              <span className="text-xs text-zinc-400">?</span>
            </div>
          )}
          <div>
            <div className="text-white text-sm font-medium max-w-sm truncate">
              {activity.title || 'Unknown Market'}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={cn(
                'px-1.5 py-0.5 rounded',
                activity.outcome?.toLowerCase() === 'yes' 
                  ? 'bg-blue-500/20 text-blue-400'
                  : activity.outcome?.toLowerCase() === 'no'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-zinc-700 text-zinc-300'
              )}>
                {activity.outcome || 'N/A'}
              </span>
              <span className="text-zinc-500">
                {(activity.price * 100).toFixed(0)}¢ · {activity.size?.toLocaleString(undefined, { maximumFractionDigits: 1 })} shares
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <span className={cn(
          'font-mono',
          isPositive ? 'text-zinc-300' : 'text-red-400'
        )}>
          {isSell ? '-' : ''}{formatCurrency(activity.usdc_size || activity.size * activity.price)}
        </span>
      </td>
      <td className="px-4 py-4 text-right text-zinc-500 text-sm">
        {formatTimeAgo(activity.timestamp)}
      </td>
    </tr>
  )
}

// Closed Position Row for History
function ClosedPositionRow({ position }: { position: PolymarketClosedPosition }) {
  const isWin = position.realized_pnl > 0
  const isLoss = position.realized_pnl < 0
  
  return (
    <tr className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {isWin ? (
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400 text-sm">✓</span>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-400 text-sm font-bold">×</span>
            </div>
          )}
          <span className={cn(
            'font-medium',
            isWin ? 'text-green-400' : 'text-red-400'
          )}>
            {isWin ? 'Won' : 'Lost'}
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          {position.icon ? (
            <img 
              src={position.icon} 
              alt="" 
              className="w-8 h-8 rounded-full object-cover bg-zinc-800"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
              <span className="text-xs text-zinc-400">?</span>
            </div>
          )}
          <div>
            <div className="text-white text-sm font-medium max-w-sm truncate">
              {position.title || 'Unknown Market'}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={cn(
                'px-1.5 py-0.5 rounded',
                position.outcome?.toLowerCase() === 'yes' 
                  ? 'bg-blue-500/20 text-blue-400'
                  : position.outcome?.toLowerCase() === 'no'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-zinc-700 text-zinc-300'
              )}>
                {position.outcome || 'N/A'}
              </span>
              <span className="text-zinc-500">
                {(position.avg_price * 100).toFixed(0)}¢ avg · {formatCurrency(position.total_bought)} invested
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <span className={cn(
          'font-mono font-medium',
          isWin ? 'text-green-400' : 'text-red-400'
        )}>
          {isWin ? '+' : ''}{formatCurrency(position.realized_pnl)}
        </span>
      </td>
      <td className="px-4 py-4 text-right text-zinc-500 text-sm">
        {formatTimeAgo(position.timestamp)}
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
                  : pos.outcome?.toLowerCase() === 'no'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-zinc-700 text-zinc-300'
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
  const [closedPositions, setClosedPositions] = useState<PolymarketClosedPosition[]>([])
  const [activity, setActivity] = useState<PolymarketActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('ALL')
  const [activeTab, setActiveTab] = useState<TabType>('positions')
  const [historyView, setHistoryView] = useState<'all' | 'activity' | 'closed'>('all')

  useEffect(() => {
    async function fetchData() {
      try {
        const [positionsRes, closedRes, activityRes] = await Promise.all([
          supabase.from('polymarket_positions').select('*').order('current_value', { ascending: false }),
          supabase.from('polymarket_closed_positions').select('*').order('timestamp', { ascending: false }),
          supabase.from('polymarket_activity').select('*').order('timestamp', { ascending: false })
        ])
        
        if (positionsRes.data) setPositions(positionsRes.data)
        if (closedRes.data) setClosedPositions(closedRes.data)
        if (activityRes.data) setActivity(activityRes.data)
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
  
  // P&L Calculation: Realized (closed) + Unrealized (open)
  const realizedPnL = closedPositions.reduce((sum, p) => sum + (p.realized_pnl || 0), 0)
  const unrealizedPnL = positions.reduce((sum, p) => sum + (p.cash_pnl || 0), 0)
  const totalPnL = realizedPnL + unrealizedPnL
  
  // Calculate today's change from recent activity
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const todayActivity = activity.filter(a => {
    const ts = a.timestamp < 1e12 ? a.timestamp * 1000 : a.timestamp
    return ts >= oneDayAgo
  })
  const todayChange = todayActivity.reduce((sum, a) => {
    const value = a.usdc_size || (a.size * a.price)
    return sum + (a.side === 'BUY' ? -value : value)
  }, 0)
  const todayChangePercent = totalPortfolioValue > 0 ? (todayChange / totalPortfolioValue) * 100 : 0

  // Build P&L history from closed positions
  const buildPnLHistory = () => {
    const periodMs = {
      '1D': 24 * 60 * 60 * 1000,
      '1W': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000,
      'ALL': Date.now()
    }
    
    const now = Date.now()
    const cutoff = now - periodMs[timePeriod]
    
    // Sort closed positions by timestamp
    const sorted = [...closedPositions]
      .filter(p => {
        const ts = p.timestamp < 1e12 ? p.timestamp * 1000 : p.timestamp
        return ts >= cutoff
      })
      .sort((a, b) => a.timestamp - b.timestamp)
    
    if (sorted.length === 0) {
      return [
        { timestamp: cutoff, value: 0 },
        { timestamp: now, value: totalPnL }
      ]
    }
    
    // Calculate running P&L
    let runningPnL = 0
    const history: { timestamp: number; value: number }[] = []
    
    for (const pos of sorted) {
      runningPnL += pos.realized_pnl || 0
      const ts = pos.timestamp < 1e12 ? pos.timestamp * 1000 : pos.timestamp
      history.push({
        timestamp: ts,
        value: runningPnL
      })
    }
    
    // Add current total as last point
    history.push({
      timestamp: now,
      value: totalPnL
    })
    
    return history
  }

  const chartData = buildPnLHistory()

  // Filter history by time period
  const getFilteredHistory = () => {
    const now = Date.now()
    const periodMs = {
      '1D': 24 * 60 * 60 * 1000,
      '1W': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000,
      'ALL': now
    }
    
    const cutoff = now - periodMs[timePeriod]
    
    // Combine and sort
    type HistoryItem = { type: 'activity'; data: PolymarketActivity } | { type: 'closed'; data: PolymarketClosedPosition }
    
    const items: HistoryItem[] = []
    
    if (historyView === 'all' || historyView === 'activity') {
      activity.forEach(a => {
        const ts = a.timestamp < 1e12 ? a.timestamp * 1000 : a.timestamp
        if (ts >= cutoff) items.push({ type: 'activity', data: a })
      })
    }
    
    if (historyView === 'all' || historyView === 'closed') {
      closedPositions.forEach(p => {
        const ts = p.timestamp < 1e12 ? p.timestamp * 1000 : p.timestamp
        if (ts >= cutoff) items.push({ type: 'closed', data: p })
      })
    }
    
    // Sort by timestamp descending
    items.sort((a, b) => {
      const tsA = a.data.timestamp < 1e12 ? a.data.timestamp * 1000 : a.data.timestamp
      const tsB = b.data.timestamp < 1e12 ? b.data.timestamp * 1000 : b.data.timestamp
      return tsB - tsA
    })
    
    return items
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
                  <i className="fa-solid fa-circle-info text-zinc-600 text-xs cursor-help" title="Realized + Unrealized P&L"></i>
                </div>
                <div className={cn(
                  'text-4xl font-bold tracking-tight',
                  totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  {totalPnL >= 0 ? '+' : '-'}{formatCurrency(Math.abs(totalPnL))}
                </div>
                <div className="text-zinc-500 text-sm mt-1 flex items-center gap-3">
                  <span>All-Time</span>
                  <span className="text-zinc-600">|</span>
                  <span className={realizedPnL >= 0 ? 'text-green-500/70' : 'text-red-500/70'}>
                    Realized: {realizedPnL >= 0 ? '+' : ''}{formatCurrency(realizedPnL)}
                  </span>
                  <span className={unrealizedPnL >= 0 ? 'text-green-500/70' : 'text-red-500/70'}>
                    Unrealized: {unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(unrealizedPnL)}
                  </span>
                </div>
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
              <PortfolioChart 
                data={chartData} 
                height={120} 
                color={totalPnL >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
              />
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
                  <select
                    value={historyView}
                    onChange={(e) => setHistoryView(e.target.value as typeof historyView)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none"
                  >
                    <option value="all">All Activity</option>
                    <option value="activity">Trades Only</option>
                    <option value="closed">Closed Positions</option>
                  </select>
                  <button className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
                    <i className="fa-solid fa-sort"></i>
                    Newest
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
                    <i className="fa-solid fa-download"></i>
                    Export
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
                    <th className="px-4 py-3 text-right w-32"></th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredHistory().length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                        <i className="fa-solid fa-inbox text-3xl mb-3 opacity-30 block"></i>
                        No history for this period
                      </td>
                    </tr>
                  ) : (
                    getFilteredHistory().slice(0, 50).map((item, idx) => (
                      item.type === 'activity' 
                        ? <ActivityRow key={`activity-${item.data.id}`} activity={item.data} />
                        : <ClosedPositionRow key={`closed-${item.data.id}`} position={item.data} />
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-zinc-600">
        <div className="flex items-center gap-4">
          <span>
            <i className="fa-solid fa-chart-pie mr-1 text-blue-400"></i>
            {openPositions.length} open · {closedPositions.length} closed
          </span>
          <span>
            <i className="fa-solid fa-exchange-alt mr-1 text-green-400"></i>
            {activity.length} trades
          </span>
        </div>
        <div>
          <i className="fa-solid fa-clock-rotate-left mr-1"></i>
          {positions.length > 0 
            ? `Last synced: ${new Date(positions[0]?.updated_at || Date.now()).toLocaleString()}`
            : 'Run polymarket-sync.js to import data'}
        </div>
      </div>

      {/* Setup Notice */}
      {positions.length === 0 && closedPositions.length === 0 && (
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
                <li>Run migration: <code className="text-blue-400">scripts/migrations/005_polymarket_closed_activity.sql</code></li>
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
