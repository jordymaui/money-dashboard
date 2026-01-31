'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import { TimeRange, ChartType, AccentColor, ChartDataPoint } from '@/types'

interface PnLChartProps {
  data: ChartDataPoint[]
  accentColor?: AccentColor
  currentPnl?: number
  title?: string
}

const timeRanges: { label: TimeRange; icon: string }[] = [
  { label: '24H', icon: 'fa-clock' },
  { label: '1W', icon: 'fa-calendar-week' },
  { label: '1M', icon: 'fa-calendar' },
  { label: 'All', icon: 'fa-infinity' },
]

const chartTypes: { label: ChartType; icon: string }[] = [
  { label: 'Combined', icon: 'fa-layer-group' },
  { label: 'Perp Only', icon: 'fa-chart-line' },
  { label: 'PnL', icon: 'fa-money-bill-trend-up' },
  { label: 'Account Value', icon: 'fa-wallet' },
  { label: 'Show Trades', icon: 'fa-arrows-rotate' },
]

function formatCurrency(value: number): string {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function PnLChart({ data, accentColor = 'green', currentPnl = 0, title = 'PnL (Combined)' }: PnLChartProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1W')
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('Combined')

  const colorMap = {
    green: {
      stroke: '#22c55e',
      fill: 'rgba(34, 197, 94, 0.1)',
      gradient: ['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0)']
    },
    blue: {
      stroke: '#3b82f6',
      fill: 'rgba(59, 130, 246, 0.1)',
      gradient: ['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0)']
    },
    white: {
      stroke: '#ffffff',
      fill: 'rgba(255, 255, 255, 0.1)',
      gradient: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0)']
    }
  }

  const colors = colorMap[accentColor]
  const isProfitable = currentPnl >= 0

  return (
    <div className="flex-1 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
        {/* Time Range Toggles */}
        <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
          {timeRanges.map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => setSelectedTimeRange(label)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5',
                selectedTimeRange === label
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <i className={cn('fa-solid text-[10px]', icon)}></i>
              {label}
            </button>
          ))}
        </div>

        {/* Chart Type Toggles */}
        <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
          {chartTypes.map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => setSelectedChartType(label)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5',
                selectedChartType === label
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <i className={cn('fa-solid text-[10px]', icon)}></i>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative p-4">
        {/* PnL Value Display */}
        <div className="absolute top-4 right-4 text-right z-10">
          <div className="text-xs text-zinc-500">
            <i className="fa-solid fa-chart-area mr-1"></i>
            {selectedTimeRange} {title}
          </div>
          <div className={cn(
            'text-2xl font-bold font-mono',
            isProfitable ? 'text-emerald-400' : 'text-red-400'
          )}>
            <i className={cn(
              'fa-solid mr-1 text-lg',
              isProfitable ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'
            )}></i>
            {formatCurrency(currentPnl)}
          </div>
        </div>

        <div className="h-[300px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-${accentColor}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.gradient[0]} />
                    <stop offset="100%" stopColor={colors.gradient[1]} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#52525b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis 
                  stroke="#52525b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  tickMargin={10}
                  domain={['dataMin - 500', 'dataMax + 500']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={colors.stroke}
                  strokeWidth={2}
                  fill={`url(#gradient-${accentColor})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500">
              <i className="fa-solid fa-chart-area text-4xl mb-3 opacity-30"></i>
              <span>No data available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
