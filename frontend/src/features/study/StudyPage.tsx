import * as React from 'react'
import { Link } from 'react-router-dom'
import { 
  RotateCw, 
  Brain, 
  ArrowLeft, 
  Sparkles,
  Trophy,
  Flame
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface StudyCard {
  id: string
  deckTitle: string
  question: string
  answer: string
  keyInsight: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
}

export function StudyPage() {
  const [cards] = React.useState<StudyCard[]>([
    {
      id: '1',
      deckTitle: 'ASP.NET Core 10 Internals',
      question: 'What is the primary architectural advantage of using Endpoint Routing over traditional UseMvc() route matching?',
      answer: 'Endpoint routing decouples route matching from dispatching, allowing middleware (like Authorization, CORS, and OutputCaching) to inspect the selected endpoint metadata before the handler actually executes.',
      keyInsight: 'Inspect HttpContext.GetEndpoint() in custom middleware before the endpoint execution pipeline.',
      difficulty: 'Advanced',
    },
    {
      id: '2',
      deckTitle: 'PostgreSQL Deep Dive',
      question: 'When should a BRIN (Block Range Index) be favored over a standard B-Tree index in PostgreSQL?',
      answer: 'BRIN is ideal for massive append-only tables where data is naturally correlated with its physical order (such as timestamped logs or auto-incrementing serial IDs), offering orders of magnitude smaller index footprint and faster writes.',
      keyInsight: 'Reduces index size from gigabytes to megabytes for time-series data.',
      difficulty: 'Intermediate',
    },
    {
      id: '3',
      deckTitle: 'Distributed Systems',
      question: 'How does an Outbox Pattern guarantee at-least-once message delivery without distributed two-phase commits?',
      answer: 'The business state modification and outgoing event message are committed within the same relational database transaction into an "Outbox" table. A separate publisher process reads the table and relays messages to the message broker.',
      keyInsight: 'Prevents partial failure where DB commits but message broker network fails.',
      difficulty: 'Advanced',
    },
  ])

  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isFlipped, setIsFlipped] = React.useState(false)
  const [sessionCompleted, setSessionCompleted] = React.useState(false)
  const [reviewsDone, setReviewsDone] = React.useState(0)

  const currentCard = cards[currentIndex]
  const progressPercentage = ((currentIndex) / cards.length) * 100

  const handleRate = (ratingName: string, nextInterval: string) => {
    toast.success(`Rated as "${ratingName}" — Scheduled in ${nextInterval}`)
    setIsFlipped(false)
    setReviewsDone((prev) => prev + 1)

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setSessionCompleted(true)
    }
  }

  const restartSession = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setSessionCompleted(false)
    setReviewsDone(0)
  }

  if (sessionCompleted) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
          <Trophy className="h-10 w-10 text-indigo-400 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-white">Review Session Completed!</h2>
          <p className="text-slate-400 text-sm">
            You successfully reviewed <span className="text-white font-semibold">{reviewsDone} cards</span> with active retrieval practice.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-xs text-slate-400">SRS Retention Rate</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">94.5%</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-400" /> Daily Streak
            </span>
            <div className="text-2xl font-bold text-orange-400 mt-1">15 Days</div>
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-4">
          <Button variant="outline" onClick={restartSession}>
            <RotateCw className="h-4 w-4" />
            Review Again
          </Button>
          <Link to="/decks">
            <Button>
              <ArrowLeft className="h-4 w-4" />
              Return to Decks
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header / Progress */}
      <div className="flex items-center justify-between">
        <Link to="/decks" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Decks
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="default">{currentCard.deckTitle}</Badge>
          <span className="text-xs text-slate-400">
            Card {currentIndex + 1} of {cards.length}
          </span>
        </div>
      </div>

      <Progress value={progressPercentage} className="h-1.5" />

      {/* Flashcard Component */}
      <Card
        onClick={() => setIsFlipped(!isFlipped)}
        className="min-h-[380px] cursor-pointer flex flex-col justify-between p-8 border-slate-800 hover:border-indigo-500/50 transition-all select-none group bg-gradient-to-b from-slate-900/90 to-slate-950/90"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Brain className="h-3.5 w-3.5 text-indigo-400" />
              {isFlipped ? 'Answer & Core Principle' : 'Prompt / Active Recall Challenge'}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-slate-500">
              Click anywhere to flip
            </span>
          </div>

          <div className="pt-6">
            {!isFlipped ? (
              <div className="space-y-4">
                <h3 className="text-xl sm:text-2xl font-semibold text-white leading-snug">
                  {currentCard.question}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Try retrieving the explanation in your mind before flipping.
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="text-lg text-slate-200 leading-relaxed font-normal">
                  {currentCard.answer}
                </div>
                <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3 text-xs text-indigo-300">
                  <span className="font-semibold text-indigo-200">Key Insight: </span>
                  {currentCard.keyInsight}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center pt-6 border-t border-slate-800/80 text-xs text-slate-500 group-hover:text-slate-400">
          <RotateCw className="h-3.5 w-3.5 mr-1.5" />
          {isFlipped ? 'Click to view question' : 'Click to reveal answer'}
        </div>
      </Card>

      {/* SRS Rating Control Bar (Shown when flipped) */}
      {isFlipped ? (
        <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="text-xs font-semibold text-center uppercase tracking-wider text-slate-400">
            Rate your retrieval effort (Spaced Repetition SM-2 Algorithm)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => handleRate('Again', '< 10 min')}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-all cursor-pointer"
            >
              <span className="text-sm font-bold">Again</span>
              <span className="text-[11px] text-red-400/80">&lt; 10m</span>
            </button>

            <button
              onClick={() => handleRate('Hard', '1 day')}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all cursor-pointer"
            >
              <span className="text-sm font-bold">Hard</span>
              <span className="text-[11px] text-amber-400/80">1 day</span>
            </button>

            <button
              onClick={() => handleRate('Good', '3 days')}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition-all cursor-pointer"
            >
              <span className="text-sm font-bold">Good</span>
              <span className="text-[11px] text-indigo-400/80">3 days</span>
            </button>

            <button
              onClick={() => handleRate('Easy', '7 days')}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition-all cursor-pointer"
            >
              <span className="text-sm font-bold">Easy</span>
              <span className="text-[11px] text-emerald-400/80">7 days</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center pt-2">
          <Button onClick={() => setIsFlipped(true)} size="lg" className="w-full sm:w-64">
            Show Answer
          </Button>
        </div>
      )}
    </div>
  )
}
