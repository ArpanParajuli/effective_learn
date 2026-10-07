import { 
  BarChart3, 
  TrendingUp, 
  Flame, 
  Calendar, 
  Clock, 
  CheckCircle 
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function AnalyticsPage() {
  const weeklyData = [
    { day: 'Mon', count: 45, retention: 94 },
    { day: 'Tue', count: 62, retention: 91 },
    { day: 'Wed', count: 50, retention: 96 },
    { day: 'Thu', count: 78, retention: 89 },
    { day: 'Fri', count: 65, retention: 93 },
    { day: 'Sat', count: 90, retention: 95 },
    { day: 'Sun', count: 42, retention: 92 },
  ]

  const srsStages = [
    { name: 'Mature (Interval > 21 days)', count: 184, percent: 53, color: 'bg-emerald-500' },
    { name: 'Young (Interval 1 - 21 days)', count: 98, percent: 28, color: 'bg-indigo-500' },
    { name: 'Learning (Interval < 1 day)', count: 42, percent: 12, color: 'bg-amber-500' },
    { name: 'Suspended / Relearning', count: 24, percent: 7, color: 'bg-red-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Learning Analytics</h1>
        <p className="text-sm text-slate-400">Memory stability, spaced intervals, and daily retrieval performance</p>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Reviews Conducted</span>
              <div className="rounded-lg bg-indigo-500/10 p-2">
                <BarChart3 className="h-4 w-4 text-indigo-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mt-3">1,429</div>
            <p className="text-xs text-slate-400 mt-1">Across 8 configured decks</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Average Forgetting Curve Index</span>
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-3">92.4%</div>
            <p className="text-xs text-slate-400 mt-1">Target retention benchmark: 90%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active Study Habit</span>
              <div className="rounded-lg bg-orange-500/10 p-2">
                <Flame className="h-4 w-4 text-orange-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-400 mt-3">14 Days</div>
            <p className="text-xs text-slate-400 mt-1">Consecutive daily recall practice</p>
          </CardContent>
        </Card>
      </div>

      {/* SRS Stage Breakdown and Weekly Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SRS Stage Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">SRS Memory Consolidation Stages</CardTitle>
            <CardDescription className="text-xs">
              Distribution of flashcards according to SM-2 stability tiers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {srsStages.map((stage, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{stage.name}</span>
                  <span className="text-slate-400">{stage.count} cards ({stage.percent}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-full transition-all`}
                    style={{ width: `${stage.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Weekly Reviews & Accuracy</CardTitle>
            <CardDescription className="text-xs">
              Daily card volume with corresponding recall pass rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-44 pt-4">
              {weeklyData.map((d, i) => {
                const heightPercent = (d.count / 100) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] text-slate-400 font-medium">{d.count}</span>
                    <div
                      className="w-full max-w-[32px] bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-md hover:opacity-90 transition-all cursor-pointer"
                      style={{ height: `${heightPercent}%` }}
                      title={`${d.count} cards (${d.retention}% retention)`}
                    />
                    <span className="text-xs font-semibold text-slate-400">{d.day}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                Avg. Daily Accuracy: 93.1%
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                Avg. Session: 8.5 mins
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap / Consistency Block */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Study Habit Heatmap</CardTitle>
              <CardDescription className="text-xs">
                Consistent daily sessions maximize the brain's long-term synaptic potentiation
              </CardDescription>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Past 12 Weeks
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-1.5 pt-2">
            {Array.from({ length: 48 }).map((_, idx) => {
              const intensity = (idx % 7 === 0 || idx % 5 === 0) ? 3 : (idx % 3 === 0) ? 2 : 1
              const bgColors = [
                'bg-slate-800/40',
                'bg-indigo-900/50',
                'bg-indigo-600',
                'bg-indigo-400',
              ]
              return (
                <div
                  key={idx}
                  className={`h-4 rounded-sm ${bgColors[intensity]} hover:ring-1 hover:ring-white/40 transition-all cursor-pointer`}
                  title={`Day ${idx + 1}`}
                />
              )
            })}
          </div>
          <div className="flex items-center justify-end gap-2 mt-4 text-[11px] text-slate-400">
            <span>Less</span>
            <div className="h-3 w-3 rounded-sm bg-slate-800/40" />
            <div className="h-3 w-3 rounded-sm bg-indigo-900/50" />
            <div className="h-3 w-3 rounded-sm bg-indigo-600" />
            <div className="h-3 w-3 rounded-sm bg-indigo-400" />
            <span>More reviews</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
