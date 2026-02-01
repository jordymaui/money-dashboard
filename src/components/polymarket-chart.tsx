'use client'

import { useMemo } from 'react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine
} from 'recharts'
import { cn } from '@/lib/utils'
import { PnLTimelinePoint } from '@/lib/polymarket'

type TimePeriod = '1D' | '1W' | '1M' | 'ALL'

interface ChartDataPoint {
  timestamp: number
  value: number
  date: string
  formattedDate: string
  title?: string
}

interface PolymarketChartProps {
  timeline: PnLTimelinePoint[]
  totalPnL: number
  realizedPnL: number
  unrealizedPnL: number
  wins: number
  losses: number
  timePeriod: TimePeriod
  onTimePeriodChange: (period: TimePeriod) => void
}

function formatCurrency(value: number, decimals = 2): string {
  return `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    const value = data?.value || 0
    const isPositive = value >= 0
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl max-w-xs">
        <p className="text-zinc-400 text-xs mb-1">{data?.formattedDate}</p>
        <p className={cn(
          'font-mono font-medium text-lg',
          isPositive ? 'text-green-400' : 'text-red-400'
        )}>
          {isPositive ? '+' : ''}{formatCurrency(value)}
        </p>
        {data?.title && (
          <p className="text-zinc-500 text-xs mt-1 truncate">{data.title}</p>
        )}
      </div>
    )
  }
  return null
}

export function PolymarketChart({ 
  timeline,
  totalPnL,
  realizedPnL,
  unrealizedPnL,
  wins,
  losses,
  timePeriod,
  onTimePeriodChange
}: PolymarketChartProps) {
  
  // Filter timeline by time period and format for chart
  const chartData = useMemo(() => {
    const periodMs = {
      '1D': 24 * 60 * 60 * 1000,
      '1W': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000,
      'ALL': Date.now()
    }
    
    const now = Date.now()
    const cutoff = now - periodMs[timePeriod]
    
    // Filter by time period
    const filtered = timeline.filter(p => p.timestamp >= cutoff)
    
    if (filtered.length === 0) return []
    
    // Recalculate cumulative P&L from filtered start
    let cumulative = 0
    
    // If not ALL, we need to find the starting cumulative value
    if (timePeriod !== 'ALL' && filtered.length > 0) {
      const beforeCutoff = timeline.filter(p => p.timestamp < cutoff)
      cumulative = beforeCutoff.reduce((sum, p) => sum + p.pnl, 0)
    }
    
    return filtered.map(point => {
      cumulative += point.pnl
      return {
        timestamp: point.timestamp,
        value: cumulative,
        date: new Date(point.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        formattedDate: new Date(point.timestamp).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        title: point.title
      }
    })
  }, [timeline, timePeriod])

  const isPositive = totalPnL >= 0
  const gradientId = 'polymarket-gradient'

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
      {/* Chart Header - Mobile */}
      <div className="md:hidden p-3 border-b border-zinc-800/50 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Total P&L</div>
            <div className={cn(
              'text-2xl font-bold font-mono',
              isPositive ? 'text-green-400' : 'text-red-400'
            )}>
              {isPositive ? '+' : ''}{formatCurrency(totalPnL)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Record</div>
            <div className="text-lg font-mono text-white">
              <span className="text-green-400">{wins}W</span>
              <span className="text-zinc-600 mx-1">/</span>
              <span className="text-red-400">{losses}L</span>
            </div>
          </div>
        </div>
        
        {/* Time Period Toggles */}
        <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
          {(['1D', '1W', '1M', 'ALL'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => onTimePeriodChange(period)}
              className={cn(
                'flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all',
                timePeriod === period
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500'
              )}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Header - Desktop */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
          {(['1D', '1W', '1M', 'ALL'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => onTimePeriodChange(period)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-all',
                timePeriod === period
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {period}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-xs text-zinc-500">Total P&L</div>
            <div className={cn(
              'text-2xl font-bold font-mono',
              isPositive ? 'text-green-400' : 'text-red-400'
            )}>
              {isPositive ? '+' : ''}{formatCurrency(totalPnL)}
            </div>
          </div>
          <div className="text-right border-l border-zinc-700 pl-8">
            <div className="text-xs text-zinc-500">Record</div>
            <div className="text-xl font-mono">
              <span className="text-green-400">{wins}W</span>
              <span className="text-zinc-600 mx-2">/</span>
              <span className="text-red-400">{losses}L</span>
            </div>
          </div>
          {unrealizedPnL !== 0 && (
            <div className="text-right border-l border-zinc-700 pl-8">
              <div className="text-xs text-zinc-500">Unrealized</div>
              <div className={cn(
                'text-lg font-mono',
                unrealizedPnL >= 0 ? 'text-green-400/70' : 'text-red-400/70'
              )}>
                {unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(unrealizedPnL)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="p-2 md:p-4">
        <div className="h-[200px] md:h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="0%" 
                      stopColor={isPositive ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'} 
                    />
                    <stop 
                      offset="100%" 
                      stopColor={isPositive ? 'rgba(34, 197, 94, 0)' : 'rgba(239, 68, 68, 0)'} 
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#52525b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#52525b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v >= 0 ? '' : '-'}${Math.abs(v / 1000).toFixed(1)}k`}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#52525b" strokeDasharray="3 3" />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={isPositive ? '#22c55e' : '#ef4444'}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <i className="fa-solid fa-chart-area text-4xl mb-3 opacity-30"></i>
                <p>No data for this period</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 text-xs text-zinc-600 text-center border-t border-zinc-800/50">
        <i className="fa-solid fa-bolt mr-1"></i>
        Live data from Polymarket API
      </div>
    </div>
  )
}
