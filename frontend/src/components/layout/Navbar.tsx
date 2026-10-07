import { Link, useLocation } from 'react-router-dom'
import { PenTool, Network } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-base shadow-sm">
              E
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-foreground">
                Effective<span className="text-muted-foreground font-normal">Learn</span>
              </span>
            </div>
          </Link>

          {/* Nav items */}
          <nav className="hidden sm:flex items-center gap-1.5">
            <Link
              to="/"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-muted text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              Subjects
            </Link>
            <Link
              to="/graph"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                location.pathname === '/graph'
                  ? 'bg-muted text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              <span>Graph View</span>
            </Link>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Write Chapter Button */}
          <Link to="/write" className="hidden sm:inline-flex">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <PenTool className="h-3.5 w-3.5" />
              <span>Write</span>
            </Button>
          </Link>

          {/* Theme Toggle Dropdown (Light / Dark / System) */}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
