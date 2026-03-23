import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Debounced validation hook to prevent validation spam while typing
 * @param value - The value to validate
 * @param validator - Validation function that returns error message or null
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Object with validation state, error, and helper functions
 */
export function useDebouncedValidation<T = string>(
  value: T,
  validator: (value: T) => string | null,
  delay: number = 300
) {
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastValidatedValue = useRef<T | null>(null)

  // Clear validation timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Debounced validation effect
  useEffect(() => {
    // Don't validate if value hasn't changed or is not dirty
    if (!isDirty || value === lastValidatedValue.current) {
      return
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set validating state
    setIsValidating(true)

    // Set new timeout for validation
    timeoutRef.current = setTimeout(() => {
      try {
        const validationError = validator(value)
        setError(validationError)
        setIsValid(!validationError)
        lastValidatedValue.current = value
      } catch (err) {
        console.error('Validation error:', err)
        setError('Validation failed')
        setIsValid(false)
      } finally {
        setIsValidating(false)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, validator, delay, isDirty])

  // Manual validation function
  const validateNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    setIsDirty(true)
    setIsValidating(true)
    
    try {
      const validationError = validator(value)
      setError(validationError)
      setIsValid(!validationError)
      lastValidatedValue.current = value
      return !validationError
    } catch (err) {
      console.error('Validation error:', err)
      setError('Validation failed')
      setIsValid(false)
      return false
    } finally {
      setIsValidating(false)
    }
  }, [value, validator])

  // Mark field as dirty (user has interacted with it)
  const markDirty = useCallback(() => {
    setIsDirty(true)
  }, [])

  // Reset validation state
  const reset = useCallback(() => {
    setError(null)
    setIsValid(null)
    setIsValidating(false)
    setIsDirty(false)
    lastValidatedValue.current = null
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  // Force validation (useful for form submission)
  const forceValidate = useCallback(() => {
    return validateNow()
  }, [validateNow])

  return {
    // Validation state
    error,
    isValid,
    isValidating,
    isDirty,
    
    // Helper functions
    validateNow,
    markDirty,
    reset,
    forceValidate,
    
    // Computed states
    hasError: !!error,
    canShowError: isDirty && !isValidating && !!error,
    canShowSuccess: isDirty && !isValidating && isValid && value !== '' && value !== null
  }
}

/**
 * Enhanced validation hook with additional features
 */
export function useEnhancedValidation<T = string>(
  value: T,
  validator: (value: T) => string | null,
  options: {
    delay?: number
    validateOnBlur?: boolean
    validateOnChange?: boolean
    showSuccessIndicator?: boolean
  } = {}
) {
  const {
    delay = 300,
    validateOnBlur = true,
    validateOnChange = true,
    showSuccessIndicator = true
  } = options

  const baseValidation = useDebouncedValidation(value, validator, delay)
  const [focused, setFocused] = useState(false)
  const [touched, setTouched] = useState(false)

  // Enhanced handlers
  const handleFocus = useCallback(() => {
    setFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setFocused(false)
    setTouched(true)
    
    if (validateOnBlur) {
      baseValidation.validateNow()
    }
  }, [validateOnBlur, baseValidation])

  const handleChange = useCallback(() => {
    if (validateOnChange) {
      baseValidation.markDirty()
    }
  }, [validateOnChange, baseValidation])

  return {
    ...baseValidation,
    // Enhanced state
    focused,
    touched,
    
    // Enhanced computed states
    shouldShowError: touched && !focused && baseValidation.hasError,
    shouldShowSuccess: showSuccessIndicator && touched && !focused && baseValidation.canShowSuccess,
    
    // Enhanced handlers
    handleFocus,
    handleBlur,
    handleChange
  }
}

/**
 * Multi-field validation hook for form-level validation
 */
export function useFormValidation<T extends Record<string, any>>(
  formData: T,
  validators: Record<keyof T, (value: any) => string | null>,
  options: {
    delay?: number
    validateOnChange?: boolean
  } = {}
) {
  const { delay = 300, validateOnChange = true } = options
  const [errors, setErrors] = useState<Partial<Record<keyof T, string | null>>>({})
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastValidatedData = useRef<T | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!validateOnChange || !isDirty || formData === lastValidatedData.current) {
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsValidating(true)

    timeoutRef.current = setTimeout(() => {
      try {
        const newErrors: Partial<Record<keyof T, string | null>> = {}
        let formIsValid = true

        Object.entries(validators).forEach(([field, validator]) => {
          const error = validator(formData[field as keyof T])
          newErrors[field as keyof T] = error
          if (error) {
            formIsValid = false
          }
        })

        setErrors(newErrors)
        setIsValid(formIsValid)
        lastValidatedData.current = { ...formData }
      } catch (err) {
        console.error('Form validation error:', err)
        setIsValid(false)
      } finally {
        setIsValidating(false)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [formData, validators, delay, validateOnChange, isDirty])

  const validateForm = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsDirty(true)
    setIsValidating(true)

    try {
      const newErrors: Partial<Record<keyof T, string | null>> = {}
      let formIsValid = true

      Object.entries(validators).forEach(([field, validator]) => {
        const error = validator(formData[field as keyof T])
        newErrors[field as keyof T] = error
        if (error) {
          formIsValid = false
        }
      })

      setErrors(newErrors)
      setIsValid(formIsValid)
      lastValidatedData.current = { ...formData }
      
      return { isValid: formIsValid, errors: newErrors }
    } catch (err) {
      console.error('Form validation error:', err)
      setIsValid(false)
      return { isValid: false, errors }
    } finally {
      setIsValidating(false)
    }
  }, [formData, validators])

  const markDirty = useCallback(() => {
    setIsDirty(true)
  }, [])

  const reset = useCallback(() => {
    setErrors({})
    setIsValid(null)
    setIsValidating(false)
    setIsDirty(false)
    lastValidatedData.current = null
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  return {
    errors,
    isValid,
    isValidating,
    isDirty,
    hasErrors: Object.values(errors).some(error => !!error),
    validateForm,
    markDirty,
    reset,
    getFieldError: (field: keyof T) => errors[field] || null,
    hasFieldError: (field: keyof T) => !!errors[field]
  }
}
