import * as React from 'react'
import { Navbar } from './Navbar'

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background ambient gradient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-indigo-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/2 -left-40 w-[600px] h-[600px] bg-purple-500/5 blur-[150px] rounded-full" />
      </div>

      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} EffectiveLearn. Production-Grade Spaced Repetition Platform.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>ASP.NET Core 10 LTS</span>
            <span>•</span>
            <span>PostgreSQL</span>
            <span>•</span>
            <span>React 19 & TanStack</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
