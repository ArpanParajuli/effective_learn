import * as React from 'react'
import { Navbar } from './Navbar'

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 py-6 text-center text-xs text-slate-500">
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
