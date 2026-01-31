import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PolymarketPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Polymarket</h1>
        <p className="text-zinc-400 mt-1">Prediction market positions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Invested"
          value="$2,500.00"
          trend="neutral"
        />
        <StatCard
          title="Current Value"
          value="$3,120.00"
          subtitle="+$620.00 (+24.8%)"
          trend="up"
        />
        <StatCard
          title="Active Bets"
          value="3"
          trend="neutral"
        />
        <StatCard
          title="Win Rate"
          value="67%"
          subtitle="4 wins / 2 losses"
          trend="up"
        />
      </div>

      {/* Coming Soon */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Active Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <span className="text-6xl">🎯</span>
            <h3 className="text-xl font-semibold text-white mt-4">Coming Soon</h3>
            <p className="text-zinc-400 mt-2 max-w-md mx-auto">
              Polymarket integration is under development. Soon you&apos;ll be able to track all your prediction market positions here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
