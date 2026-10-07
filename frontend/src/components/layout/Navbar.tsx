import { Link, useLocation } from 'react-router-dom'
import { PenTool, LogOut, User, Plus, Network } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

export function Navbar() {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

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
          <nav className="hidden sm:flex items-center gap-1.5">
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
            <Link
              to="/graph"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                location.pathname === '/graph'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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

          {/* User Auth Profile or Sign In */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs shadow-2xs hover:ring-2 hover:ring-slate-400 dark:hover:ring-slate-600 transition-all cursor-pointer"
                  aria-label="User profile"
                >
                  {getInitials(user.name)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-slate-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-slate-500 dark:text-slate-400">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/write" className="flex items-center gap-2 cursor-pointer">
                    <Plus className="h-4 w-4 text-slate-500" />
                    <span>Write Chapter</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4 text-slate-500" />
                    <span>My Subjects</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout()
                    toast.info('You have signed out.')
                  }}
                  className="text-red-600 dark:text-red-400 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button size="sm" variant="ghost" className="text-xs">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="text-xs">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
