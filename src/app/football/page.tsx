import { DashboardLayout } from '@/components/dashboard'
import { ChartDataPoint } from '@/types'

// Placeholder data - $0 values until sync is built
const placeholderChartData: ChartDataPoint[] = [
  { date: 'Jan 25', timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000, value: 0 },
  { date: 'Jan 26', timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, value: 0 },
  { date: 'Jan 27', timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000, value: 0 },
  { date: 'Jan 28', timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, value: 0 },
  { date: 'Jan 29', timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, value: 0 },
  { date: 'Jan 30', timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, value: 0 },
  { date: 'Jan 31', timestamp: Date.now(), value: 0 },
]

export default function FootballPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Sub-header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-full text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
            <span>←</span> Back
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
            <span className="font-mono text-white">SDF (Football.fun)</span>
            <span className="text-white">●</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors">
            <span>⚙</span> Advanced
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors">
            <span>📄</span> Report
          </button>
          <button className="px-4 py-2 bg-white hover:bg-zinc-200 rounded-lg text-sm font-medium text-zinc-900 transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>

      <DashboardLayout
        totalValue={0}
        withdrawable={0}
        totalPositionSize={0}
        perpEquity={0}
        marginUsage={0}
        longExposure={0}
        shortExposure={0}
        chartData={placeholderChartData}
        currentPnl={0}
        positions={[]}
        accentColor="white"
        title="Portfolio Value"
      />

      {/* Sync Notice */}
      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="text-2xl">⚽</div>
          <div>
            <h3 className="font-medium text-white">SDF Sync Coming Soon</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Connect your wallet to start tracking football player cards and staking positions. Data sync is under development.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
