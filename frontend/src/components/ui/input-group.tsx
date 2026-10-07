import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-full items-center rounded-lg border border-border bg-card shadow-2xs transition-colors focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-500/20',
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
          'flex items-center text-muted-foreground pointer-events-none select-none',
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
          'flex h-10 w-full min-w-0 bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    )
  }
)
InputGroupInput.displayName = 'InputGroupInput'

export { InputGroup, InputGroupAddon, InputGroupInput }
