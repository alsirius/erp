import React from 'react'

interface ValidationIndicatorProps {
  state: 'idle' | 'validating' | 'valid' | 'invalid' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
  text?: string
}

/**
 * Visual validation indicator component that shows checkmarks, X marks, or loading states
 */
export const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({
  state,
  size = 'md',
  className = '',
  showText = false,
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const renderIcon = () => {
    switch (state) {
      case 'validating':
        return (
          <div className={`${sizeClasses[size]} animate-spin`}>
            <svg
              className="w-full h-full text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )

      case 'valid':
        return (
          <div className={`${sizeClasses[size]} text-emerald-500`}>
            <svg
              className="w-full h-full"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )

      case 'invalid':
        return (
          <div className={`${sizeClasses[size]} text-red-500`}>
            <svg
              className="w-full h-full"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )

      case 'warning':
        return (
          <div className={`${sizeClasses[size]} text-amber-500`}>
            <svg
              className="w-full h-full"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )

      case 'idle':
      default:
        return null
    }
  }

  const getStateText = () => {
    if (text) return text
    
    switch (state) {
      case 'validating':
        return 'Validating...'
      case 'valid':
        return 'Valid'
      case 'invalid':
        return 'Invalid'
      case 'warning':
        return 'Warning'
      default:
        return ''
    }
  }

  if (state === 'idle') {
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {renderIcon()}
      {showText && (
        <span className={`${textSizeClasses[size]} font-medium ${
          state === 'valid' ? 'text-emerald-600' :
          state === 'invalid' ? 'text-red-600' :
          state === 'warning' ? 'text-amber-600' :
          'text-blue-600'
        }`}>
          {getStateText()}
        </span>
      )}
    </div>
  )
}

interface FieldValidationIndicatorProps {
  value: string
  error: string | null
  isDirty: boolean
  isValidating: boolean
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

/**
 * Enhanced field validation indicator that automatically determines state
 */
export const FieldValidationIndicator: React.FC<FieldValidationIndicatorProps> = ({
  value,
  error,
  isDirty,
  isValidating,
  size = 'md',
  showText = false,
  className = ''
}) => {
  const getState = (): 'idle' | 'validating' | 'valid' | 'invalid' | 'warning' => {
    if (!isDirty) return 'idle'
    if (isValidating) return 'validating'
    if (error) return 'invalid'
    if (value && value.trim() !== '') return 'valid'
    return 'idle'
  }

  const state = getState()

  return (
    <ValidationIndicator
      state={state}
      size={size}
      showText={showText}
      className={className}
    />
  )
}

interface PasswordStrengthIndicatorProps {
  password: string
  showLabel?: boolean
  showBar?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Password strength indicator with visual bar and text
 */
export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showLabel = true,
  showBar = true,
  size = 'md',
  className = ''
}) => {
  const { calculatePasswordStrength } = require('@/utils/validation')
  const strength = calculatePasswordStrength(password)
  
  const barHeight = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const getStrengthColor = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500'
      case 'yellow': return 'bg-yellow-500'
      case 'blue': return 'bg-blue-500'
      case 'green': return 'bg-green-500'
      default: return 'bg-gray-300'
    }
  }

  const getStrengthTextColor = (color: string) => {
    switch (color) {
      case 'red': return 'text-red-600'
      case 'yellow': return 'text-yellow-600'
      case 'blue': return 'text-blue-600'
      case 'green': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  if (!password || password.length === 0) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={`${textSize[size]} font-medium text-gray-700`}>
            Password Strength
          </span>
          <span className={`${textSize[size]} font-medium ${getStrengthTextColor(strength.color)}`}>
            {strength.label}
          </span>
        </div>
      )}
      
      {showBar && (
        <div className={`w-full ${barHeight[size]} bg-gray-200 rounded-full overflow-hidden`}>
          <div
            className={`h-full ${getStrengthColor(strength.color)} transition-all duration-300 ease-out`}
            style={{ width: `${(strength.score / 7) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
