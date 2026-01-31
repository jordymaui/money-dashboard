'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home', icon: 'fa-house' },
  { href: '/hyperliquid', label: 'Perps', icon: 'fa-chart-line', accent: 'emerald' },
  { href: '/polymarket', label: 'Predict', icon: 'fa-bullseye', accent: 'blue' },
  { href: '/football', label: 'SDF', icon: 'fa-futbol', accent: 'white' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50" />
      
      {/* Safe area padding for notched devices */}
      <div className="relative flex items-center justify-around px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          
          // Accent colors for active state
          const accentMap: Record<string, string> = {
            emerald: 'text-emerald-400',
            blue: 'text-blue-400',
            white: 'text-white',
          }
          const activeColor = item.accent ? accentMap[item.accent] : 'text-emerald-400'

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-3 px-4 min-w-[64px] transition-all duration-200',
                isActive ? 'scale-105' : 'opacity-60'
              )}
            >
              {/* Icon container with subtle glow when active */}
              <div className={cn(
                'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                isActive && 'bg-zinc-800/80'
              )}>
                <i className={cn(
                  'fa-solid text-lg',
                  item.icon,
                  isActive ? activeColor : 'text-zinc-400'
                )} />
                
                {/* Active indicator dot */}
                {isActive && (
                  <div className={cn(
                    'absolute -bottom-1 w-1 h-1 rounded-full',
                    item.accent === 'emerald' ? 'bg-emerald-400' :
                    item.accent === 'blue' ? 'bg-blue-400' :
                    item.accent === 'white' ? 'bg-white' :
                    'bg-emerald-400'
                  )} />
                )}
              </div>
              
              {/* Label */}
              <span className={cn(
                'text-[10px] font-medium mt-1 transition-colors',
                isActive ? 'text-white' : 'text-zinc-500'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
