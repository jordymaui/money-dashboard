'use client'

import { cn } from '@/lib/utils'
import { AccentColor } from '@/types'

interface TopStatsBarProps {
  totalValue: number
  withdrawable: number
  leverage?: number
  totalPositionSize: number
  perpEquity?: number
  spotValue?: number
  countdown?: number
  accentColor?: AccentColor
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function TopStatsBar({
  totalValue,
  withdrawable,
  leverage,
  totalPositionSize,
  perpEquity,
  spotValue = 0,
  countdown,
  accentColor = 'green'
}: TopStatsBarProps) {
  const accentClasses = {
    green: 'text-emerald-400',
    blue: 'text-blue-400',
    white: 'text-white'
  }

  return (
    <div className="py-3 md:py-4 border-b border-zinc-800/50">
      {/* Mobile: Compact stacked layout */}
      <div className="md:hidden">
        {/* Top row: Value + Countdown */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-zinc-500 text-xs">
              <i className="fa-solid fa-sack-dollar mr-1"></i>
              Total Value
            </span>
            <div className={cn('text-2xl font-bold font-mono', accentClasses[accentColor])}>
              {formatCurrency(totalValue)}
            </div>
          </div>
          {countdown !== undefined && (
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs',
              countdown <= 5 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800/50 text-zinc-400'
            )}>
              <i className={cn('fa-solid', countdown <= 5 ? 'fa-spinner fa-spin' : 'fa-rotate')}></i>
              <span className="font-mono font-bold text-white">{countdown}s</span>
            </div>
          )}
        </div>
        
        {/* Bottom row: Key stats in a grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-800/30 rounded-lg p-2">
            <span className="text-zinc-500 text-[10px] block">Withdrawable</span>
            <span className="text-white font-mono text-sm">{formatCurrency(withdrawable)}</span>
          </div>
          {leverage !== undefined && (
            <div className="bg-zinc-800/30 rounded-lg p-2">
              <span className="text-zinc-500 text-[10px] block">Leverage</span>
              <span className={cn(
                'font-mono text-sm font-bold',
                leverage > 5 ? 'text-red-400' : 'text-emerald-400'
              )}>{leverage.toFixed(2)}x</span>
            </div>
          )}
          <div className="bg-zinc-800/30 rounded-lg p-2">
            <span className="text-zinc-500 text-[10px] block">Position Size</span>
            <span className="text-white font-mono text-sm">${(totalPositionSize / 1000).toFixed(1)}K</span>
          </div>
        </div>
      </div>

      {/* Desktop: Original horizontal layout */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Total Value */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-sm">
                <i className="fa-solid fa-sack-dollar mr-1.5"></i>
                Total Value
              </span>
              <span className="text-xs text-zinc-600 px-1.5 py-0.5 rounded bg-zinc-800">Combined</span>
            </div>
            <div className={cn('text-2xl font-bold font-mono', accentClasses[accentColor])}>
              {formatCurrency(totalValue)}
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
              {perpEquity !== undefined && (
                <span>
                  <i className={cn('fa-solid fa-diamond mr-1', accentClasses[accentColor])}></i>
                  Perp: {formatCurrency(perpEquity)}
                </span>
              )}
              {spotValue > 0 && (
                <span>
                  <i className="fa-solid fa-diamond mr-1 text-yellow-400"></i>
                  Spot: {formatCurrency(spotValue)}
                </span>
              )}
            </div>
          </div>

          {/* Withdrawable */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-sm">
                <i className="fa-solid fa-money-bill-transfer mr-1.5"></i>
                Withdrawable
              </span>
              <span className="text-zinc-600 text-xs">
                {totalValue > 0 ? ((withdrawable / totalValue) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {formatCurrency(withdrawable)}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">Free margin available</div>
          </div>

          {/* Leverage */}
          {leverage !== undefined && (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-sm">
                  <i className="fa-solid fa-scale-balanced mr-1.5"></i>
                  Leverage
                </span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  leverage > 5 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                )}>
                  {leverage.toFixed(2)}x
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {formatCurrency(totalPositionSize)}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">Total position size</div>
            </div>
          )}
        </div>

        {/* Right side - Countdown */}
        <div className="text-right text-xs">
          {countdown !== undefined && (
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg',
              countdown <= 5 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800/50 text-zinc-400'
            )}>
              <i className={cn(
                'fa-solid',
                countdown <= 5 ? 'fa-spinner fa-spin' : 'fa-rotate'
              )}></i>
              <span>
                Next refresh in <span className="font-mono font-bold text-white">{countdown}s</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
