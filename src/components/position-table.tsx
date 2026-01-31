'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { HyperliquidPosition } from '@/types'

interface PositionTableProps {
  positions: HyperliquidPosition[]
}

function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString(undefined, { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })
}

function formatCurrency(num: number): string {
  return `$${formatNumber(num)}`
}

function formatPercent(num: number): string {
  return `${num >= 0 ? '+' : ''}${formatNumber(num)}%`
}

export function PositionTable({ positions }: PositionTableProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Open Positions</CardTitle>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <p className="text-zinc-500 text-center py-8">No open positions</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Coin</TableHead>
                <TableHead className="text-zinc-400 text-right">Size</TableHead>
                <TableHead className="text-zinc-400 text-right">Entry</TableHead>
                <TableHead className="text-zinc-400 text-right">PnL</TableHead>
                <TableHead className="text-zinc-400 text-right">ROE%</TableHead>
                <TableHead className="text-zinc-400 text-right">Lev</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => {
                // Determine side from size (positive = long, negative = short)
                const side = position.size >= 0 ? 'long' : 'short'
                const isProfitable = position.unrealized_pnl >= 0
                
                // Calculate ROE: PnL / margin used
                const positionValue = Math.abs(position.size * position.entry_price)
                const marginUsed = positionValue / position.leverage
                const roe = marginUsed > 0 ? (position.unrealized_pnl / marginUsed) * 100 : 0
                
                return (
                  <TableRow key={position.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          side === 'long' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                        )}>
                          {side.toUpperCase()}
                        </span>
                        <span className="text-white">{position.coin}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-white">
                      {formatNumber(Math.abs(position.size), 4)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">
                      {formatCurrency(position.entry_price)}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right font-mono font-medium',
                      isProfitable ? 'text-green-500' : 'text-red-500'
                    )}>
                      {isProfitable ? '+' : ''}{formatCurrency(position.unrealized_pnl)}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right font-mono',
                      roe >= 0 ? 'text-green-500' : 'text-red-500'
                    )}>
                      {formatPercent(roe)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">
                      {position.leverage}x
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
