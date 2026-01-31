'use client'

import { useState } from 'react'
import { AdvancedStatsModal } from './advanced-stats-modal'

export function HyperliquidHeader() {
  const [showAdvancedModal, setShowAdvancedModal] = useState(false)

  return (
    <>
      {/* Desktop header - hidden on mobile */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-full text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
            <i className="fa-solid fa-arrow-left"></i> Back
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
            <i className="fa-solid fa-chart-line text-emerald-400"></i>
            <span className="font-mono text-white">Hyperliquid</span>
            <i className="fa-solid fa-circle text-[6px] text-emerald-400"></i>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAdvancedModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors"
          >
            <i className="fa-solid fa-chart-pie"></i> Advanced
          </button>
        </div>
      </div>

      <AdvancedStatsModal 
        isOpen={showAdvancedModal} 
        onClose={() => setShowAdvancedModal(false)} 
      />
    </>
  )
}
