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
import { fetchPortfolioHistory, PortfolioPeriod } from '@/lib/hyperliquid'
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
  if (value >= 100000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  if (value >= 10000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

// Map UI time period to API period
function mapTimePeriodToApi(period: TimePeriod): PortfolioPeriod {
  switch (period) {
    case '1D': return 'day'
    case '1W': return 'week'
    case '1M': return 'month'
    case 'ALL': return 'allTime'
  }
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const dataPoint = payload[0]?.payload
    if (!dataPoint) return null
    
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 shadow-xl">
        <p className="text-zinc-400 text-xs mb-1.5">
          <i className="fa-solid fa-calendar mr-1.5"></i>
          {dataPoint.formattedDate}
        </p>
        <p className="text-white font-mono font-bold text-lg">
          {formatCurrency(dataPoint.value)}
        </p>
      </div>
    )
  }
  return null
}

export function HyperliquidChart({ accentColor = 'green' }: HyperliquidChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1D')
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [currentValue, setCurrentValue] = useState(0)
  const [periodChange, setPeriodChange] = useState(0)
  const [periodChangePercent, setPeriodChangePercent] = useState(0)
  const [periodStartValue, setPeriodStartValue] = useState(0)

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
    
    try {
      const portfolioData = await fetchPortfolioHistory()
      const apiPeriod = mapTimePeriodToApi(timePeriod)
      const periodData = portfolioData.get(apiPeriod)
      
      if (periodData && periodData.accountValueHistory.length > 0) {
        const history = periodData.accountValueHistory
        
        // Check actual data range to decide label format
        const firstTimestamp = history[0][0]
        const lastTimestamp = history[history.length - 1][0]
        const dataRangeMs = lastTimestamp - firstTimestamp
        const ONE_DAY = 24 * 60 * 60 * 1000
        const ONE_WEEK = 7 * ONE_DAY
        
        // Transform API data for chart
        const transformed: ChartDataPoint[] = history.map(([timestamp, valueStr]) => {
          const date = new Date(timestamp)
          const value = parseFloat(valueStr)
          
          // Format X-axis label based on actual data range
          let dateLabel: string
          if (dataRangeMs <= ONE_DAY) {
            dateLabel = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
          } else if (dataRangeMs <= ONE_WEEK) {
            dateLabel = date.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + 
                        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
          } else {
            dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          }
          
          return {
            date: dateLabel,
            timestamp,
            value,
            formattedDate: date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })
          }
        })

        // Filter out zero values at the start (no activity)
        const filteredData = transformed.filter((d, i, arr) => {
          // Keep if value > 0 OR if any value after this is > 0
          if (d.value > 0) return true
          for (let j = i + 1; j < arr.length; j++) {
            if (arr[j].value > 0) return false // Skip leading zeros
          }
          return false
        })
        
        // Actually, let's find first non-zero and take from there
        const firstNonZeroIdx = transformed.findIndex(d => d.value > 0)
        const cleanData = firstNonZeroIdx >= 0 ? transformed.slice(firstNonZeroIdx) : []

        setChartData(cleanData)
        
        if (cleanData.length > 0) {
          const firstValue = cleanData[0].value
          const latestValue = cleanData[cleanData.length - 1].value
          const change = latestValue - firstValue
          const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0
          
          setCurrentValue(latestValue)
          setPeriodStartValue(firstValue)
          setPeriodChange(change)
          setPeriodChangePercent(changePercent)
        }
      } else {
        setChartData([])
        setCurrentValue(0)
        setPeriodStartValue(0)
        setPeriodChange(0)
        setPeriodChangePercent(0)
      }
    } catch (err) {
      console.error('Error fetching portfolio data:', err)
    } finally {
      setLoading(false)
    }
  }, [timePeriod])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isProfitable = periodChange >= 0

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case '1D': return '24h'
      case '1W': return '7d'
      case '1M': return '30d'
      case 'ALL': return 'All time'
    }
  }

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
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-zinc-500">
              <i className="fa-solid fa-wallet mr-1"></i>
              Account Value
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {formatCurrency(currentValue)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500">
              <i className="fa-solid fa-chart-line mr-1"></i>
              {getPeriodLabel()} Change
            </div>
            <div className={cn(
              'text-xl font-bold font-mono flex items-center justify-end gap-1',
              isProfitable ? 'text-emerald-400' : 'text-red-400'
            )}>
              <i className={cn('fa-solid text-sm', isProfitable ? 'fa-caret-up' : 'fa-caret-down')}></i>
              {isProfitable ? '+' : ''}{formatCurrency(periodChange)}
            </div>
            <div className={cn(
              'text-sm font-mono',
              isProfitable ? 'text-emerald-400/70' : 'text-red-400/70'
            )}>
              ({isProfitable ? '+' : ''}{periodChangePercent.toFixed(2)}%)
            </div>
          </div>
          {periodStartValue > 0 && (
            <div className="text-right border-l border-zinc-700 pl-6">
              <div className="text-xs text-zinc-500">
                <i className="fa-solid fa-flag mr-1"></i>
                Period Start
              </div>
              <div className="text-lg font-mono text-zinc-400">
                {formatCurrency(periodStartValue)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-4">
        <div className="h-[300px]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                <div className="text-zinc-500 text-sm">Loading chart data...</div>
              </div>
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
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#52525b', strokeDasharray: '5 5' }}
                />
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
              <span className="text-xs text-zinc-600 mt-1">Try selecting a different time range</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 text-xs text-zinc-600 text-center border-t border-zinc-800/50">
        <i className="fa-solid fa-bolt mr-1"></i>
        Live data from Hyperliquid API
      </div>
    </div>
  )
}
