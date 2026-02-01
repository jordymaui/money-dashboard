'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { HyperliquidHeader } from '@/components/hyperliquid-header'
import { HyperliquidDashboard } from '@/components/hyperliquid-dashboard'
import { HyperliquidAnalytics } from '@/components/hyperliquid-analytics'
import { fetchHyperliquidState, fetchHyperliquidFills, fetchAllMids, transformPositions, HyperliquidFill } from '@/lib/hyperliquid'
import { HyperliquidPosition } from '@/types'

const REFRESH_INTERVAL = 15 // seconds

export default function HyperliquidPage() {
  const [positions, setPositions] = useState<HyperliquidPosition[]>([])
  const [fills, setFills] = useState<HyperliquidFill[]>([])
  const [accountValue, setAccountValue] = useState(0)
  const [unrealizedPnl, setUnrealizedPnl] = useState(0)
  const [withdrawable, setWithdrawable] = useState(0)
  const [marginUsed, setMarginUsed] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      // Fetch live data from Hyperliquid API
      const [state, mids, fillsData] = await Promise.all([
        fetchHyperliquidState(),
        fetchAllMids(),
        fetchHyperliquidFills()
      ])

      if (state) {
        // Set account stats from live API
        setAccountValue(parseFloat(state.marginSummary.accountValue))
        setWithdrawable(parseFloat(state.marginSummary.withdrawable))
        setMarginUsed(parseFloat(state.marginSummary.totalMarginUsed))
        
        // Transform positions
        const transformedPositions = transformPositions(state, mids)
        setPositions(transformedPositions)
        
        // Calculate unrealized PnL from positions
        const totalUnrealizedPnl = transformedPositions.reduce((sum, p) => sum + p.unrealized_pnl, 0)
        setUnrealizedPnl(totalUnrealizedPnl)
      }

      // Set fills/trades
      setFills(fillsData)
      
      setLastUpdated(new Date())
      setCountdown(REFRESH_INTERVAL)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Countdown timer - ticks every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Trigger refresh when countdown hits 0
          fetchData()
          return REFRESH_INTERVAL
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [fetchData])

  // Calculate stats from positions
  const longPositions = positions.filter(p => p.size > 0)
  const shortPositions = positions.filter(p => p.size < 0)
  
  const longExposure = longPositions.reduce((sum, p) => sum + Math.abs(p.size * (p.current_price || p.entry_price)), 0)
  const shortExposure = shortPositions.reduce((sum, p) => sum + Math.abs(p.size * (p.current_price || p.entry_price)), 0)
  const totalPositionSize = longExposure + shortExposure
  
  // Calculate margin usage percentage
  const marginUsagePercent = accountValue > 0 ? (marginUsed / accountValue) * 100 : 0
  const effectiveLeverage = accountValue > 0 ? totalPositionSize / accountValue : 0

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <div className="text-zinc-400">Loading Hyperliquid data...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 md:px-4 py-3 md:py-6">
      {/* Sub-header with Advanced Stats Modal */}
      <HyperliquidHeader />

      <HyperliquidDashboard
        totalValue={accountValue}
        withdrawable={withdrawable}
        leverage={effectiveLeverage}
        totalPositionSize={totalPositionSize}
        perpEquity={accountValue}
        marginUsage={marginUsagePercent}
        longExposure={longExposure}
        shortExposure={shortExposure}
        positions={positions}
        fills={fills}
        countdown={countdown}
      />

      {/* Analytics Section */}
      <HyperliquidAnalytics fills={fills} />

      {/* Data Info */}
      <div className="mt-4 text-xs text-zinc-600 text-right">
        <i className="fa-solid fa-clock-rotate-left mr-1"></i>
        Last updated: {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
        <span className="ml-3 text-emerald-400/70">
          <i className="fa-solid fa-circle-check mr-1"></i>
          Live data from Hyperliquid API
        </span>
      </div>
    </div>
  )
}
