'use client'

import { cn } from '@/lib/utils'

interface LearningsModalProps {
  isOpen: boolean
  onClose: () => void
  totalPnL: number
  winRate: number
  totalTrades: number
}

export function LearningsModal({ isOpen, onClose, totalPnL, winRate, totalTrades }: LearningsModalProps) {
  if (!isOpen) return null

  // Generate dynamic learnings based on performance
  const learnings = []
  
  if (totalTrades === 0) {
    learnings.push({
      type: 'info',
      text: 'No trades yet - start with small positions to build data',
      icon: 'fa-lightbulb'
    })
  } else {
    if (winRate >= 55) {
      learnings.push({
        type: 'success',
        text: `Win rate at ${winRate.toFixed(1)}% - above target. Keep the discipline.`,
        icon: 'fa-check-circle'
      })
    } else if (winRate >= 50) {
      learnings.push({
        type: 'warning',
        text: `Win rate at ${winRate.toFixed(1)}% - close to target but need improvement. Review your setups.`,
        icon: 'fa-exclamation-triangle'
      })
    } else {
      learnings.push({
        type: 'error',
        text: `Win rate at ${winRate.toFixed(1)}% - below break-even. Consider pausing to analyze what's not working.`,
        icon: 'fa-times-circle'
      })
    }

    if (totalPnL > 0) {
      learnings.push({
        type: 'success',
        text: 'Profitable overall - the strategy has edge. Focus on consistency.',
        icon: 'fa-chart-line'
      })
    } else {
      learnings.push({
        type: 'error',
        text: 'Currently in drawdown - stick to the rules, don\'t increase size.',
        icon: 'fa-arrow-trend-down'
      })
    }
  }

  // Static learnings/tips
  const tips = [
    'Momentum Fade works best after 2%+ moves in volatile conditions',
    'Value Mispricing needs quick execution - odds shift fast',
    'Avoid trading during low-volume periods (late night)',
    'The first bet after a loss is the most dangerous - wait for clear setup',
    '15-min markets are noisy - only trade high-confidence setups',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-lg overflow-hidden">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-brain text-purple-400"></i>
            Learnings & Insights
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Dynamic Learnings */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Current Performance
            </h3>
            <div className="space-y-2">
              {learnings.map((learning, i) => (
                <div 
                  key={i}
                  className={cn(
                    "p-3 rounded-xl flex items-start gap-3",
                    learning.type === 'success' && 'bg-green-500/10 border border-green-500/30',
                    learning.type === 'warning' && 'bg-yellow-500/10 border border-yellow-500/30',
                    learning.type === 'error' && 'bg-red-500/10 border border-red-500/30',
                    learning.type === 'info' && 'bg-blue-500/10 border border-blue-500/30'
                  )}
                >
                  <i className={cn(
                    'fa-solid mt-0.5',
                    learning.icon,
                    learning.type === 'success' && 'text-green-400',
                    learning.type === 'warning' && 'text-yellow-400',
                    learning.type === 'error' && 'text-red-400',
                    learning.type === 'info' && 'text-blue-400'
                  )}></i>
                  <span className="text-sm text-zinc-300">{learning.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy Tips */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Strategy Tips
            </h3>
            <div className="space-y-2">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-2">
                  <i className="fa-solid fa-lightbulb text-yellow-400 mt-0.5"></i>
                  <span className="text-sm text-zinc-400">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-Update Note */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <i className="fa-solid fa-robot"></i>
              <span className="font-semibold">Self-Updating</span>
            </div>
            <p className="text-sm text-zinc-400">
              This section updates automatically based on your trading performance. As patterns emerge, new insights will appear.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
