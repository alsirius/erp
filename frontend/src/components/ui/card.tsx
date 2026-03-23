import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'card',
  {
    variants: {
      variant: {
        default: 'bg-surface border-border shadow-sm',
        elevated: 'bg-surface border-border shadow-lg hover:shadow-xl',
        outlined: 'bg-surface border-2 border-border shadow-none',
        ghost: 'bg-transparent border-transparent shadow-none',
        glass: 'glass border-border/50 shadow-sm',
        gradient: 'bg-gradient-primary border-transparent shadow-md hover:shadow-lg',
        success: 'bg-success/10 border-success/20 shadow-sm',
        warning: 'bg-warning/10 border-warning/20 shadow-sm',
        destructive: 'bg-destructive/10 border-destructive/20 shadow-sm',
        info: 'bg-info/10 border-info/20 shadow-sm',
      },
      hover: {
        none: '',
        lift: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-300',
        scale: 'hover:scale-[1.02] hover:shadow-md transition-all duration-300',
        glow: 'hover:shadow-glow hover:shadow-primary/20 transition-all duration-300',
        border: 'hover:border-primary transition-all duration-300',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        default: 'rounded-xl',
        lg: 'rounded-2xl',
        xl: 'rounded-3xl',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: 'none',
      padding: 'default',
      rounded: 'default',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  interactive?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, padding, rounded, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, hover, padding, rounded }),
        interactive && 'cursor-pointer card-interactive',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight text-foreground', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-6', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
