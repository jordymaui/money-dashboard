'use client'

import { cn } from '@/lib/utils'
import { AccentColor } from '@/types'

interface SidebarPanelProps {
  perpEquity: number
  marginUsage: number // percentage 0-100
  longExposure: number
  shortExposure: number
  totalPositionValue: number
  maxPositionValue?: number
  positionCount?: number
  accentColor?: AccentColor
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatCompact(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`
  return value.toFixed(2)
}

export function SidebarPanel({
  perpEquity,
  marginUsage,
  longExposure,
  shortExposure,
  totalPositionValue,
  maxPositionValue = 100000,
  positionCount = 0,
  accentColor = 'green'
}: SidebarPanelProps) {
  const accentClasses = {
    green: 'bg-emerald-500',
    blue: 'bg-blue-500',
    white: 'bg-white'
  }
  
  const accentTextClasses = {
    green: 'text-emerald-400',
    blue: 'text-blue-400',
    white: 'text-white'
  }

  const totalExposure = longExposure + shortExposure
  const longPercent = totalExposure > 0 ? (longExposure / totalExposure) * 100 : 50
  const directionBias = longExposure > shortExposure ? 'LONG' : shortExposure > longExposure ? 'SHORT' : 'NEUTRAL'
  const biasAmount = Math.abs(longExposure - shortExposure)
  
  // Position distribution as percentage of max
  const positionPercent = Math.min((totalPositionValue / maxPositionValue) * 100, 100)

  return (
    <div className="w-[280px] bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4 space-y-5">
      {/* Perp Equity */}
      <div>
        <h3 className="text-zinc-500 text-sm mb-1">
          <i className="fa-solid fa-chart-line mr-1.5"></i>
          Perp Equity
        </h3>
        <div className={cn('text-2xl font-bold font-mono', accentTextClasses[accentColor])}>
          {formatCurrency(perpEquity)}
        </div>
      </div>

      {/* Margin Usage */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-zinc-500 text-sm">
            <i className="fa-solid fa-gauge-high mr-1.5"></i>
            Margin Usage
          </h3>
          <span className="text-white font-mono text-sm">{marginUsage.toFixed(2)}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={cn('h-full rounded-full transition-all', accentClasses[accentColor])}
            style={{ width: `${Math.min(marginUsage, 100)}%` }}
          />
        </div>
      </div>

      {/* Direction Bias */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-zinc-500 text-sm">
            <i className="fa-solid fa-compass mr-1.5"></i>
            Direction Bias
          </h3>
          <div className="flex items-center gap-1">
            <span className={cn(
              'text-sm font-bold',
              directionBias === 'SHORT' ? 'text-red-400' : directionBias === 'LONG' ? 'text-emerald-400' : 'text-zinc-400'
            )}>
              <i className={cn(
                'fa-solid mr-1',
                directionBias === 'SHORT' ? 'fa-arrow-down' : directionBias === 'LONG' ? 'fa-arrow-up' : 'fa-minus'
              )}></i>
              {directionBias}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-xs">Long Exposure</span>
          <span className="text-zinc-400 text-xs font-mono">
            {biasAmount > 0 && directionBias === 'SHORT' ? '-' : ''}{formatCompact(biasAmount)}
          </span>
        </div>
        
        {/* Long/Short Bar */}
        <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${longPercent}%` }}
          />
          <div 
            className="h-full bg-red-500 transition-all"
            style={{ width: `${100 - longPercent}%` }}
          />
        </div>
      </div>

      {/* Position Distribution */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-zinc-500 text-sm">
            <i className="fa-solid fa-chart-pie mr-1.5"></i>
            Position Distribution
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-400">
              <i className="fa-solid fa-circle text-[6px] mr-1"></i>
              {longPercent.toFixed(2)}%
            </span>
            <span className="text-red-400">
              <i className="fa-solid fa-circle text-[6px] mr-1"></i>
              {(100 - longPercent).toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="relative">
          <div className="h-6 bg-zinc-800 rounded overflow-hidden">
            <div 
              className={cn('h-full transition-all', accentClasses[accentColor])}
              style={{ width: `${positionPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-zinc-600">
            <span>0</span>
            <span>{formatCompact(totalPositionValue)}</span>
          </div>
        </div>
      </div>

      {/* Position Summary */}
      <div className="pt-3 border-t border-zinc-800/50 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">
            <i className="fa-solid fa-layer-group mr-1.5"></i>
            Positions
          </span>
          <span className="text-white font-mono">
            <span className="text-zinc-400">({positionCount})</span>
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-emerald-400">
            <i className="fa-solid fa-arrow-up mr-1"></i>
            Long: {formatCurrency(longExposure)}
          </span>
          <span className="text-zinc-600">({longPercent.toFixed(0)}%)</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-red-400">
            <i className="fa-solid fa-arrow-down mr-1"></i>
            Short: {formatCurrency(shortExposure)}
          </span>
          <span className="text-zinc-600">({(100 - longPercent).toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  )
}
