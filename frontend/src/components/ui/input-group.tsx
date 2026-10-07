import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-full items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131a] shadow-2xs transition-colors focus-within:border-slate-400 dark:focus-within:border-slate-600 focus-within:ring-2 focus-within:ring-slate-900/10 dark:focus-within:ring-slate-100/10',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
InputGroup.displayName = 'InputGroup'

export interface InputGroupAddonProps extends React.HTMLAttributes<HTMLDivElement> {
  placement?: 'left' | 'right'
}

const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, placement = 'left', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center text-slate-400 dark:text-slate-500 pointer-events-none select-none',
          placement === 'left' ? 'pl-3 pr-1.5' : 'pr-3 pl-1.5',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
InputGroupAddon.displayName = 'InputGroupAddon'

export interface InputGroupInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const InputGroupInput = React.forwardRef<HTMLInputElement, InputGroupInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-10 w-full min-w-0 bg-transparent px-2 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    )
  }
)
InputGroupInput.displayName = 'InputGroupInput'

export { InputGroup, InputGroupAddon, InputGroupInput }
