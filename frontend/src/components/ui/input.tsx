import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-slate-400 dark:focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-xs',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
