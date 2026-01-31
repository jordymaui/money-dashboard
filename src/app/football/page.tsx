'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchSDFPortfolio, SDFPortfolio, SDF_WALLET, SDF_CONTRACTS, fetchFunPrice } from '@/lib/sdf'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const REFRESH_INTERVAL = 60 // seconds

function formatCurrency(value: number, decimals = 2): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function FootballPage() {
  const [portfolio, setPortfolio] = useState<SDFPortfolio | null>(null)
  const [funPrice, setFunPrice] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)

  const fetchData = useCallback(async () => {
    try {
      const [portfolioData, price] = await Promise.all([
        fetchSDFPortfolio(),
        fetchFunPrice()
      ])
      setPortfolio(portfolioData)
      setFunPrice(price)
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

  const funBalance = portfolio?.funToken?.balanceFormatted || 0
  const funValue = funBalance * funPrice
  const usdcBalance = portfolio?.usdcBalance?.balanceFormatted || 0
  const totalValue = funValue + usdcBalance
  const playerCount = portfolio?.playerShares.length || 0
  const fdfPlayers = portfolio?.playerShares.filter(p => p.gameType === 'FDF') || []
  const nflPlayers = portfolio?.playerShares.filter(p => p.gameType === 'NFL') || []

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-zinc-400">Loading SDF portfolio...</div>
          </div>
        </div>
      </div>
    )
  }

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
          {/* Refresh Timer */}
          <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-700/50">
            <div className="relative w-5 h-5">
              <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" fill="none" stroke="#3f3f46" strokeWidth="2" />
                <circle
                  cx="10" cy="10" r="8" fill="none" stroke="#ffffff" strokeWidth="2"
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
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-200 rounded-lg text-sm font-medium text-zinc-900 transition-colors"
          >
            <i className="fa-solid fa-futbol"></i> Play
          </a>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Portfolio Value */}
          <div className="lg:w-1/3">
            <div className="flex items-center gap-2 mb-2">
              <i className="fa-solid fa-futbol text-white"></i>
              <span className="text-zinc-400 text-sm">SDF Portfolio</span>
            </div>
            
            <div className="text-5xl font-bold text-white mb-2 tracking-tight">
              {formatCurrency(totalValue)}
            </div>
            
            <div className="text-sm text-zinc-500 mb-4">
              <i className="fa-solid fa-wallet mr-1"></i>
              {shortenAddress(SDF_WALLET)}
            </div>
            
            <a
              href={`https://basescan.org/address/${SDF_WALLET}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              <i className="fa-solid fa-external-link mr-1"></i>
              View on Basescan
            </a>
          </div>

          {/* Right Side - Stats */}
          <div className="lg:w-2/3 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-800/30 rounded-lg p-4">
              <div className="text-zinc-500 text-xs mb-1">
                <i className="fa-solid fa-coins mr-1"></i>
                $FUN Balance
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {formatNumber(funBalance, 0)}
              </div>
              <div className="text-xs text-zinc-500">
                ≈ {formatCurrency(funValue)}
              </div>
            </div>

            <div className="bg-zinc-800/30 rounded-lg p-4">
              <div className="text-zinc-500 text-xs mb-1">
                <i className="fa-solid fa-tag mr-1"></i>
                $FUN Price
              </div>
              <div className="text-xl font-bold text-white font-mono">
                ${funPrice.toFixed(4)}
              </div>
              <div className="text-xs text-emerald-400">
                <i className="fa-solid fa-chart-line mr-1"></i>
                Live
              </div>
            </div>

            <div className="bg-zinc-800/30 rounded-lg p-4">
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

            <div className="bg-zinc-800/30 rounded-lg p-4">
              <div className="text-zinc-500 text-xs mb-1">
                <i className="fa-solid fa-users mr-1"></i>
                Player Shares
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {playerCount}
              </div>
              <div className="text-xs text-zinc-500">
                {fdfPlayers.length} FDF · {nflPlayers.length} NFL
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Shares Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* FDF Players */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
            <h3 className="font-medium text-white flex items-center gap-2">
              <i className="fa-solid fa-futbol"></i>
              Football Players (FDF)
            </h3>
            <span className="text-xs text-zinc-500">{fdfPlayers.length} positions</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {fdfPlayers.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <i className="fa-solid fa-inbox text-3xl mb-3 opacity-30 block"></i>
                No FDF player shares
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-zinc-900">
                  <tr className="text-xs text-zinc-500 border-b border-zinc-800/50">
                    <th className="px-4 py-2 text-left">Player ID</th>
                    <th className="px-4 py-2 text-right">Shares</th>
                  </tr>
                </thead>
                <tbody>
                  {fdfPlayers.map((player, idx) => (
                    <tr key={`${player.tokenId}-${idx}`} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                            <i className="fa-solid fa-user text-emerald-400 text-xs"></i>
                          </div>
                          <div>
                            <div className="text-white text-sm font-mono">#{player.tokenId}</div>
                            <div className="text-xs text-zinc-500">{player.playerName || 'Unknown Player'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-white font-mono">{formatNumber(player.balanceFormatted, 2)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* NFL Players */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
            <h3 className="font-medium text-white flex items-center gap-2">
              <i className="fa-solid fa-football"></i>
              NFL Players
            </h3>
            <span className="text-xs text-zinc-500">{nflPlayers.length} positions</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {nflPlayers.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <i className="fa-solid fa-inbox text-3xl mb-3 opacity-30 block"></i>
                No NFL player shares
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-zinc-900">
                  <tr className="text-xs text-zinc-500 border-b border-zinc-800/50">
                    <th className="px-4 py-2 text-left">Player ID</th>
                    <th className="px-4 py-2 text-right">Shares</th>
                  </tr>
                </thead>
                <tbody>
                  {nflPlayers.map((player, idx) => (
                    <tr key={`${player.tokenId}-${idx}`} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center">
                            <i className="fa-solid fa-user text-orange-400 text-xs"></i>
                          </div>
                          <div>
                            <div className="text-white text-sm font-mono">#{player.tokenId}</div>
                            <div className="text-xs text-zinc-500">{player.playerName || 'Unknown Player'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-white font-mono">{formatNumber(player.balanceFormatted, 2)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Contract Info */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4">
        <h3 className="font-medium text-white mb-3 flex items-center gap-2">
          <i className="fa-solid fa-file-contract"></i>
          Contract Addresses
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-zinc-500 mb-1">$FUN Token</div>
            <a 
              href={`https://basescan.org/token/${SDF_CONTRACTS.FUN_TOKEN}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-mono"
            >
              {shortenAddress(SDF_CONTRACTS.FUN_TOKEN)} <i className="fa-solid fa-external-link ml-1"></i>
            </a>
          </div>
          <div>
            <div className="text-zinc-500 mb-1">FDF Players</div>
            <a 
              href={`https://basescan.org/address/${SDF_CONTRACTS.FDF_PLAYERS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-mono"
            >
              {shortenAddress(SDF_CONTRACTS.FDF_PLAYERS)} <i className="fa-solid fa-external-link ml-1"></i>
            </a>
          </div>
          <div>
            <div className="text-zinc-500 mb-1">NFL Players</div>
            <a 
              href={`https://basescan.org/address/${SDF_CONTRACTS.NFL_PLAYERS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 font-mono"
            >
              {shortenAddress(SDF_CONTRACTS.NFL_PLAYERS)} <i className="fa-solid fa-external-link ml-1"></i>
            </a>
          </div>
          <div>
            <div className="text-zinc-500 mb-1">Data Source</div>
            <span className="text-zinc-400 font-mono">
              <i className="fa-solid fa-cube mr-1"></i>
              Base Blockscout
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-xs text-zinc-600 text-center">
        <i className="fa-solid fa-bolt mr-1"></i>
        Live data from Base blockchain via Blockscout API
        {portfolio?.lastUpdated && (
          <span className="ml-2">
            · Last updated: {portfolio.lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  )
}
