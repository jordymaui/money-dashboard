'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type TimePeriod = '1D' | '1W' | '1M' | 'ALL'

interface ChartDataPoint {
  date: string
  timestamp: number
  value: number
  formattedDate: string
}

interface HyperliquidChartProps {
  accentColor?: 'green' | 'blue' | 'white'
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatCompactCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-zinc-400 text-xs mb-1">{payload[0]?.payload?.formattedDate}</p>
        <p className="text-white font-mono font-medium">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

export function HyperliquidChart({ accentColor = 'green' }: HyperliquidChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1W')
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [currentValue, setCurrentValue] = useState(0)
  const [periodChange, setPeriodChange] = useState(0)
  const [periodChangePercent, setPeriodChangePercent] = useState(0)

  const colorMap = {
    green: {
      stroke: '#22c55e',
      gradient: ['rgba(34, 197, 94, 0.4)', 'rgba(34, 197, 94, 0)']
    },
    blue: {
      stroke: '#3b82f6',
      gradient: ['rgba(59, 130, 246, 0.4)', 'rgba(59, 130, 246, 0)']
    },
    white: {
      stroke: '#ffffff',
      gradient: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0)']
    }
  }

  const colors = colorMap[accentColor]

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    // Calculate cutoff date based on time period
    const now = new Date()
    let cutoffDate: Date
    
    switch (timePeriod) {
      case '1D':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '1W':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '1M':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'ALL':
      default:
        cutoffDate = new Date(0) // Beginning of time
    }

    try {
      let query = supabase
        .from('hyperliquid_snapshots')
        .select('timestamp, account_value')
        .order('timestamp', { ascending: true })
      
      if (timePeriod !== 'ALL') {
        query = query.gte('timestamp', cutoffDate.toISOString())
      }
      
      const { data, error } = await query

      if (error) {
        console.error('Error fetching snapshots:', error)
        return
      }

      if (data && data.length > 0) {
        // Transform data for chart
        const transformed: ChartDataPoint[] = data.map(snapshot => {
          const date = new Date(snapshot.timestamp)
          let dateFormat: Intl.DateTimeFormatOptions
          
          if (timePeriod === '1D') {
            dateFormat = { hour: 'numeric', minute: '2-digit' }
          } else if (timePeriod === '1W') {
            dateFormat = { weekday: 'short', hour: 'numeric' }
          } else {
            dateFormat = { month: 'short', day: 'numeric' }
          }
          
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            timestamp: date.getTime(),
            value: snapshot.account_value,
            formattedDate: date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })
          }
        })

        setChartData(transformed)
        
        // Calculate stats
        const latestValue = data[data.length - 1].account_value
        const firstValue = data[0].account_value
        const change = latestValue - firstValue
        const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0
        
        setCurrentValue(latestValue)
        setPeriodChange(change)
        setPeriodChangePercent(changePercent)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [timePeriod])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isProfitable = periodChange >= 0

  return (
    <div className="flex-1 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
        {/* Time Period Toggles */}
        <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
          {(['1D', '1W', '1M', 'ALL'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                timePeriod === period
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Stats Display */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-zinc-500">Account Value</div>
            <div className="text-lg font-bold text-white font-mono">
              {formatCurrency(currentValue)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500">{timePeriod} Change</div>
            <div className={cn(
              'text-lg font-bold font-mono',
              isProfitable ? 'text-emerald-400' : 'text-red-400'
            )}>
              {isProfitable ? '+' : ''}{formatCurrency(periodChange)}
              <span className="text-sm ml-1">
                ({isProfitable ? '+' : ''}{periodChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-4">
        <div className="h-[300px]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData} 
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`gradient-hl-${accentColor}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.gradient[0]} />
                    <stop offset="100%" stopColor={colors.gradient[1]} />
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
                  tickFormatter={formatCompactCurrency}
                  tickMargin={10}
                  domain={['dataMin - 100', 'dataMax + 100']}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={colors.stroke}
                  strokeWidth={2}
                  fill={`url(#gradient-hl-${accentColor})`}
                  animationDuration={500}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500">
              <i className="fa-solid fa-chart-area text-4xl mb-3 opacity-30"></i>
              <span>No data available for this period</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
