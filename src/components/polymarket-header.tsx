'use client'

import { useState } from 'react'
import { PolymarketAdvancedModal } from './polymarket-advanced-modal'
import Link from 'next/link'

export function PolymarketHeader() {
  const [showAdvancedModal, setShowAdvancedModal] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-full text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <i className="fa-solid fa-arrow-left"></i> Back
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
            <i className="fa-solid fa-bullseye text-blue-400"></i>
            <span className="font-mono text-white">Polymarket</span>
            <i className="fa-solid fa-circle text-[6px] text-blue-400"></i>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAdvancedModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors"
          >
            <i className="fa-solid fa-chart-pie"></i> Advanced
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors">
            <i className="fa-solid fa-file-lines"></i> Report
          </button>
          <a 
            href="https://polymarket.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <i className="fa-solid fa-external-link"></i> Trade
          </a>
        </div>
      </div>

      <PolymarketAdvancedModal 
        isOpen={showAdvancedModal} 
        onClose={() => setShowAdvancedModal(false)} 
      />
    </>
  )
}
