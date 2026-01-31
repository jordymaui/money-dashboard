'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PolymarketPosition } from '@/types'

interface PolymarketPositionsTableProps {
  positions: PolymarketPosition[]
}

type TabType = 'All Positions' | 'Open' | 'Resolved' | 'Redeemable'

function formatCurrency(value: number, decimals = 2): string {
  return `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

function formatPercent(value: number): string {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${value.toFixed(1)}%`
}

export function PolymarketPositionsTable({ positions }: PolymarketPositionsTableProps) {
  const [selectedTab, setSelectedTab] = useState<TabType>('All Positions')

  // Filter positions based on tab
  const filteredPositions = positions.filter(pos => {
    switch (selectedTab) {
      case 'Open':
        return !pos.redeemable && pos.current_value > 0
      case 'Resolved':
        return pos.redeemable || pos.cur_price === 0 || pos.cur_price === 1
      case 'Redeemable':
        return pos.redeemable
      default:
        return true
    }
  })

  // Calculate totals
  const totalInitial = filteredPositions.reduce((sum, p) => sum + (p.initial_value || 0), 0)
  const totalCurrent = filteredPositions.reduce((sum, p) => sum + (p.current_value || 0), 0)
  const totalPnl = filteredPositions.reduce((sum, p) => sum + (p.cash_pnl || 0), 0)

  const tabs: { label: TabType; count: number; icon: string }[] = [
    { label: 'All Positions', count: positions.length, icon: 'fa-layer-group' },
    { label: 'Open', count: positions.filter(p => !p.redeemable && p.current_value > 0).length, icon: 'fa-clock' },
    { label: 'Resolved', count: positions.filter(p => p.redeemable || p.cur_price === 0 || p.cur_price === 1).length, icon: 'fa-check-circle' },
    { label: 'Redeemable', count: positions.filter(p => p.redeemable).length, icon: 'fa-gift' },
  ]

  return (
    <div className="bg-zinc-900/30 rounded-lg border border-zinc-800/50">
      {/* Summary Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 text-sm">
        <div className="flex items-center gap-6">
          <span className="text-zinc-400">
            <i className="fa-solid fa-bullseye mr-1.5 text-blue-400"></i>
            Positions <span className="text-white font-mono">{filteredPositions.length}</span>
          </span>
          <span className="text-zinc-400">
            <i className="fa-solid fa-dollar-sign mr-1.5"></i>
            Invested: <span className="text-white font-mono">{formatCurrency(totalInitial)}</span>
          </span>
          <span className="text-zinc-400">
            <i className="fa-solid fa-wallet mr-1.5"></i>
            Current: <span className="text-white font-mono">{formatCurrency(totalCurrent)}</span>
          </span>
          <span className={cn('font-mono', totalPnl >= 0 ? 'text-blue-400' : 'text-red-400')}>
            <i className={cn('fa-solid mr-1', totalPnl >= 0 ? 'fa-arrow-up' : 'fa-arrow-down')}></i>
            PnL: {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 border-b border-zinc-800/50">
        {tabs.map(({ label, count, icon }) => (
          <button
            key={label}
            onClick={() => setSelectedTab(label)}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[1px] flex items-center gap-2',
              selectedTab === label
                ? 'text-white border-blue-400'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            )}
          >
            <i className={cn('fa-solid text-[10px]', icon)}></i>
            {label}
            <span className={cn('text-xs px-1.5 py-0.5 rounded', 
              selectedTab === label ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-600'
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-bullseye mr-1.5"></i>Market
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-check mr-1.5"></i>Outcome
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-coins mr-1.5"></i>Shares
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-tag mr-1.5"></i>Avg Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-clock mr-1.5"></i>Current Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-dollar-sign mr-1.5"></i>Value
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-chart-line mr-1.5"></i>PnL
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500">
                <i className="fa-solid fa-info-circle mr-1.5"></i>Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPositions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                  <i className="fa-solid fa-inbox text-3xl mb-3 opacity-30 block"></i>
                  No positions in this category
                </td>
              </tr>
            ) : (
              filteredPositions.map((position) => {
                const isProfitable = (position.cash_pnl || 0) >= 0
                const isOpen = !position.redeemable && position.current_value > 0
                const isResolved = position.redeemable || position.cur_price === 0 || position.cur_price === 1

                return (
                  <tr key={position.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {position.icon && (
                          <img 
                            src={position.icon} 
                            alt="" 
                            className="w-6 h-6 rounded-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        )}
                        <div className="max-w-xs">
                          <div className="font-medium text-white truncate text-sm">
                            {position.title || 'Unknown Market'}
                          </div>
                          {position.end_date && position.end_date !== '1970-01-01' && (
                            <div className="text-xs text-zinc-500">
                              Ends: {new Date(position.end_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        position.outcome?.toLowerCase() === 'yes' || position.outcome?.toLowerCase() === 'no'
                          ? position.outcome.toLowerCase() === 'yes'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-red-500/20 text-red-400'
                          : 'bg-zinc-700 text-zinc-300'
                      )}>
                        {position.outcome || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white">
                      {position.size?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-400">
                      ${(position.avg_price || 0).toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white">
                      ${(position.cur_price || 0).toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-mono text-white">{formatCurrency(position.current_value || 0)}</div>
                      <div className="text-xs text-zinc-500">Cost: {formatCurrency(position.initial_value || 0)}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className={cn('font-mono font-medium', isProfitable ? 'text-blue-400' : 'text-red-400')}>
                        {isProfitable ? '+' : ''}{formatCurrency(position.cash_pnl || 0)}
                      </div>
                      <div className={cn('text-xs font-mono', isProfitable ? 'text-blue-400/70' : 'text-red-400/70')}>
                        {formatPercent(position.percent_pnl || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {position.redeemable ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                          <i className="fa-solid fa-gift mr-1"></i>Redeem
                        </span>
                      ) : isResolved ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-zinc-700 text-zinc-400">
                          <i className="fa-solid fa-check mr-1"></i>Resolved
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                          <i className="fa-solid fa-clock mr-1"></i>Open
                        </span>
                      )}
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
        <i className="fa-solid fa-bullseye mr-1 text-blue-400"></i>
        Polymarket Predictions • Powered by Polymarket API
      </div>
    </div>
  )
}
