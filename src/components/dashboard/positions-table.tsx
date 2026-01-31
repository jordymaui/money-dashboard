'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { HyperliquidPosition, AccentColor } from '@/types'
import { HyperliquidFill } from '@/lib/hyperliquid'

interface PositionsTableProps {
  positions: HyperliquidPosition[]
  fills?: HyperliquidFill[]
  accentColor?: AccentColor
}

type TabType = 'Active Positions' | 'Completed Trades'

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

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Mobile Position Accordion Item
function PositionAccordionItem({ position, isOpen, onToggle }: { 
  position: HyperliquidPosition
  isOpen: boolean
  onToggle: () => void 
}) {
  const isLong = position.size > 0
  const positionValue = Math.abs(position.size * (position.current_price || position.entry_price))
  const marginUsed = position.margin_used || (positionValue / position.leverage)
  const roe = marginUsed > 0 ? (position.unrealized_pnl / marginUsed) * 100 : 0
  const isProfitable = position.unrealized_pnl >= 0

  return (
    <div className="border-b border-zinc-800/50">
      {/* Accordion Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
            isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          )}>
            <i className={cn('fa-solid', isLong ? 'fa-arrow-up' : 'fa-arrow-down')}></i>
          </span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{position.coin}</span>
              <span className="text-zinc-500 text-xs">{position.leverage}x</span>
            </div>
            <div className="text-xs text-zinc-500">
              {formatCurrency(positionValue)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={cn(
              'font-mono text-sm font-medium',
              isProfitable ? 'text-emerald-400' : 'text-red-400'
            )}>
              {isProfitable ? '+' : ''}{formatCurrency(position.unrealized_pnl)}
            </div>
            <div className={cn(
              'text-xs font-mono',
              isProfitable ? 'text-emerald-400/70' : 'text-red-400/70'
            )}>
              {formatPercent(roe)}
            </div>
          </div>
          <i className={cn(
            'fa-solid fa-chevron-down text-zinc-500 transition-transform',
            isOpen && 'rotate-180'
          )}></i>
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="px-4 pb-4 pt-1 bg-zinc-800/20">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-zinc-800/30 rounded-lg p-2.5">
              <div className="text-zinc-500 text-xs mb-1">Entry Price</div>
              <div className="font-mono text-white">{formatCurrency(position.entry_price, position.entry_price < 1 ? 6 : 2)}</div>
            </div>
            <div className="bg-zinc-800/30 rounded-lg p-2.5">
              <div className="text-zinc-500 text-xs mb-1">Current Price</div>
              <div className="font-mono text-white">{formatCurrency(position.current_price || position.entry_price, (position.current_price || position.entry_price) < 1 ? 6 : 2)}</div>
            </div>
            <div className="bg-zinc-800/30 rounded-lg p-2.5">
              <div className="text-zinc-500 text-xs mb-1">Size</div>
              <div className="font-mono text-white">{formatNumber(Math.abs(position.size))} {position.coin}</div>
            </div>
            <div className="bg-zinc-800/30 rounded-lg p-2.5">
              <div className="text-zinc-500 text-xs mb-1">Margin Used</div>
              <div className="font-mono text-white">{formatCurrency(marginUsed)}</div>
            </div>
            {position.liquidation_price && (
              <div className="bg-zinc-800/30 rounded-lg p-2.5 col-span-2">
                <div className="text-zinc-500 text-xs mb-1">
                  <i className="fa-solid fa-skull-crossbones mr-1 text-red-400"></i>
                  Liquidation Price
                </div>
                <div className="font-mono text-red-400">{formatCurrency(position.liquidation_price)}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Mobile Trade Accordion Item
function TradeAccordionItem({ trade, isOpen, onToggle }: { 
  trade: HyperliquidFill
  isOpen: boolean
  onToggle: () => void 
}) {
  const isBuy = trade.side === 'B'
  const size = parseFloat(trade.sz)
  const price = parseFloat(trade.px)
  const closedPnl = parseFloat(trade.closedPnl)
  const fee = parseFloat(trade.fee)
  const isProfitable = closedPnl >= 0

  return (
    <div className="border-b border-zinc-800/50">
      {/* Accordion Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
            isBuy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          )}>
            <i className={cn('fa-solid', isBuy ? 'fa-arrow-up' : 'fa-arrow-down')}></i>
          </span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{trade.coin}</span>
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded',
                isBuy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              )}>
                {isBuy ? 'BUY' : 'SELL'}
              </span>
            </div>
            <div className="text-xs text-zinc-500">
              {formatTime(trade.time)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={cn(
              'font-mono text-sm font-medium',
              isProfitable ? 'text-emerald-400' : 'text-red-400'
            )}>
              {isProfitable ? '+' : ''}{formatCurrency(closedPnl)}
            </div>
          </div>
          <i className={cn(
            'fa-solid fa-chevron-down text-zinc-500 transition-transform',
            isOpen && 'rotate-180'
          )}></i>
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="px-4 pb-4 pt-1 bg-zinc-800/20">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-zinc-800/30 rounded-lg p-2.5">
              <div className="text-zinc-500 text-xs mb-1">Price</div>
              <div className="font-mono text-white">{formatCurrency(price, price < 1 ? 6 : 2)}</div>
            </div>
            <div className="bg-zinc-800/30 rounded-lg p-2.5">
              <div className="text-zinc-500 text-xs mb-1">Size</div>
              <div className="font-mono text-white">{formatNumber(size)}</div>
            </div>
            <div className="bg-zinc-800/30 rounded-lg p-2.5">
              <div className="text-zinc-500 text-xs mb-1">Value</div>
              <div className="font-mono text-white">{formatCurrency(size * price)}</div>
            </div>
            <div className="bg-zinc-800/30 rounded-lg p-2.5">
              <div className="text-zinc-500 text-xs mb-1">Fee</div>
              <div className="font-mono text-zinc-400">${fee.toFixed(4)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function PositionsTable({ positions, fills = [], accentColor = 'green' }: PositionsTableProps) {
  const [selectedTab, setSelectedTab] = useState<TabType>('Active Positions')
  const [openPositionId, setOpenPositionId] = useState<number | null>(null)
  const [openTradeId, setOpenTradeId] = useState<string | null>(null)

  // Calculate totals
  const totalLong = positions.filter(p => p.size > 0).reduce((sum, p) => sum + Math.abs(p.size * (p.current_price || p.entry_price)), 0)
  const totalShort = positions.filter(p => p.size < 0).reduce((sum, p) => sum + Math.abs(p.size * (p.current_price || p.entry_price)), 0)
  const totalUnrealizedPnl = positions.reduce((sum, p) => sum + p.unrealized_pnl, 0)

  // Get completed trades
  const completedTrades = fills.filter(f => parseFloat(f.closedPnl) !== 0).slice(0, 50)

  const tabs: { label: TabType; icon: string; count: number }[] = [
    { label: 'Active Positions', icon: 'fa-layer-group', count: positions.length },
    { label: 'Completed Trades', icon: 'fa-flag-checkered', count: completedTrades.length },
  ]

  // Desktop table for positions
  const renderDesktopPositionsTable = () => (
    <table className="w-full">
      <thead>
        <tr className="border-b border-zinc-800/50">
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Asset</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Type</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Value / Size</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Unrealized PnL</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Entry</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Current</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Liq. Price</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Margin</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">ROE</th>
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
                  <div className="text-xs text-zinc-500 font-mono">{formatNumber(Math.abs(position.size))} {position.coin}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className={cn('font-mono font-medium inline-flex items-center gap-1', isProfitable ? 'text-emerald-400' : 'text-red-400')}>
                    <i className={cn('fa-solid text-[10px]', isProfitable ? 'fa-caret-up' : 'fa-caret-down')}></i>
                    {isProfitable ? '+' : '-'}{formatCurrency(position.unrealized_pnl)}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-400">{formatCurrency(position.entry_price, position.entry_price < 1 ? 6 : 2)}</td>
                <td className="px-4 py-3 text-right font-mono text-white">{formatCurrency(position.current_price || position.entry_price, (position.current_price || position.entry_price) < 1 ? 6 : 2)}</td>
                <td className="px-4 py-3 text-right font-mono text-zinc-400">{position.liquidation_price ? formatCurrency(position.liquidation_price) : '—'}</td>
                <td className="px-4 py-3 text-right font-mono text-white">{formatCurrency(marginUsed)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={cn('font-mono text-sm', isProfitable ? 'text-emerald-400' : 'text-red-400')}>{formatPercent(roe)}</span>
                </td>
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  )

  // Desktop table for completed trades
  const renderDesktopTradesTable = () => (
    <table className="w-full">
      <thead>
        <tr className="border-b border-zinc-800/50">
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Time</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Asset</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Side</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Size</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Price</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Realized PnL</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Fee</th>
        </tr>
      </thead>
      <tbody>
        {completedTrades.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
              <i className="fa-solid fa-flag-checkered text-3xl mb-3 opacity-30 block"></i>
              No completed trades
            </td>
          </tr>
        ) : (
          completedTrades.map((trade, index) => {
            const isBuy = trade.side === 'B'
            const size = parseFloat(trade.sz)
            const price = parseFloat(trade.px)
            const closedPnl = parseFloat(trade.closedPnl)
            const fee = parseFloat(trade.fee)
            const isProfitable = closedPnl >= 0

            return (
              <tr key={`${trade.hash}-${index}`} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                <td className="px-4 py-3 text-zinc-400 text-sm">{formatTime(trade.time)}</td>
                <td className="px-4 py-3"><span className="font-medium text-white">{trade.coin}</span></td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 rounded text-xs font-bold', isBuy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
                    {isBuy ? 'BUY' : 'SELL'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-white">{formatNumber(size)}</td>
                <td className="px-4 py-3 text-right font-mono text-zinc-400">{formatCurrency(price, price < 1 ? 6 : 2)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={cn('font-mono font-medium', isProfitable ? 'text-emerald-400' : 'text-red-400')}>
                    {isProfitable ? '+' : ''}{formatCurrency(closedPnl)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-500">${fee.toFixed(4)}</td>
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  )

  // Mobile accordion views
  const renderMobilePositions = () => (
    <div>
      {positions.length === 0 ? (
        <div className="px-4 py-12 text-center text-zinc-500">
          <i className="fa-solid fa-inbox text-3xl mb-3 opacity-30 block"></i>
          No open positions
        </div>
      ) : (
        positions.map((position) => (
          <PositionAccordionItem
            key={position.id}
            position={position}
            isOpen={openPositionId === position.id}
            onToggle={() => setOpenPositionId(openPositionId === position.id ? null : position.id)}
          />
        ))
      )}
    </div>
  )

  const renderMobileTrades = () => (
    <div>
      {completedTrades.length === 0 ? (
        <div className="px-4 py-12 text-center text-zinc-500">
          <i className="fa-solid fa-flag-checkered text-3xl mb-3 opacity-30 block"></i>
          No completed trades
        </div>
      ) : (
        completedTrades.map((trade, index) => (
          <TradeAccordionItem
            key={`${trade.hash}-${index}`}
            trade={trade}
            isOpen={openTradeId === `${trade.hash}-${index}`}
            onToggle={() => setOpenTradeId(openTradeId === `${trade.hash}-${index}` ? null : `${trade.hash}-${index}`)}
          />
        ))
      )}
    </div>
  )

  return (
    <div className="bg-zinc-900/30 rounded-lg border border-zinc-800/50">
      {/* Summary Bar - Desktop only */}
      <div className="hidden md:flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 text-sm">
        <div className="flex items-center gap-6">
          <span className="text-zinc-400">
            Positions <span className="text-white font-mono">{positions.length}</span>
          </span>
          <span className="text-emerald-400">
            <i className="fa-solid fa-arrow-up mr-1"></i>
            Long: <span className="font-mono">{formatCurrency(totalLong)}</span>
          </span>
          <span className="text-red-400">
            <i className="fa-solid fa-arrow-down mr-1"></i>
            Short: <span className="font-mono">{formatCurrency(totalShort)}</span>
          </span>
          <span className="text-zinc-400">
            uPnL: <span className={cn('font-mono', totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPnl)}
            </span>
          </span>
        </div>
      </div>

      {/* Mobile Summary */}
      <div className="md:hidden px-4 py-3 border-b border-zinc-800/50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-mono text-xs">
              <i className="fa-solid fa-arrow-up mr-1"></i>{formatCurrency(totalLong)}
            </span>
            <span className="text-red-400 font-mono text-xs">
              <i className="fa-solid fa-arrow-down mr-1"></i>{formatCurrency(totalShort)}
            </span>
          </div>
          <span className={cn('font-mono text-sm', totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {totalUnrealizedPnl >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPnl)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-zinc-800/50 overflow-x-auto">
        {tabs.map(({ label, icon, count }) => (
          <button
            key={label}
            onClick={() => setSelectedTab(label)}
            className={cn(
              'px-4 py-3 text-xs md:text-sm font-medium transition-all border-b-2 -mb-[1px] flex items-center gap-2 whitespace-nowrap',
              selectedTab === label
                ? 'text-white border-white'
                : 'text-zinc-500 border-transparent'
            )}
          >
            <i className={cn('fa-solid', icon)}></i>
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(' ')[0]}</span>
            <span className="text-zinc-600">{count}</span>
          </button>
        ))}
      </div>

      {/* Content - Desktop Table / Mobile Accordion */}
      <div className="hidden md:block overflow-x-auto">
        {selectedTab === 'Active Positions' && renderDesktopPositionsTable()}
        {selectedTab === 'Completed Trades' && renderDesktopTradesTable()}
      </div>
      
      <div className="md:hidden">
        {selectedTab === 'Active Positions' && renderMobilePositions()}
        {selectedTab === 'Completed Trades' && renderMobileTrades()}
      </div>
    </div>
  )
}
