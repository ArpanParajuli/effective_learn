import * as React from 'react'
import { Navbar } from './Navbar'

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-border bg-slate-50 dark:bg-black py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} EffectiveLearn — Learning Journal & Knowledge System.</p>
          <div className="flex items-center gap-3 text-slate-500">
            <span>Clean Architecture</span>
            <span>•</span>
            <span>PostgreSQL</span>
            <span>•</span>
            <span>React</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
