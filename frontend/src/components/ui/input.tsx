import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  'input-base',
  {
    variants: {
      variant: {
        default: 'bg-surface border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary',
        filled: 'bg-surface-variant border-transparent text-foreground placeholder:text-muted-foreground focus:bg-surface focus:border-primary focus:ring-primary',
        outlined: 'bg-transparent border-2 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary',
        ghost: 'bg-transparent border-transparent text-foreground placeholder:text-muted-foreground focus:bg-surface focus:border-primary focus:ring-primary',
        glass: 'glass border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary',
      },
      size: {
        sm: 'h-9 px-3 py-1.5 text-sm',
        default: 'h-10 px-3 py-2 text-sm',
        lg: 'h-11 px-4 py-2.5 text-base',
        xl: 'h-12 px-5 py-3 text-lg',
      },
      state: {
        default: '',
        error: 'border-destructive focus:border-destructive focus:ring-destructive text-destructive',
        success: 'border-success focus:border-success focus:ring-success text-success',
        warning: 'border-warning focus:border-warning focus:ring-warning text-warning',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      state: 'default',
      fullWidth: true,
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof VariantProps<typeof inputVariants>>,
    VariantProps<typeof inputVariants> {
  label?: string
  helperText?: string
  errorText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size, 
    state, 
    fullWidth, 
    label, 
    helperText, 
    errorText, 
    leftIcon, 
    rightIcon, 
    loading = false,
    disabled,
    ...props 
  }, ref) => {
    const hasError = !!errorText
    const finalState = hasError ? 'error' : state

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            className={cn(
              inputVariants({ variant, size, state: finalState, fullWidth }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              loading && 'pr-10',
              className
            )}
            ref={ref}
            disabled={disabled || loading}
            {...props}
          />
          {(rightIcon || loading) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {loading ? (
                <svg
                  className="h-4 w-4 animate-spin"
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
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>
        {(helperText || errorText) && (
          <p className={cn(
            'text-xs',
            hasError ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {errorText || helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input, inputVariants }
