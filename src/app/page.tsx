'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchHyperliquidState, transformPositions, fetchAllMids } from '@/lib/hyperliquid'
import { fetchSDFPortfolio } from '@/lib/sdf'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const REFRESH_INTERVAL = 60 // seconds

interface PlatformData {
  hyperliquid: { accountValue: number; unrealizedPnl: number; positions: number }
  polymarket: { value: number; pnl: number; positions: number }
  sdf: { value: number; pnl: number; positions: number }
}

export default function Home() {
  const [data, setData] = useState<PlatformData>({
    hyperliquid: { accountValue: 0, unrealizedPnl: 0, positions: 0 },
    polymarket: { value: 0, pnl: 0, positions: 0 },
    sdf: { value: 0, pnl: 0, positions: 0 }
  })
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      // Fetch Hyperliquid data from live API
      const [state, mids] = await Promise.all([
        fetchHyperliquidState(),
        fetchAllMids()
      ])

      let hyperliquidData = { accountValue: 0, unrealizedPnl: 0, positions: 0 }
      
      if (state) {
        const positions = transformPositions(state, mids)
        const totalUnrealizedPnl = positions.reduce((sum, p) => sum + p.unrealized_pnl, 0)
        
        hyperliquidData = {
          accountValue: parseFloat(state.marginSummary.accountValue),
          unrealizedPnl: totalUnrealizedPnl,
          positions: positions.length
        }
      }

      // Fetch Polymarket data from Supabase
      const { data: polyPositions } = await supabase
        .from('polymarket_positions')
        .select('*')
        .eq('redeemable', false)

      const { data: closedPositions } = await supabase
        .from('polymarket_closed_positions')
        .select('realized_pnl')

      const openPositions = polyPositions?.filter(p => (p.current_value || 0) > 0) || []
      const portfolioValue = openPositions.reduce((sum, p) => sum + (p.current_value || 0), 0)
      const realizedPnl = closedPositions?.reduce((sum, p) => sum + (p.realized_pnl || 0), 0) || 0
      const unrealizedPnl = polyPositions?.reduce((sum, p) => sum + (p.cash_pnl || 0), 0) || 0

      // Fetch SDF data from Base blockchain (includes FUN + USDC + Players)
      let sdfData = { value: 0, pnl: 0, positions: 0 }
      try {
        const sdfPortfolio = await fetchSDFPortfolio()
        sdfData = {
          value: sdfPortfolio.totalPortfolioValue || 0,
          pnl: 0, // No historical PnL tracking yet
          positions: sdfPortfolio.playerShares.length
        }
      } catch (e) {
        console.error('Error fetching SDF data:', e)
      }

      setData({
        hyperliquid: hyperliquidData,
        polymarket: {
          value: portfolioValue,
          pnl: realizedPnl + unrealizedPnl,
          positions: openPositions.length
        },
        sdf: sdfData
      })

      setLastUpdated(new Date())
      setCountdown(REFRESH_INTERVAL)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchData()
          return REFRESH_INTERVAL
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [fetchData])

  const totalValue = data.hyperliquid.accountValue + data.polymarket.value + data.sdf.value
  const totalUnrealizedPnl = data.hyperliquid.unrealizedPnl + data.polymarket.pnl + data.sdf.pnl
  const totalPositions = data.hyperliquid.positions + data.polymarket.positions + data.sdf.positions
  const activePlatforms = (data.hyperliquid.accountValue > 0 ? 1 : 0) + (data.polymarket.value > 0 ? 1 : 0) + (data.sdf.value > 0 ? 1 : 0)

  const platforms = [
    {
      id: 'sdf',
      name: 'Sport.Fun',
      icon: 'fa-futbol',
      href: '/football',
      accentColor: 'emerald',
      value: data.sdf.value,
      pnl: data.sdf.pnl,
      positions: data.sdf.positions,
      status: 'live',
      description: 'Fantasy sports'
    },
    {
      id: 'hyperliquid',
      name: 'Hyperliquid',
      icon: 'fa-chart-line',
      href: '/hyperliquid',
      accentColor: 'white',
      value: data.hyperliquid.accountValue,
      pnl: data.hyperliquid.unrealizedPnl,
      positions: data.hyperliquid.positions,
      status: 'live',
      description: 'Perpetual trading'
    },
    {
      id: 'polymarket',
      name: 'Polymarket',
      icon: 'fa-bullseye',
      href: '/polymarket',
      accentColor: 'blue',
      value: data.polymarket.value,
      pnl: data.polymarket.pnl,
      positions: data.polymarket.positions,
      status: 'live',
      description: 'Prediction markets'
    }
  ]

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <div className="text-zinc-400">Loading portfolio data...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Hero Section with Refresh Timer */}
      <div className="mb-4 md:mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">
            <i className="fa-solid fa-chart-pie mr-2 md:mr-3 text-emerald-400 hidden md:inline"></i>
            Portfolio
          </h1>
          <p className="text-zinc-400 text-sm md:text-base hidden md:block">Track all your positions across platforms</p>
        </div>
        
        {/* Refresh Timer */}
        <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-2 md:px-3 py-1.5 md:py-2 border border-zinc-700/50">
          <div className="relative w-5 h-5">
            <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="#3f3f46"
                strokeWidth="2"
              />
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
                strokeDasharray={`${(countdown / REFRESH_INTERVAL) * 50.27} 50.27`}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-zinc-400 text-xs md:text-sm font-mono">{countdown}s</span>
        </div>
      </div>

      {/* Total Value Card */}
      <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-xl md:rounded-2xl border border-zinc-700/50 p-4 md:p-6 mb-4 md:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-xs md:text-sm mb-1">
              <i className="fa-solid fa-sack-dollar mr-1 md:mr-2"></i>
              Total Value
            </p>
            <p className="text-2xl md:text-4xl font-bold font-mono text-white">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-2 md:gap-4 mt-1 md:mt-2">
              <span className={cn(
                'flex items-center gap-1 text-xs md:text-sm font-mono',
                totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                <i className={cn(
                  'fa-solid text-[10px] md:text-xs',
                  totalUnrealizedPnl >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'
                )}></i>
                {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-zinc-500 text-xs md:text-sm hidden md:inline">Unrealized PnL</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-xs md:text-sm hidden md:block">
              <i className="fa-solid fa-plug mr-2"></i>
              Active
            </p>
            <p className="text-xl md:text-2xl font-bold text-white">{activePlatforms}<span className="text-zinc-500">/3</span></p>
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

      {/* Quick Stats - Hidden on mobile for cleaner look */}
      <div className="mt-6 md:mt-8 hidden md:grid grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4">
          <p className="text-zinc-500 text-xs mb-1">
            <i className="fa-solid fa-boxes-stacked mr-1"></i>
            Total Positions
          </p>
          <p className="text-xl font-bold font-mono text-white">{totalPositions}</p>
        </div>
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4">
          <p className="text-zinc-500 text-xs mb-1">
            <i className="fa-solid fa-store mr-1"></i>
            Active Markets
          </p>
          <p className="text-xl font-bold font-mono text-white">{activePlatforms}</p>
        </div>
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4">
          <p className="text-zinc-500 text-xs mb-1">
            <i className="fa-solid fa-hourglass-half mr-1"></i>
            Coming Soon
          </p>
          <p className="text-xl font-bold font-mono text-white">{3 - activePlatforms}</p>
        </div>
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4">
          <p className="text-zinc-500 text-xs mb-1">
            <i className="fa-solid fa-clock-rotate-left mr-1"></i>
            Last Update
          </p>
          <p className="text-sm font-mono text-zinc-400">
            {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}
          </p>
        </div>
      </div>
    </div>
  )
}
