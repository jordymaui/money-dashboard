'use client'

import { TopStatsBar } from './dashboard/top-stats-bar'
import { SidebarPanel } from './dashboard/sidebar-panel'
import { PositionsTable } from './dashboard/positions-table'
import { HyperliquidChart } from './hyperliquid-chart'
import { HyperliquidPosition, AccentColor } from '@/types'

interface HyperliquidDashboardProps {
  // Stats
  totalValue: number
  withdrawable: number
  leverage?: number
  totalPositionSize: number
  perpEquity: number
  spotValue?: number
  marginUsage: number
  
  // Exposure
  longExposure: number
  shortExposure: number
  
  // Positions
  positions: HyperliquidPosition[]
  
  // Theming
  accentColor?: AccentColor
}

export function HyperliquidDashboard({
  totalValue,
  withdrawable,
  leverage,
  totalPositionSize,
  perpEquity,
  spotValue = 0,
  marginUsage,
  longExposure,
  shortExposure,
  positions,
  accentColor = 'green'
}: HyperliquidDashboardProps) {
  return (
    <div className="space-y-4">
      {/* Top Stats Bar */}
      <TopStatsBar
        totalValue={totalValue}
        withdrawable={withdrawable}
        leverage={leverage}
        totalPositionSize={totalPositionSize}
        perpEquity={perpEquity}
        spotValue={spotValue}
        accentColor={accentColor}
      />

      {/* Main Content Area */}
      <div className="flex gap-4">
        {/* Sidebar Panel */}
        <SidebarPanel
          perpEquity={perpEquity}
          marginUsage={marginUsage}
          longExposure={longExposure}
          shortExposure={shortExposure}
          totalPositionValue={totalPositionSize}
          accentColor={accentColor}
        />

        {/* Interactive Chart */}
        <HyperliquidChart accentColor={accentColor} />
      </div>

      {/* Positions Table */}
      <PositionsTable
        positions={positions}
        accentColor={accentColor}
      />
    </div>
  )
}
