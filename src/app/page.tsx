import { StatCard } from '@/components/stat-card'
import { EquityChart } from '@/components/equity-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

// Placeholder data for the equity chart
const placeholderEquityData = [
  { date: 'Jan', value: 10000 },
  { date: 'Feb', value: 10500 },
  { date: 'Mar', value: 9800 },
  { date: 'Apr', value: 11200 },
  { date: 'May', value: 12100 },
  { date: 'Jun', value: 11800 },
  { date: 'Jul', value: 13500 },
]

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Portfolio Overview</h1>
        <p className="text-zinc-400 mt-1">Track all your positions in one place</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Portfolio Value"
          value="$13,500"
          subtitle="+$1,700 from last month"
          trend="up"
        />
        <StatCard
          title="Today's PnL"
          value="+$234.50"
          subtitle="+1.8%"
          trend="up"
        />
        <StatCard
          title="Unrealized PnL"
          value="+$892.30"
          subtitle="Across 5 positions"
          trend="up"
        />
        <StatCard
          title="Active Positions"
          value="5"
          subtitle="2 Hyperliquid, 3 Polymarket"
          trend="neutral"
        />
      </div>

      {/* Equity Chart */}
      <EquityChart 
        data={placeholderEquityData} 
        title="Combined Equity Curve" 
      />

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/hyperliquid">
          <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-2xl">📈</span>
                Hyperliquid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">Account Value</span>
                <span className="font-mono text-white">$5,234.50</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Daily PnL</span>
                <span className="font-mono text-green-500">+$156.20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Open Positions</span>
                <span className="font-mono text-white">2</span>
              </div>
              <div className="text-sm text-zinc-500 pt-2 border-t border-zinc-800">
                Click to view details →
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/polymarket">
          <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Polymarket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Invested</span>
                <span className="font-mono text-white">$2,500.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Current Value</span>
                <span className="font-mono text-white">$3,120.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Active Bets</span>
                <span className="font-mono text-white">3</span>
              </div>
              <div className="text-sm text-zinc-500 pt-2 border-t border-zinc-800">
                Click to view details →
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/football">
          <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-2xl">⚽</span>
                Football.fun
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">Portfolio Value</span>
                <span className="font-mono text-white">$4,145.50</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Staking Balance</span>
                <span className="font-mono text-white">$1,000.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Players Owned</span>
                <span className="font-mono text-white">8</span>
              </div>
              <div className="text-sm text-zinc-500 pt-2 border-t border-zinc-800">
                Click to view details →
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
