import * as React from 'react'
import { AppSidebar } from './AppSidebar'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />
          <div className="font-semibold text-foreground lg:hidden ml-2">EffectiveLearn</div>
        </header>
        
        <main className="flex-1 w-full bg-background transition-colors flex flex-col min-h-0 overflow-hidden">
          <div className="w-full h-full p-4 sm:p-6 lg:p-8 flex-1 min-h-0 flex flex-col max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
        
        <footer className="border-t border-border bg-slate-50 dark:bg-black py-6 text-center text-xs text-muted-foreground mt-auto shrink-0">
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
      </SidebarInset>
    </SidebarProvider>
  )
}
