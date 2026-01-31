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
  accentColor = 'green'
}: TopStatsBarProps) {
  const accentClasses = {
    green: 'text-emerald-400',
    blue: 'text-blue-400',
    white: 'text-white'
  }

  return (
    <div className="flex items-center justify-between py-4 border-b border-zinc-800/50">
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
            <span className="text-zinc-600 text-xs">0.00%</span>
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

      {/* Right side info */}
      <div className="text-right text-xs text-zinc-500">
        <div>
          <i className="fa-solid fa-rotate mr-1"></i>
          Next refresh in 7s
        </div>
        <div className="text-zinc-600 mt-1">
          <i className="fa-solid fa-heart mr-1"></i>
          Support us
        </div>
      </div>
    </div>
  )
}
