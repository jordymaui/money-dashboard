'use client'

import { usePathname } from 'next/navigation'

const pageNames: Record<string, { title: string; icon: string }> = {
  '/': { title: 'MDASH', icon: 'fa-chart-pie' },
  '/hyperliquid': { title: 'Hyperliquid', icon: 'fa-chart-line' },
  '/polymarket': { title: 'Polymarket', icon: 'fa-bullseye' },
  '/football': { title: 'SDF', icon: 'fa-futbol' },
}

export function MobileHeader() {
  const pathname = usePathname()
  const page = pageNames[pathname] || pageNames['/']

  return (
    <header className="md:hidden sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo / Page Title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <i className="fa-solid fa-money-bill-trend-up text-white text-sm"></i>
          </div>
          <span className="text-lg font-bold text-white">{page.title}</span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => window.location.reload()} 
            className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800/50"
            title="Refresh"
          >
            <i className="fa-solid fa-arrows-rotate"></i>
          </button>
        </div>
      </div>
    </header>
  )
}
