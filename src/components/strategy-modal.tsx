'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface StrategyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function StrategyModal({ isOpen, onClose }: StrategyModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-chess text-blue-400"></i>
            Trading Strategy
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)] space-y-6">
          {/* Target Markets */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <i className="fa-solid fa-crosshairs text-orange-400"></i>
              Target Markets
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium">
                <i className="fa-brands fa-bitcoin mr-1"></i> BTC 15-min
              </span>
              <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium">
                <i className="fa-brands fa-ethereum mr-1"></i> ETH 15-min
              </span>
              <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium">
                SOL 15-min
              </span>
            </div>
          </div>

          {/* Setups */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <i className="fa-solid fa-lightbulb text-yellow-400"></i>
              Trading Setups
            </h3>
            <div className="space-y-3">
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-green-400">A: Momentum Fade</span>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">PRIMARY</span>
                </div>
                <p className="text-sm text-zinc-400">Price moved sharply → bet opposite direction (mean reversion)</p>
                <div className="mt-2 text-xs text-zinc-500">Confidence: 3/5 | Best for: Volatile markets</div>
              </div>
              
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-blue-400">B: Value Mispricing</span>
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">HIGH CONF</span>
                </div>
                <p className="text-sm text-zinc-400">Market odds don't match true probability → exploit the gap</p>
                <div className="mt-2 text-xs text-zinc-500">Confidence: 4/5 | Best for: Clear mispricings</div>
              </div>
              
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-orange-400">C: Momentum Continuation</span>
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">RARE</span>
                </div>
                <p className="text-sm text-zinc-400">Strong trend with catalyst → ride with it (use sparingly)</p>
                <div className="mt-2 text-xs text-zinc-500">Confidence: 2/5 | Best for: News events only</div>
              </div>
            </div>
          </div>

          {/* Position Sizing */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <i className="fa-solid fa-calculator text-cyan-400"></i>
              Position Sizing
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-400">0%</div>
                <div className="text-xs text-zinc-500">Conf 1-2</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-400">1%</div>
                <div className="text-xs text-zinc-500">Conf 3</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400">2%</div>
                <div className="text-xs text-zinc-500">Conf 4</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-400">3%</div>
                <div className="text-xs text-zinc-500">Conf 5</div>
              </div>
            </div>
          </div>

          {/* Risk Rules */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <i className="fa-solid fa-shield text-red-400"></i>
              Hard Risk Rules
            </h3>
            <div className="space-y-2">
              {[
                { rule: 'Max 3% per trade', icon: 'fa-hand' },
                { rule: 'Max 3 open positions', icon: 'fa-layer-group' },
                { rule: 'Max 5% total exposure', icon: 'fa-chart-pie' },
                { rule: '-10% daily stop loss', icon: 'fa-stop' },
                { rule: 'No revenge betting', icon: 'fa-ban' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <i className={cn('fa-solid text-red-400 text-xs', item.icon)}></i>
                  </div>
                  <span className="text-zinc-300">{item.rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
