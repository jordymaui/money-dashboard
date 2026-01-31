'use client'

import { TopStatsBar } from './top-stats-bar'
import { SidebarPanel } from './sidebar-panel'
import { PnLChart } from './pnl-chart'
import { PositionsTable } from './positions-table'
import { HyperliquidPosition, ChartDataPoint, AccentColor } from '@/types'

interface DashboardLayoutProps {
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
  
  // Chart
  chartData: ChartDataPoint[]
  currentPnl: number
  
  // Positions
  positions: HyperliquidPosition[]
  
  // Theming
  accentColor?: AccentColor
  title?: string
}

export function DashboardLayout({
  totalValue,
  withdrawable,
  leverage,
  totalPositionSize,
  perpEquity,
  spotValue = 0,
  marginUsage,
  longExposure,
  shortExposure,
  chartData,
  currentPnl,
  positions,
  accentColor = 'green',
  title = 'PnL (Combined)'
}: DashboardLayoutProps) {
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

        {/* Chart Area */}
        <PnLChart
          data={chartData}
          currentPnl={currentPnl}
          accentColor={accentColor}
          title={title}
        />
      </div>

      {/* Positions Table */}
      <PositionsTable
        positions={positions}
        accentColor={accentColor}
      />
    </div>
  )
}
