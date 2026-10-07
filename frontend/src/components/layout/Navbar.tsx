import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Brain, Layers, BarChart3, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const location = useLocation()

  const navItems = [
    { label: 'Overview', href: '/', icon: Brain },
    { label: 'My Decks', href: '/decks', icon: Layers },
    { label: 'Study Session', href: '/study', icon: BookOpen },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/25">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                Effective<span className="text-indigo-400">Learn</span>
              </span>
              <span className="block text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                SRS & Active Recall
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            .NET 10 LTS Backend Online
          </div>
          <Link
            to="/decks"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            New Deck
          </Link>
        </div>
      </div>
    </header>
  )
}
