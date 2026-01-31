import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function FootballPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Football.fun</h1>
        <p className="text-zinc-400 mt-1">Player portfolio & staking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Portfolio Value"
          value="$4,145.50"
          trend="neutral"
        />
        <StatCard
          title="Staking Balance"
          value="$1,000.00"
          subtitle="12.5% APR"
          trend="up"
        />
        <StatCard
          title="Players Owned"
          value="8"
          trend="neutral"
        />
        <StatCard
          title="$FUN Holdings"
          value="5,000"
          subtitle="$0.82 per token"
          trend="neutral"
        />
      </div>

      {/* Coming Soon */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Player Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <span className="text-6xl">⚽</span>
            <h3 className="text-xl font-semibold text-white mt-4">Coming Soon</h3>
            <p className="text-zinc-400 mt-2 max-w-md mx-auto">
              Football.fun integration is under development. Soon you&apos;ll be able to track your player portfolio and staking rewards here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
