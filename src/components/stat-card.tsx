import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
}

export function StatCard({ title, value, subtitle, trend, icon }: StatCardProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">
          {title}
        </CardTitle>
        {icon && <div className="text-zinc-500">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={cn(
          'text-2xl font-bold font-mono',
          trend === 'up' && 'text-green-500',
          trend === 'down' && 'text-red-500',
          trend === 'neutral' && 'text-white',
          !trend && 'text-white'
        )}>
          {value}
        </div>
        {subtitle && (
          <p className={cn(
            'text-xs mt-1',
            trend === 'up' && 'text-green-500/70',
            trend === 'down' && 'text-red-500/70',
            !trend && 'text-zinc-500'
          )}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
