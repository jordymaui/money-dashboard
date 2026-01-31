'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { HyperliquidPosition, AccentColor } from '@/types'

interface PositionsTableProps {
  positions: HyperliquidPosition[]
  accentColor?: AccentColor
}

type TabType = 'Active Positions' | 'Open Orders' | 'Recent Fills' | 'Completed Trades' | 'TWAP' | 'Deposits & Withdrawals'
type MarketType = 'Perpetual' | 'Spot'

const tabs: { label: TabType; icon: string }[] = [
  { label: 'Active Positions', icon: 'fa-layer-group' },
  { label: 'Open Orders', icon: 'fa-clock' },
  { label: 'Recent Fills', icon: 'fa-check-circle' },
  { label: 'Completed Trades', icon: 'fa-flag-checkered' },
  { label: 'TWAP', icon: 'fa-timeline' },
  { label: 'Deposits & Withdrawals', icon: 'fa-money-bill-transfer' },
]

function formatCurrency(value: number, decimals = 2): string {
  return `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

function formatNumber(value: number, decimals = 4): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatPercent(value: number): string {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${value.toFixed(2)}%`
}

export function PositionsTable({ positions, accentColor = 'green' }: PositionsTableProps) {
  const [selectedTab, setSelectedTab] = useState<TabType>('Active Positions')
  const [marketType, setMarketType] = useState<MarketType>('Perpetual')

  // Calculate totals for header
  const totalLong = positions.filter(p => p.size > 0).reduce((sum, p) => sum + Math.abs(p.size * (p.current_price || p.entry_price)), 0)
  const totalShort = positions.filter(p => p.size < 0).reduce((sum, p) => sum + Math.abs(p.size * (p.current_price || p.entry_price)), 0)
  const totalUnrealizedPnl = positions.reduce((sum, p) => sum + p.unrealized_pnl, 0)

  return (
    <div className="bg-zinc-900/30 rounded-lg border border-zinc-800/50">
      {/* Summary Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 text-sm">
        <div className="flex items-center gap-6">
          <span className="text-zinc-400">
            <i className="fa-solid fa-layer-group mr-1.5"></i>
            Positions <span className="text-white font-mono">{positions.length}</span> <span className="text-zinc-600">(2 uni)</span>
          </span>
          <span className="text-zinc-400">
            <i className="fa-solid fa-sigma mr-1.5"></i>
            Total: <span className="text-white font-mono">{formatCurrency(totalLong + totalShort)}</span>
          </span>
          <span className="text-emerald-400">
            <i className="fa-solid fa-arrow-up mr-1"></i>
            Long: <span className="font-mono">{formatCurrency(totalLong)}</span> <span className="text-zinc-600">(0%)</span>
          </span>
          <span className="text-zinc-400">
            <i className="fa-solid fa-triangle-exclamation mr-1"></i>
          </span>
          <span className="text-red-400">
            <i className="fa-solid fa-arrow-down mr-1"></i>
            Short: <span className="font-mono">{formatCurrency(totalShort)}</span> <span className="text-zinc-600">(100%)</span>
          </span>
          <span className="text-zinc-400">
            <i className="fa-solid fa-chart-mixed mr-1.5"></i>
            uPnL: <span className={cn('font-mono', totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {formatCurrency(totalUnrealizedPnl)}
            </span> <span className="text-zinc-600">(100% max)</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between px-4 border-b border-zinc-800/50">
        <div className="flex items-center">
          {tabs.map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => setSelectedTab(label)}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[1px] flex items-center gap-2',
                selectedTab === label
                  ? 'text-white border-white'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              )}
            >
              <i className={cn('fa-solid text-[10px]', icon)}></i>
              {label}
              {label === 'Open Orders' && <span className="text-zinc-600">0</span>}
            </button>
          ))}
        </div>

        {/* Market Type Toggle */}
        <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
          {(['Perpetual', 'Spot'] as MarketType[]).map(type => (
            <button
              key={type}
              onClick={() => setMarketType(type)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5',
                marketType === type
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <i className={cn('fa-solid text-[10px]', type === 'Perpetual' ? 'fa-infinity' : 'fa-coins')}></i>
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-coins mr-1.5"></i>Asset
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-tag mr-1.5"></i>Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-dollar-sign mr-1.5"></i>Position Value / Size
                <i className="fa-solid fa-sort-down ml-1 text-zinc-600"></i>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-chart-line mr-1.5"></i>Unrealized PnL
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-right-to-bracket mr-1.5"></i>Entry Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-clock mr-1.5"></i>Current Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-skull-crossbones mr-1.5"></i>Liq. Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-lock mr-1.5"></i>Margin Used
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-percent mr-1.5"></i>Funding
              </th>
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                  <i className="fa-solid fa-inbox text-3xl mb-3 opacity-30 block"></i>
                  No open positions
                </td>
              </tr>
            ) : (
              positions.map((position) => {
                const isLong = position.size > 0
                const positionValue = Math.abs(position.size * (position.current_price || position.entry_price))
                const marginUsed = position.margin_used || (positionValue / position.leverage)
                const roe = marginUsed > 0 ? (position.unrealized_pnl / marginUsed) * 100 : 0
                const isProfitable = position.unrealized_pnl >= 0

                return (
                  <tr key={position.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold">
                          {position.coin.charAt(0)}
                        </div>
                        <span className="font-medium text-white">{position.coin}</span>
                        <span className="text-zinc-500 text-xs">{position.leverage}x</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1',
                        isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      )}>
                        <i className={cn('fa-solid', isLong ? 'fa-arrow-up' : 'fa-arrow-down')}></i>
                        {isLong ? 'LONG' : 'SHORT'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-mono text-white">{formatCurrency(positionValue)}</div>
                      <div className="text-xs text-zinc-500 font-mono">
                        {formatNumber(Math.abs(position.size))} {position.coin}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className={cn('font-mono font-medium inline-flex items-center gap-1', isProfitable ? 'text-emerald-400' : 'text-red-400')}>
                        <i className={cn('fa-solid text-[10px]', isProfitable ? 'fa-caret-up' : 'fa-caret-down')}></i>
                        {isProfitable ? '+' : '-'}{formatCurrency(position.unrealized_pnl)}
                      </div>
                      <div className={cn('text-xs font-mono', isProfitable ? 'text-emerald-400/70' : 'text-red-400/70')}>
                        {formatPercent(roe)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-400">
                      {formatCurrency(position.entry_price, position.entry_price < 1 ? 6 : 2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white">
                      {formatCurrency(position.current_price || position.entry_price, (position.current_price || position.entry_price) < 1 ? 6 : 2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-400">
                      {position.liquidation_price ? formatCurrency(position.liquidation_price) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white">
                      {formatCurrency(marginUsed)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-400">
                      ${(position.funding || 0).toFixed(2)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 text-xs text-zinc-600 text-center border-t border-zinc-800/50">
        <i className="fa-solid fa-bolt mr-1"></i>
        Hyper-Batch_info • Powered by Hyperliquid
      </div>
    </div>
  )
}
