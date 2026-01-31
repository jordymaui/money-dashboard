import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { cn } from '@/lib/utils'

async function getLatestHyperliquidData() {
  const { data: snapshot } = await supabase
    .from('hyperliquid_snapshots')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (!snapshot) return { accountValue: 0, unrealizedPnl: 0, positions: 0 }

  const { data: positions } = await supabase
    .from('hyperliquid_positions')
    .select('id')
    .eq('snapshot_id', snapshot.id)

  return {
    accountValue: snapshot.account_value || 0,
    unrealizedPnl: snapshot.unrealized_pnl || 0,
    positions: positions?.length || 0
  }
}

export const revalidate = 60

export default async function Home() {
  const hyperliquidData = await getLatestHyperliquidData()
  
  // Calculate total portfolio value
  const totalValue = hyperliquidData.accountValue + 0 + 0 // Polymarket + SDF are $0 for now

  const platforms = [
    {
      id: 'hyperliquid',
      name: 'Hyperliquid',
      icon: 'fa-chart-line',
      href: '/hyperliquid',
      accentColor: 'emerald',
      value: hyperliquidData.accountValue,
      pnl: hyperliquidData.unrealizedPnl,
      positions: hyperliquidData.positions,
      status: 'live',
      description: 'Perpetual trading'
    },
    {
      id: 'polymarket',
      name: 'Polymarket',
      icon: 'fa-bullseye',
      href: '/polymarket',
      accentColor: 'blue',
      value: 0,
      pnl: 0,
      positions: 0,
      status: 'coming-soon',
      description: 'Prediction markets'
    },
    {
      id: 'sdf',
      name: 'SDF',
      icon: 'fa-futbol',
      href: '/football',
      accentColor: 'white',
      value: 0,
      pnl: 0,
      positions: 0,
      status: 'coming-soon',
      description: 'Football.fun'
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          <i className="fa-solid fa-chart-pie mr-3 text-emerald-400"></i>
          Portfolio Overview
        </h1>
        <p className="text-zinc-400">Track all your positions across platforms</p>
      </div>

      {/* Total Value Card */}
      <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-2xl border border-zinc-700/50 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm mb-1">
              <i className="fa-solid fa-sack-dollar mr-2"></i>
              Total Portfolio Value
            </p>
            <p className="text-4xl font-bold font-mono text-white">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className={cn(
                'flex items-center gap-1 text-sm font-mono',
                hyperliquidData.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                <i className={cn(
                  'fa-solid',
                  hyperliquidData.unrealizedPnl >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'
                )}></i>
                {hyperliquidData.unrealizedPnl >= 0 ? '+' : ''}${hyperliquidData.unrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-zinc-500 text-sm">Unrealized PnL</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-sm">
              <i className="fa-solid fa-plug mr-2"></i>
              Active Platforms
            </p>
            <p className="text-2xl font-bold text-white">1 / 3</p>
          </div>
        </div>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map((platform) => {
          const isProfitable = platform.pnl >= 0
          const isLive = platform.status === 'live'
          
          const accentColorMap = {
            emerald: {
              gradient: 'from-emerald-500/20 to-emerald-600/5',
              border: 'border-emerald-500/30 hover:border-emerald-500/50',
              text: 'text-emerald-400',
              bg: 'bg-emerald-500',
              dot: 'bg-emerald-400'
            },
            blue: {
              gradient: 'from-blue-500/20 to-blue-600/5',
              border: 'border-blue-500/30 hover:border-blue-500/50',
              text: 'text-blue-400',
              bg: 'bg-blue-500',
              dot: 'bg-blue-400'
            },
            white: {
              gradient: 'from-white/10 to-white/5',
              border: 'border-white/20 hover:border-white/40',
              text: 'text-white',
              bg: 'bg-white',
              dot: 'bg-white'
            }
          }
          
          const colors = accentColorMap[platform.accentColor as keyof typeof accentColorMap]

          return (
            <Link key={platform.id} href={platform.href}>
              <div className={cn(
                'relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full',
                colors.border,
                'bg-gradient-to-br',
                colors.gradient,
                'bg-zinc-900/50'
              )}>
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {isLive ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 rounded-full">
                      <i className="fa-solid fa-circle text-[6px] text-emerald-400 animate-pulse"></i>
                      <span className="text-xs text-emerald-400 font-medium">Live</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-700/50 rounded-full">
                      <i className="fa-solid fa-clock text-[10px] text-zinc-400"></i>
                      <span className="text-xs text-zinc-400 font-medium">Coming Soon</span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      colors.bg + '/20'
                    )}>
                      <i className={cn('fa-solid', platform.icon, 'text-xl', colors.text)}></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{platform.name}</h3>
                      <p className="text-xs text-zinc-500">{platform.description}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">
                        <i className="fa-solid fa-wallet mr-1"></i>
                        Account Value
                      </p>
                      <p className={cn('text-2xl font-bold font-mono', colors.text)}>
                        ${platform.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-500 text-xs mb-1">
                          <i className="fa-solid fa-chart-mixed mr-1"></i>
                          Unrealized PnL
                        </p>
                        <p className={cn(
                          'text-sm font-mono font-medium',
                          isProfitable ? 'text-emerald-400' : 'text-red-400'
                        )}>
                          {isProfitable ? '+' : ''}${platform.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500 text-xs mb-1">
                          <i className="fa-solid fa-layer-group mr-1"></i>
                          Positions
                        </p>
                        <p className="text-sm font-mono text-white">{platform.positions}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      View Dashboard <i className="fa-solid fa-arrow-right ml-1"></i>
                    </span>
                    <div className={cn('w-2 h-2 rounded-full', colors.dot)} />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4">
          <p className="text-zinc-500 text-xs mb-1">
            <i className="fa-solid fa-boxes-stacked mr-1"></i>
            Total Positions
          </p>
          <p className="text-xl font-bold font-mono text-white">{hyperliquidData.positions}</p>
        </div>
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4">
          <p className="text-zinc-500 text-xs mb-1">
            <i className="fa-solid fa-store mr-1"></i>
            Active Markets
          </p>
          <p className="text-xl font-bold font-mono text-white">1</p>
        </div>
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4">
          <p className="text-zinc-500 text-xs mb-1">
            <i className="fa-solid fa-hourglass-half mr-1"></i>
            Coming Soon
          </p>
          <p className="text-xl font-bold font-mono text-white">2</p>
        </div>
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4">
          <p className="text-zinc-500 text-xs mb-1">
            <i className="fa-solid fa-clock-rotate-left mr-1"></i>
            Last Update
          </p>
          <p className="text-sm font-mono text-zinc-400">Just now</p>
        </div>
      </div>
    </div>
  )
}
