import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
        secondary:
          'border-transparent bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400',
        destructive:
          'border-transparent bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
        outline:
          'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
