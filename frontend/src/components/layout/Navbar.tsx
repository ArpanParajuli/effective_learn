import { Link, useLocation } from 'react-router-dom'
import { PenTool, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#090a0f]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-base shadow-sm">
              E
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Effective<span className="text-slate-500 dark:text-slate-400 font-normal">Learn</span>
              </span>
            </div>
          </Link>

          {/* Nav items */}
          <nav className="hidden sm:flex items-center gap-2">
            <Link
              to="/"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Subjects
            </Link>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>

          {/* Write Chapter Button */}
          <Link to="/write">
            <Button size="sm" className="gap-2">
              <PenTool className="h-3.5 w-3.5" />
              <span>Write Chapter</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
