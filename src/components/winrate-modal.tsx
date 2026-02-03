'use client'

import { cn } from '@/lib/utils'
import { PerformanceStats } from '@/lib/polymarket'

interface WinRateModalProps {
  isOpen: boolean
  onClose: () => void
  stats: PerformanceStats
  wins: number
  losses: number
}

export function WinRateModal({ isOpen, onClose, stats, wins, losses }: WinRateModalProps) {
  if (!isOpen) return null

  const total = wins + losses
  const winRate = total > 0 ? (wins / total) * 100 : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-lg overflow-hidden">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-chart-pie text-green-400"></i>
            Win Rate Analysis
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Main Win Rate Circle */}
          <div className="flex justify-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#27272a" strokeWidth="8"/>
                <circle 
                  cx="50" cy="50" r="40" fill="none" 
                  stroke={winRate >= 55 ? '#22c55e' : winRate >= 50 ? '#eab308' : '#ef4444'}
                  strokeWidth="8"
                  strokeDasharray={`${winRate * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn(
                  "text-4xl font-bold",
                  winRate >= 55 ? 'text-green-400' : winRate >= 50 ? 'text-yellow-400' : 'text-red-400'
                )}>
                  {winRate.toFixed(1)}%
                </span>
                <span className="text-sm text-zinc-500">Win Rate</span>
              </div>
            </div>
          </div>

          {/* W/L Record */}
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{wins}</div>
              <div className="text-sm text-zinc-500">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{losses}</div>
              <div className="text-sm text-zinc-500">Losses</div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="text-sm text-zinc-500 mb-1">Avg Win</div>
              <div className="text-xl font-bold text-green-400">
                ${stats.avgWin?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="text-sm text-zinc-500 mb-1">Avg Loss</div>
              <div className="text-xl font-bold text-red-400">
                ${stats.avgLoss?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="text-sm text-zinc-500 mb-1">Best Win</div>
              <div className="text-xl font-bold text-green-400">
                ${stats.bestWin?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="text-sm text-zinc-500 mb-1">Worst Loss</div>
              <div className="text-xl font-bold text-red-400">
                ${stats.worstLoss?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4 col-span-2">
              <div className="text-sm text-zinc-500 mb-1">Profit Factor</div>
              <div className={cn(
                "text-xl font-bold",
                (stats.profitFactor || 0) >= 1.5 ? 'text-green-400' : 
                (stats.profitFactor || 0) >= 1 ? 'text-yellow-400' : 'text-red-400'
              )}>
                {stats.profitFactor?.toFixed(2) || '0.00'}
                <span className="text-sm text-zinc-500 ml-2">
                  {(stats.profitFactor || 0) >= 1.5 ? '(Good)' : (stats.profitFactor || 0) >= 1 ? '(Break-even)' : '(Losing)'}
                </span>
              </div>
            </div>
          </div>

          {/* Target */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <i className="fa-solid fa-bullseye"></i>
              <span className="font-semibold">Target: 55%+ Win Rate</span>
            </div>
            <p className="text-sm text-zinc-400">
              At 1:1 R:R, 55% win rate = consistent profitability. Currently {winRate >= 55 ? 'on target ✓' : `${(55 - winRate).toFixed(1)}% below target`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
