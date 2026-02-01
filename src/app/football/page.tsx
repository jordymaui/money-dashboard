'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchSDFPortfolio, SDFPortfolio, SDF_WALLET, SDF_CONTRACTS } from '@/lib/sdf'
import Link from 'next/link'

const REFRESH_INTERVAL = 60

function formatCurrency(value: number, decimals = 2): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function FootballPage() {
  const [portfolio, setPortfolio] = useState<SDFPortfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const [activeTab, setActiveTab] = useState<'FDF' | 'NFL'>('FDF')

  const fetchData = useCallback(async () => {
    try {
      const portfolioData = await fetchSDFPortfolio()
      setPortfolio(portfolioData)
      setCountdown(REFRESH_INTERVAL)
    } catch (error) {
      console.error('Error fetching SDF data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <div className="text-zinc-400">Loading SDF portfolio...</div>
          </div>
        </div>
      </div>
    )
  }

  const funBalance = portfolio?.funToken?.balanceFormatted || 0
  const funPrice = portfolio?.funToken?.priceUsd || 0
  const funValue = portfolio?.funToken?.valueUsd || 0
  const usdcBalance = portfolio?.usdcBalance?.balanceFormatted || 0
  const playersValue = portfolio?.totalPlayersValue || 0
  const totalValue = portfolio?.totalPortfolioValue || 0
  
  const fdfPlayers = portfolio?.playerShares.filter(p => p.gameType === 'FDF') || []
  const nflPlayers = portfolio?.playerShares.filter(p => p.gameType === 'NFL') || []
  const activePlayers = activeTab === 'FDF' ? fdfPlayers : nflPlayers

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-full text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <i className="fa-solid fa-arrow-left"></i> Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-700/50">
            <div className="relative w-5 h-5">
              <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" fill="none" stroke="#3f3f46" strokeWidth="2" />
                <circle
                  cx="10" cy="10" r="8" fill="none" stroke="#22c55e" strokeWidth="2"
                  strokeDasharray={`${(countdown / REFRESH_INTERVAL) * 50.27} 50.27`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-zinc-400 text-sm font-mono">{countdown}s</span>
          </div>
          <a 
            href="https://sport.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <i className="fa-solid fa-futbol"></i> Play
          </a>
        </div>
      </div>

      {/* Main Value Header - Total Left, $FUN Right */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          {/* Left - Total SDF Value */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <i className="fa-solid fa-futbol text-emerald-400"></i>
              <span className="text-zinc-400 text-sm">Total SDF Portfolio</span>
            </div>
            <div className="text-5xl font-bold text-white tracking-tight">
              {formatCurrency(totalValue)}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-zinc-500">
                <i className="fa-solid fa-wallet mr-1"></i>
                {shortenAddress(SDF_WALLET)}
              </span>
              <a
                href={`https://basescan.org/address/${SDF_WALLET}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-600 hover:text-emerald-400 transition-colors"
              >
                <i className="fa-solid fa-external-link"></i>
              </a>
            </div>
          </div>
          
          {/* Right - $FUN Value */}
          <div className="text-right">
            <div className="text-zinc-400 text-sm mb-2">$FUN Holdings</div>
            <div className="text-3xl font-bold text-white">
              {formatCurrency(funValue)}
            </div>
            <div className="text-sm text-zinc-500">
              {formatNumber(funBalance)} FUN @ ${funPrice.toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4">
          <div className="text-zinc-500 text-xs mb-1">
            <i className="fa-solid fa-users mr-1"></i>
            Player Value
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {formatCurrency(playersValue)}
          </div>
          <div className="text-xs text-zinc-500">
            {fdfPlayers.length + nflPlayers.length} players
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4">
          <div className="text-zinc-500 text-xs mb-1">
            <i className="fa-solid fa-coins mr-1"></i>
            $FUN Balance
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {formatNumber(funBalance)}
          </div>
          <div className="text-xs text-emerald-400">
            <i className="fa-solid fa-chart-line mr-1"></i>
            ${funPrice.toFixed(4)}
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4">
          <div className="text-zinc-500 text-xs mb-1">
            <i className="fa-solid fa-dollar-sign mr-1"></i>
            USDC Balance
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {formatCurrency(usdcBalance)}
          </div>
          <div className="text-xs text-zinc-500">
            In-game
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4">
          <div className="text-zinc-500 text-xs mb-1">
            <i className="fa-solid fa-trophy mr-1"></i>
            Top Holding
          </div>
          <div className="text-xl font-bold text-white truncate">
            {fdfPlayers[0]?.playerName || '—'}
          </div>
          <div className="text-xs text-zinc-500">
            {fdfPlayers[0] ? formatCurrency(fdfPlayers[0].valueUsd || 0) : '—'}
          </div>
        </div>
      </div>

      {/* Player Holdings - Tab Toggle */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden mb-6">
        {/* Tab Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
          <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('FDF')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'FDF' 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-futbol mr-2"></i>
              Football ({fdfPlayers.length})
            </button>
            <button
              onClick={() => setActiveTab('NFL')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'NFL' 
                  ? 'bg-orange-600 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-football mr-2"></i>
              NFL ({nflPlayers.length})
            </button>
          </div>
          <span className="text-xs text-zinc-500">
            {activeTab === 'FDF' 
              ? formatCurrency(fdfPlayers.reduce((s, p) => s + (p.valueUsd || 0), 0))
              : formatCurrency(nflPlayers.reduce((s, p) => s + (p.valueUsd || 0), 0))
            } total
          </span>
        </div>
        
        {/* Player Grid */}
        <div className="p-4">
          {activePlayers.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <i className="fa-solid fa-inbox text-3xl mb-3 opacity-30 block"></i>
              No {activeTab === 'FDF' ? 'football' : 'NFL'} players
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {activePlayers.map((player, idx) => (
                <div 
                  key={player.tokenId}
                  className="bg-zinc-800/30 rounded-lg p-3 hover:bg-zinc-800/50 transition-colors border border-zinc-700/30"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activeTab === 'FDF' 
                        ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10' 
                        : 'bg-gradient-to-br from-orange-500/20 to-orange-600/10'
                    }`}>
                      <span className="text-white font-bold text-sm">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm truncate">{player.playerName}</div>
                      <div className="text-xs text-zinc-500">#{player.tokenId}</div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">{formatNumber(player.balanceFormatted)} shares</span>
                    {player.priceUsd && player.priceUsd > 0 ? (
                      <span className="text-emerald-400 font-mono">{formatCurrency(player.valueUsd || 0)}</span>
                    ) : (
                      <span className="text-zinc-600">No pool</span>
                    )}
                  </div>
                  {player.priceUsd && player.priceUsd > 0 && (
                    <div className="mt-1 text-xs text-zinc-500">
                      @ ${player.priceUsd.toFixed(4)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity (Placeholder for now) */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
        <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
          <h3 className="font-medium text-white flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-zinc-500"></i>
            Recent Activity
          </h3>
          <span className="text-xs text-zinc-500">Coming soon</span>
        </div>
        <div className="p-8 text-center text-zinc-600">
          <i className="fa-solid fa-arrows-rotate text-2xl mb-2 opacity-30 block"></i>
          <p className="text-sm">Swap & trade history will appear here</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-xs text-zinc-600 text-center">
        <i className="fa-solid fa-bolt mr-1"></i>
        Live prices from Base DEX via Multicall3 • Auto-refresh every 60s
      </div>
    </div>
  )
}
