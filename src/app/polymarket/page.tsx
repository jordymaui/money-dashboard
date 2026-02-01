'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PolymarketChart } from '@/components/polymarket-chart'
import { 
  fetchAllPolymarketData,
  PolymarketPosition,
  PolymarketClosedPosition,
  PolymarketActivity,
  PnLTimelinePoint,
  CategoryStats,
  PerformanceStats
} from '@/lib/polymarket'
import { PolymarketAnalytics } from '@/components/polymarket-analytics'

type TimePeriod = '1D' | '1W' | '1M' | 'ALL'
type TabType = 'positions' | 'history'

const REFRESH_INTERVAL = 15 // seconds

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

// Mobile Position Accordion
function PositionAccordion({ position, isOpen, onToggle }: { 
  position: PolymarketPosition
  isOpen: boolean
  onToggle: () => void 
}) {
  const isProfitable = (position.cash_pnl || 0) >= 0
  
  return (
    <div className="border-b border-zinc-800/50">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {position.icon ? (
            <img src={position.icon} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0" />
          )}
          <div className="text-left min-w-0 flex-1">
            <div className="text-white text-sm font-medium truncate pr-2">{position.title || 'Unknown'}</div>
            <div className="flex items-center gap-2 text-xs">
              <span className={cn('px-1.5 py-0.5 rounded', position.outcome?.toLowerCase() === 'yes' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400')}>
                {position.outcome || 'N/A'}
              </span>
              <span className="text-zinc-500">{formatCurrency(position.current_value || 0)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn('font-mono text-sm', isProfitable ? 'text-green-400' : 'text-red-400')}>
            {isProfitable ? '+' : ''}{formatCurrency(position.cash_pnl || 0)}
          </span>
          <i className={cn('fa-solid fa-chevron-down text-zinc-500 transition-transform', isOpen && 'rotate-180')}></i>
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1 bg-zinc-800/20">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-zinc-800/30 rounded-lg p-2.5">
              <div className="text-zinc-500 text-xs mb-1">Shares</div>
              <div className="font-mono text-white">{position.size?.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
            </div>
            <div className="bg-zinc-800/30 rounded-lg p-2.5">
              <div className="text-zinc-500 text-xs mb-1">Avg Price</div>
              <div className="font-mono text-white">{((position.avg_price || 0) * 100).toFixed(0)}¢</div>
            </div>
            <div className="bg-zinc-800/30 rounded-lg p-2.5">
              <div className="text-zinc-500 text-xs mb-1">Current Price</div>
              <div className="font-mono text-white">{((position.cur_price || 0) * 100).toFixed(0)}¢</div>
            </div>
            <div className="bg-zinc-800/30 rounded-lg p-2.5">
              <div className="text-zinc-500 text-xs mb-1">Value</div>
              <div className="font-mono text-white">{formatCurrency(position.current_value || 0)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Positions Table Component
function PositionsTable({ positions }: { positions: PolymarketPosition[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
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
    <>
      {/* Mobile Accordion */}
      <div className="md:hidden">
        {openPositions.map((pos) => (
          <PositionAccordion
            key={pos.asset}
            position={pos}
            isOpen={openId === pos.asset}
            onToggle={() => setOpenId(openId === pos.asset ? null : pos.asset)}
          />
        ))}
      </div>
      
      {/* Desktop Table */}
      <table className="hidden md:table w-full">
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
            <tr key={pos.asset} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {pos.icon && (
                    <img src={pos.icon} alt="" className="w-6 h-6 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                  <span className="text-white text-sm max-w-xs truncate">{pos.title || 'Unknown Market'}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', pos.outcome?.toLowerCase() === 'yes' ? 'bg-blue-500/20 text-blue-400' : pos.outcome?.toLowerCase() === 'no' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-700 text-zinc-300')}>
                  {pos.outcome || 'N/A'}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono text-white">{pos.size?.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
              <td className="px-4 py-3 text-right font-mono text-zinc-400">{((pos.avg_price || 0) * 100).toFixed(0)}¢</td>
              <td className="px-4 py-3 text-right font-mono text-white">{((pos.cur_price || 0) * 100).toFixed(0)}¢</td>
              <td className="px-4 py-3 text-right font-mono text-white">{formatCurrency(pos.current_value || 0)}</td>
              <td className="px-4 py-3 text-right">
                <span className={cn('font-mono', (pos.cash_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {(pos.cash_pnl || 0) >= 0 ? '+' : ''}{formatCurrency(pos.cash_pnl || 0)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export default function PolymarketPage() {
  const [positions, setPositions] = useState<PolymarketPosition[]>([])
  const [closedPositions, setClosedPositions] = useState<PolymarketClosedPosition[]>([])
  const [activity, setActivity] = useState<PolymarketActivity[]>([])
  const [usdcBalance, setUsdcBalance] = useState<number>(0)
  const [positionsValue, setPositionsValue] = useState<number>(0)
  const [pnlStats, setPnlStats] = useState({ realizedPnL: 0, unrealizedPnL: 0, totalPnL: 0, wins: 0, losses: 0 })
  const [pnlTimeline, setPnlTimeline] = useState<PnLTimelinePoint[]>([])
  const [dailyPnL, setDailyPnL] = useState({ change: 0, changePercent: 0 })
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryStats[]>([])
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({ 
    totalBets: 0, winRate: 0, avgStake: 0, bestWin: 0, worstLoss: 0, profitFactor: 0, avgWin: 0, avgLoss: 0 
  })
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('ALL')
  const [activeTab, setActiveTab] = useState<TabType>('positions')
  const [historyView, setHistoryView] = useState<'all' | 'activity' | 'closed'>('all')
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchAllPolymarketData()
      
      setPositions(data.positions)
      setClosedPositions(data.closedPositions)
      setActivity(data.activity)
      setUsdcBalance(data.usdcBalance)
      setPositionsValue(data.positionsValue)
      setPnlStats(data.pnlStats)
      setPnlTimeline(data.timeline)
      setDailyPnL(data.dailyPnL)
      setCategoryBreakdown(data.categoryBreakdown)
      setPerformanceStats(data.performanceStats)
      setCountdown(REFRESH_INTERVAL)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Countdown timer with auto-refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchData()
          return REFRESH_INTERVAL
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [fetchData])

  // Portfolio stats (pre-calculated from API)
  const openPositions = positions.filter(p => (p.current_value || 0) > 0 && !p.redeemable)
  const totalPortfolioValue = usdcBalance + positionsValue
  
  // P&L from pre-calculated stats
  const { realizedPnL, unrealizedPnL, totalPnL, wins, losses } = pnlStats
  
  // 24hr P&L from resolved positions (fixed calculation)
  const todayChange = dailyPnL.change
  const todayChangePercent = totalPortfolioValue > 0 ? (todayChange / totalPortfolioValue) * 100 : 0

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
      {/* Header - Hidden on mobile (using MobileHeader) */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <Link 
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-full text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <i className="fa-solid fa-arrow-left"></i> Back
        </Link>
        <div className="flex items-center gap-3">
          {/* Refresh Timer */}
          <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-700/50">
            <div className="relative w-5 h-5">
              <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="#3f3f46"
                  strokeWidth="2"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray={`${(countdown / REFRESH_INTERVAL) * 50.27} 50.27`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-zinc-400 text-sm font-mono">{countdown}s</span>
          </div>
          <a 
            href="https://polymarket.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <i className="fa-solid fa-external-link"></i> Trade
          </a>
        </div>
      </div>

      {/* Portfolio Summary Section */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-zinc-400 text-xs md:text-sm">Portfolio Value</span>
            </div>
            
            <div className="text-3xl md:text-5xl font-bold text-blue-400 mb-2 tracking-tight">
              {formatCurrency(totalPortfolioValue)}
            </div>
            
            {/* Breakdown */}
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
              <span className="text-zinc-400">
                <i className="fa-solid fa-coins mr-1 text-green-400"></i>
                Cash: <span className="text-white font-mono">{formatCurrency(usdcBalance)}</span>
              </span>
              {positionsValue > 0 && (
                <span className="text-zinc-400">
                  <i className="fa-solid fa-chart-pie mr-1 text-blue-400"></i>
                  Positions: <span className="text-white font-mono">{formatCurrency(positionsValue)}</span>
                </span>
              )}
              <span className={cn('font-mono font-bold', totalPnL >= 0 ? 'text-green-400' : 'text-red-400')}>
                <i className="fa-solid fa-chart-line mr-1"></i>
                P&L: {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
              </span>
              <span className="text-zinc-500 text-xs">
                ({wins}W / {losses}L)
              </span>
            </div>
          </div>
          
          {/* Mobile refresh timer */}
          <div className="md:hidden flex items-center gap-1.5 px-2 py-1 bg-zinc-800/50 rounded-lg text-xs">
            <div className="relative w-4 h-4">
              <svg className="w-4 h-4 -rotate-90" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" fill="none" stroke="#3f3f46" strokeWidth="2"/>
                <circle cx="10" cy="10" r="8" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray={`${(countdown / REFRESH_INTERVAL) * 50.27} 50.27`} strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-zinc-400 font-mono">{countdown}s</span>
          </div>
        </div>
      </div>

      {/* Interactive P&L Chart */}
      <div className="mb-4 md:mb-6">
        <PolymarketChart
          timeline={pnlTimeline}
          totalPnL={totalPnL}
          realizedPnL={realizedPnL}
          unrealizedPnL={unrealizedPnL}
          wins={wins}
          losses={losses}
          timePeriod={timePeriod}
          onTimePeriodChange={setTimePeriod}
        />
      </div>

      {/* Tabs Section */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-zinc-800/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('positions')}
            className={cn(
              'px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium border-b-2 -mb-[1px] transition-colors whitespace-nowrap',
              activeTab === 'positions'
                ? 'text-white border-white'
                : 'text-zinc-500 border-transparent'
            )}
          >
            <i className="fa-solid fa-chart-pie mr-2 hidden md:inline"></i>
            Active Positions
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium border-b-2 -mb-[1px] transition-colors whitespace-nowrap',
              activeTab === 'history'
                ? 'text-white border-white'
                : 'text-zinc-500 border-transparent'
            )}
          >
            <i className="fa-solid fa-clock-rotate-left mr-2 hidden md:inline"></i>
            History
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-x-auto">
          {activeTab === 'positions' && (
            <PositionsTable positions={positions} />
          )}
          
          {activeTab === 'history' && (
            <>
              {/* History Controls - Desktop */}
              <div className="hidden md:flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input type="text" placeholder="Search" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 pl-9 text-sm text-white placeholder-zinc-500 w-64 focus:outline-none focus:border-zinc-600" />
                    <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"></i>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select value={historyView} onChange={(e) => setHistoryView(e.target.value as typeof historyView)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none">
                    <option value="all">All Activity</option>
                    <option value="activity">Trades Only</option>
                    <option value="closed">Closed Positions</option>
                  </select>
                </div>
              </div>
              
              {/* History Controls - Mobile */}
              <div className="md:hidden px-3 py-2 border-b border-zinc-800/50">
                <select value={historyView} onChange={(e) => setHistoryView(e.target.value as typeof historyView)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300">
                  <option value="all">All Activity</option>
                  <option value="activity">Trades Only</option>
                  <option value="closed">Closed Positions</option>
                </select>
              </div>
              
              {/* History - Mobile List */}
              <div className="md:hidden">
                {getFilteredHistory().length === 0 ? (
                  <div className="px-4 py-12 text-center text-zinc-500">
                    <i className="fa-solid fa-inbox text-3xl mb-3 opacity-30 block"></i>
                    No history for this period
                  </div>
                ) : (
                  getFilteredHistory().slice(0, 50).map((item, idx) => {
                    const isActivity = item.type === 'activity'
                    const data = item.data as any
                    const isBuy = isActivity ? data.side === 'BUY' : false
                    const isWin = !isActivity ? data.realized_pnl > 0 : false
                    const value = isActivity ? (data.usdc_size || data.size * data.price) : data.realized_pnl
                    
                    return (
                      <div key={`${item.type}-${data.asset}-${idx}`} className="border-b border-zinc-800/50 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm',
                              isActivity ? (isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400') : (isWin ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')
                            )}>
                              {isActivity ? (isBuy ? '+' : '−') : (isWin ? '✓' : '×')}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-white text-sm truncate">{data.title || 'Unknown'}</div>
                              <div className="text-zinc-500 text-xs">{formatTimeAgo(data.timestamp)}</div>
                            </div>
                          </div>
                          <span className={cn('font-mono text-sm flex-shrink-0', value >= 0 ? 'text-green-400' : 'text-red-400')}>
                            {value >= 0 ? '+' : ''}{formatCurrency(value)}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              
              {/* History Table - Desktop */}
              <table className="hidden md:table w-full">
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
                        ? <ActivityRow key={`activity-${item.data.asset}`} activity={item.data} />
                        : <ClosedPositionRow key={`closed-${item.data.asset}`} position={item.data} />
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="mt-4 md:mt-6">
        <PolymarketAnalytics 
          categoryBreakdown={categoryBreakdown}
          performanceStats={performanceStats}
          totalPnL={totalPnL}
        />
      </div>

      {/* Stats Footer - Desktop only */}
      <div className="hidden md:flex mt-4 items-center justify-between text-xs text-zinc-600">
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
Live data from Polymarket API
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
