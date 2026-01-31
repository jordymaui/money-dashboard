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
import { PolymarketClosedPosition } from '@/types'

type TimePeriod = '1D' | '1W' | '1M' | 'ALL'

interface ChartDataPoint {
  timestamp: number
  value: number
  date: string
  formattedDate: string
}

interface PolymarketChartProps {
  closedPositions: PolymarketClosedPosition[]
  totalPnL: number
  realizedPnL: number
  unrealizedPnL: number
  timePeriod: TimePeriod
  onTimePeriodChange: (period: TimePeriod) => void
}

function formatCurrency(value: number, decimals = 2): string {
  return `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value
    const isPositive = value >= 0
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-zinc-400 text-xs mb-1">{payload[0]?.payload?.formattedDate}</p>
        <p className={cn(
          'font-mono font-medium',
          isPositive ? 'text-green-400' : 'text-red-400'
        )}>
          {isPositive ? '+' : '-'}{formatCurrency(Math.abs(value))}
        </p>
      </div>
    )
  }
  return null
}

export function PolymarketChart({ 
  closedPositions, 
  totalPnL,
  realizedPnL,
  unrealizedPnL,
  timePeriod,
  onTimePeriodChange
}: PolymarketChartProps) {
  
  // Build P&L history from closed positions
  const chartData = useMemo(() => {
    const periodMs = {
      '1D': 24 * 60 * 60 * 1000,
      '1W': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000,
      'ALL': Date.now()
    }
    
    const now = Date.now()
    const cutoff = now - periodMs[timePeriod]
    
    // Filter and sort closed positions by timestamp
    const filtered = closedPositions
      .filter(p => {
        const ts = p.timestamp < 1e12 ? p.timestamp * 1000 : p.timestamp
        return ts >= cutoff
      })
      .sort((a, b) => {
        const tsA = a.timestamp < 1e12 ? a.timestamp * 1000 : a.timestamp
        const tsB = b.timestamp < 1e12 ? b.timestamp * 1000 : b.timestamp
        return tsA - tsB
      })
    
    if (filtered.length === 0) {
      // Return two points to show a flat line
      return [
        { 
          timestamp: cutoff, 
          value: 0,
          date: new Date(cutoff).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          formattedDate: new Date(cutoff).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          })
        },
        { 
          timestamp: now, 
          value: totalPnL,
          date: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          formattedDate: new Date(now).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          })
        }
      ]
    }
    
    // Calculate cumulative P&L starting from 0 at cutoff
    let runningPnL = 0
    const history: ChartDataPoint[] = []
    
    // Add starting point at 0
    const firstTs = filtered[0].timestamp < 1e12 ? filtered[0].timestamp * 1000 : filtered[0].timestamp
    history.push({
      timestamp: firstTs - 1,
      value: 0,
      date: new Date(firstTs - 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      formattedDate: new Date(firstTs - 1).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
      })
    })
    
    for (const pos of filtered) {
      runningPnL += pos.realized_pnl || 0
      const ts = pos.timestamp < 1e12 ? pos.timestamp * 1000 : pos.timestamp
      
      // Format based on time period
      let dateFormat: Intl.DateTimeFormatOptions
      if (timePeriod === '1D') {
        dateFormat = { hour: 'numeric', minute: '2-digit' }
      } else if (timePeriod === '1W') {
        dateFormat = { weekday: 'short', hour: 'numeric' }
      } else {
        dateFormat = { month: 'short', day: 'numeric' }
      }
      
      history.push({
        timestamp: ts,
        value: runningPnL,
        date: new Date(ts).toLocaleDateString('en-US', dateFormat),
        formattedDate: new Date(ts).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
        })
      })
    }
    
    // Add current total as last point (includes unrealized)
    history.push({
      timestamp: now,
      value: totalPnL,
      date: 'Now',
      formattedDate: new Date(now).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
      })
    })
    
    return history
  }, [closedPositions, timePeriod, totalPnL])

  // Calculate period change
  const periodChange = useMemo(() => {
    if (chartData.length < 2) return { amount: 0, percent: 0 }
    const start = chartData[0].value
    const end = chartData[chartData.length - 1].value
    const change = end - start
    const percent = start !== 0 ? (change / Math.abs(start)) * 100 : (end > 0 ? 100 : -100)
    return { amount: change, percent }
  }, [chartData])

  const isPositive = totalPnL >= 0
  const chartColor = isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-red-400">❤️</span>
            <span className="text-zinc-400 text-sm">Profit/Loss</span>
            <i className="fa-solid fa-circle-info text-zinc-600 text-xs cursor-help" title="Realized + Unrealized P&L"></i>
          </div>
          <div className={cn(
            'text-4xl font-bold tracking-tight',
            isPositive ? 'text-green-400' : 'text-red-400'
          )}>
            {isPositive ? '+' : '-'}{formatCurrency(Math.abs(totalPnL))}
          </div>
          <div className="text-zinc-500 text-sm mt-1 flex items-center gap-3">
            <span>{timePeriod === 'ALL' ? 'All-Time' : `Last ${timePeriod}`}</span>
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
                onClick={() => onTimePeriodChange(period)}
                className={cn(
                  'px-3 py-1 text-sm font-medium rounded transition-all',
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
      <div className="h-48">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={chartData} 
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#27272a" 
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                stroke="#52525b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#52525b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000 || value <= -1000) {
                    return `$${(value / 1000).toFixed(1)}K`
                  }
                  return `$${value.toFixed(0)}`
                }}
                tickMargin={10}
                width={50}
              />
              <ReferenceLine y={0} stroke="#52525b" strokeDasharray="3 3" />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#pnlGradient)"
                animationDuration={500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            <span>No closed positions in this period</span>
          </div>
        )}
      </div>
    </div>
  )
}
