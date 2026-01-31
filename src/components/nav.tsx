'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Overview', icon: 'fa-chart-pie' },
  { href: '/hyperliquid', label: 'Hyperliquid', icon: 'fa-chart-line', accent: 'green' },
  { href: '/polymarket', label: 'Polymarket', icon: 'fa-bullseye', accent: 'blue' },
  { href: '/football', label: 'SDF', icon: 'fa-futbol', accent: 'white' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-zinc-800/50 bg-zinc-950">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Left side - Logo and Nav */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <i className="fa-solid fa-money-bill-trend-up text-white text-sm"></i>
              </div>
              <span className="text-lg font-bold text-white">MoneyDash</span>
            </Link>

            {/* Nav Items */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-zinc-800/70 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    )}
                  >
                    <i className={cn('fa-solid', item.icon, 'w-4 text-center')}></i>
                    {item.label}
                    {item.href !== '/' && <i className="fa-solid fa-chevron-down text-[10px] opacity-50"></i>}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-zinc-400 hover:text-white transition-colors">
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
            <button className="p-2 text-zinc-400 hover:text-white transition-colors">
              <i className="fa-solid fa-gear"></i>
            </button>
            <div className="ml-2 px-3 py-1.5 bg-zinc-800/50 rounded-full text-xs text-zinc-400 font-mono flex items-center gap-2">
              <i className="fa-solid fa-wallet text-emerald-400"></i>
              0x...29eD
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
