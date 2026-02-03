'use client'

import { cn } from '@/lib/utils'
import { PolymarketPosition } from '@/lib/polymarket'

interface PositionsModalProps {
  isOpen: boolean
  onClose: () => void
  positions: PolymarketPosition[]
}

function formatCurrency(value: number): string {
  return `$${Math.abs(value).toFixed(2)}`
}

export function PositionsModal({ isOpen, onClose, positions }: PositionsModalProps) {
  if (!isOpen) return null

  const openPositions = positions.filter(p => (p.current_value || 0) > 0 && !p.redeemable)
  const totalValue = openPositions.reduce((sum, p) => sum + (p.current_value || 0), 0)
  const totalPnL = openPositions.reduce((sum, p) => sum + (p.cash_pnl || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-crosshairs text-orange-400"></i>
            Current Positions
            <span className="text-sm font-normal text-zinc-500">({openPositions.length}/3 max)</span>
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="text-sm text-zinc-500 mb-1">Total at Risk</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="text-sm text-zinc-500 mb-1">Unrealized P&L</div>
              <div className={cn(
                "text-2xl font-bold",
                totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
              </div>
            </div>
          </div>

          {/* Positions */}
          {openPositions.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <i className="fa-solid fa-inbox text-4xl mb-4 opacity-30"></i>
              <p>No open positions</p>
              <p className="text-sm mt-2">Start trading to see your bets here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openPositions.map((pos) => {
                const isProfitable = (pos.cash_pnl || 0) >= 0
                return (
                  <div key={pos.asset} className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50">
                    <div className="flex items-start gap-3">
                      {pos.icon && (
                        <img src={pos.icon} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{pos.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            pos.outcome?.toLowerCase() === 'yes' 
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-red-500/20 text-red-400'
                          )}>
                            {pos.outcome}
                          </span>
                          <span className="text-sm text-zinc-500">
                            {((pos.avg_price || 0) * 100).toFixed(0)}¢ → {((pos.cur_price || 0) * 100).toFixed(0)}¢
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "font-bold",
                          isProfitable ? 'text-green-400' : 'text-red-400'
                        )}>
                          {isProfitable ? '+' : ''}{formatCurrency(pos.cash_pnl || 0)}
                        </div>
                        <div className="text-sm text-zinc-500">
                          {formatCurrency(pos.current_value || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Risk Indicator */}
          <div className="mt-6 bg-zinc-800/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Position Limit</span>
              <span className={cn(
                "text-sm font-medium",
                openPositions.length >= 3 ? 'text-red-400' : 'text-green-400'
              )}>
                {openPositions.length}/3
              </span>
            </div>
            <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full",
                  openPositions.length >= 3 ? 'bg-red-500' : 
                  openPositions.length >= 2 ? 'bg-yellow-500' : 'bg-green-500'
                )}
                style={{ width: `${(openPositions.length / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
