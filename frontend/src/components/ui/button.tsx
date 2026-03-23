import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'btn-base',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover active:bg-primary-active hover:shadow-md active:shadow-inner-glow',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive-hover active:bg-destructive-active hover:shadow-md hover:shadow-destructive/20 active:shadow-inner-glow',
        outline: 'border border-border bg-surface shadow-sm hover:bg-surface-hover hover:text-accent-foreground active:bg-surface-variant hover:shadow-md active:shadow-inner-glow',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary-hover active:bg-secondary-active hover:shadow-md active:shadow-inner-glow',
        ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/30 hover:shadow-sm active:shadow-inner-glow',
        link: 'text-primary underline-offset-4 hover:underline active:text-primary-hover',
        success: 'bg-success text-success-foreground shadow-sm hover:bg-success-hover active:bg-success-active hover:shadow-md hover:shadow-success/20 active:shadow-inner-glow',
        warning: 'bg-warning text-warning-foreground shadow-sm hover:bg-warning-hover active:bg-warning-active hover:shadow-md hover:shadow-warning/20 active:shadow-inner-glow',
        info: 'bg-info text-info-foreground shadow-sm hover:bg-info-hover active:bg-info-active hover:shadow-md hover:shadow-info/20 active:shadow-inner-glow',
        gradient: 'bg-gradient-primary text-primary-foreground shadow-sm hover:shadow-md hover:shadow-primary/20 active:shadow-inner-glow interactive-scale',
        glass: 'glass text-foreground shadow-sm hover:glass-lg hover:shadow-md active:shadow-inner-glow',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm',
        sm: 'h-9 px-3 py-1.5 text-sm',
        lg: 'h-11 px-6 py-2.5 text-base',
        xl: 'h-12 px-8 py-3 text-lg',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-lg': 'h-12 w-12 p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, loading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
