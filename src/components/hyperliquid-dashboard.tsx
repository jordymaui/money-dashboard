'use client'

import { TopStatsBar } from './dashboard/top-stats-bar'
import { SidebarPanel } from './dashboard/sidebar-panel'
import { PositionsTable } from './dashboard/positions-table'
import { HyperliquidChart } from './hyperliquid-chart'
import { HyperliquidPosition, AccentColor } from '@/types'
import { HyperliquidFill } from '@/lib/hyperliquid'

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
  
  // Positions and trades
  positions: HyperliquidPosition[]
  fills?: HyperliquidFill[]
  
  // Refresh countdown
  countdown?: number
  
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
  fills = [],
  countdown,
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
        countdown={countdown}
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
          positionCount={positions.length}
          accentColor={accentColor}
        />

        {/* Interactive Chart */}
        <HyperliquidChart accentColor={accentColor} />
      </div>

      {/* Positions Table */}
      <PositionsTable
        positions={positions}
        fills={fills}
        accentColor={accentColor}
      />
    </div>
  )
}
