import { Link } from 'react-router-dom'
import { 
  Flame, 
  Brain, 
  Clock, 
  TrendingUp, 
  Play, 
  Plus, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export function OverviewPage() {
  const stats = [
    {
      label: 'Cards Due Today',
      value: '24',
      subtext: '4 decks need review',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
    },
    {
      label: 'Learning Streak',
      value: '14 Days',
      subtext: 'Personal best: 21 days',
      icon: Flame,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
    },
    {
      label: 'Retention Rate',
      value: '91.8%',
      subtext: '+2.4% this week',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
    },
    {
      label: 'Total Active Cards',
      value: '348',
      subtext: 'Across 6 subjects',
      icon: Brain,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400/10',
    },
  ]

  const priorityDecks = [
    {
      id: '1',
      title: 'ASP.NET Core 10 Internals & GC',
      description: 'Memory models, non-allocating patterns, middleware pipeline, and Kestrel tuning.',
      dueCards: 12,
      totalCards: 85,
      mastery: 78,
      tag: 'Backend Engineering',
    },
    {
      id: '2',
      title: 'PostgreSQL Indexing & Optimization',
      description: 'B-Tree, GIN, BRIN indexes, EXPLAIN ANALYZE interpretation, and vacuum tuning.',
      dueCards: 8,
      totalCards: 64,
      mastery: 84,
      tag: 'Database Architecture',
    },
    {
      id: '3',
      title: 'Distributed Systems & Consensus',
      description: 'Raft, Paxos, 2PC, event-driven saga pattern, idempotency keys, and CAP trade-offs.',
      dueCards: 4,
      totalCards: 52,
      mastery: 65,
      tag: 'Architecture',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-purple-950/40 p-8 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs font-medium text-indigo-300">
              <Brain className="h-3.5 w-3.5" />
              Optimal Spaced Repetition (FSRS / SM-2)
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Ready for your daily retention boost?
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              You have <span className="text-indigo-400 font-semibold">24 flashcards</span> scheduled for review today. Keep your memory consolidation peak before the forgetting curve steepens.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link to="/study">
              <Button size="lg" className="w-full sm:w-auto font-semibold">
                <Play className="h-4 w-4 fill-current" />
                Start Today's Review
              </Button>
            </Link>
            <Link to="/decks">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add New Deck
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="hover:border-slate-700 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-400">{stat.label}</span>
                  <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{stat.subtext}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Focus Decks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Priority Review Decks</h2>
            <p className="text-xs text-slate-400">Decks with items reaching the retention threshold</p>
          </div>
          <Link to="/decks" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-400 hover:text-indigo-300">
            View All Decks <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {priorityDecks.map((deck) => (
            <Card key={deck.id} className="flex flex-col justify-between">
              <div>
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="default">{deck.tag}</Badge>
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {deck.dueCards} Due
                    </span>
                  </div>
                  <CardTitle className="text-base font-semibold">{deck.title}</CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">
                    {deck.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Mastery</span>
                      <span className="text-slate-200 font-medium">{deck.mastery}%</span>
                    </div>
                    <Progress value={deck.mastery} className="h-1.5" />
                  </div>
                  <div className="text-xs text-slate-400">
                    Total Cards: <span className="text-slate-200 font-medium">{deck.totalCards}</span>
                  </div>
                </CardContent>
              </div>
              <div className="p-6 pt-0">
                <Link to="/study">
                  <Button variant="secondary" className="w-full text-xs">
                    Review {deck.dueCards} Cards
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Production Principles Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Effective Learning Framework
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-white mb-1">Spaced Repetition (SRS)</p>
              <p className="text-slate-400">Calculates optimal intervals right before memory decay occurs.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-white mb-1">Active Recall</p>
              <p className="text-slate-400">Forces brain retrieval instead of passive reading to strengthen neural pathways.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-white mb-1">Feynman Simplification</p>
              <p className="text-slate-400">Tests deep conceptual understanding by distilling complex topics into clear answers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
