// Validation utilities for registration form
// Comprehensive validation rules with user-friendly error messages

export interface ValidationRule {
  (value: string): string | null
}

export interface ValidationRules {
  name: ValidationRule
  email: ValidationRule
  password: ValidationRule
  phone: ValidationRule
  department: ValidationRule
  approvalCode: ValidationRule
}

export const validationRules: ValidationRules = {
  name: (name: string): string | null => {
    if (!name?.trim()) return 'This field is required'
    
    // Trim leading and trailing spaces
    const trimmedName = name.trim()
    
    // Length validation - count only non-space characters, minimum 2
    const nameWithoutSpaces = trimmedName.replace(/\s/g, '')
    if (nameWithoutSpaces.length < 2) return 'Must be at least 2 characters long (spaces not counted)'
    
    // Total length validation (including spaces)
    if (trimmedName.length > 50) return 'Must be 50 characters or less'
    
    // Explicit check for numbers - names cannot contain digits
    if (/\d/.test(trimmedName)) return 'Names cannot contain numbers'
    
    // Name validation: letters, apostrophes, hyphens, and internal spaces only (including international characters)
    const nameRegex = /^[a-zA-Z\u00C0-\u017F\s'-]+$/
    if (!nameRegex.test(trimmedName)) return 'Only letters, spaces, hyphens, and apostrophes are allowed'
    
    // No consecutive spaces or special characters
    if (/\s{2,}/.test(trimmedName)) return 'Cannot contain consecutive spaces'
    if (/'{2,}|-{2,}/.test(trimmedName)) return 'Cannot contain consecutive hyphens or apostrophes'
    
    // No leading or trailing spaces (should be caught by trim, but double-check)
    if (name !== trimmedName) return 'Cannot start or end with spaces'
    
    return null
  },

  email: (email: string): string | null => {
    if (!email?.trim()) return 'Email address is required'
    
    // Trim leading and trailing spaces
    const trimmedEmail = email.trim()
    
    // Check for any spaces in the email (not allowed)
    if (trimmedEmail !== email || /\s/.test(trimmedEmail)) {
      return 'Email cannot contain spaces'
    }
    
    if (trimmedEmail.length > 100) return 'Email must be 100 characters or less'
    
    // Basic email validation - must have @ and domain
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return 'Please enter a valid email address (e.g., user@domain.com)'
    }
    
    // Additional structural validation
    const parts = trimmedEmail.split('@')
    if (parts.length !== 2) return 'Email must contain exactly one @ symbol'
    
    const [localPart, domain] = parts
    
    // Local part validation
    if (localPart.length < 1) return 'Email address is incomplete before @'
    if (localPart.length > 64) return 'Email address is too long before @'
    
    // Domain validation
    if (domain.length < 4) return 'Domain is too short after @'
    if (!domain.includes('.')) return 'Domain must contain at least one dot'
    
    const domainParts = domain.split('.')
    if (domainParts[domainParts.length - 1].length < 2) {
      return 'Domain extension must be at least 2 characters'
    }
    
    return null
  },

  password: (password: string): string | null => {
    if (!password) return 'Password is required'
    if (password.length < 8) return 'Password must be at least 8 characters long'
    if (password.length > 128) return 'Password must be 128 characters or less'
    
    // Character requirements
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    
    const requirements = []
    if (!hasUpper) requirements.push('uppercase letter')
    if (!hasLower) requirements.push('lowercase letter')
    if (!hasNumber) requirements.push('number')
    if (!hasSpecial) requirements.push('special character')
    
    if (requirements.length > 0) {
      return `Password must include at least one: ${requirements.join(', ')}`
    }
    
    // Security patterns
    if (/(.)\1{2,}/.test(password)) {
      return 'Password cannot contain 3+ identical characters in a row'
    }
    
    // Common weak patterns (optional enhancement)
    const commonPatterns = ['password', '123456', 'qwerty', 'admin']
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      return 'Password cannot contain common patterns'
    }
    
    return null
  },

  phone: (phone: string): string | null => {
    // Phone is now mandatory
    if (!phone?.trim()) return 'Phone number is required'
    
    // Trim leading and trailing spaces
    const trimmedPhone = phone.trim()
    
    // Remove all spaces for validation
    const phoneWithoutSpaces = trimmedPhone.replace(/\s/g, '')
    
    // UK phone number patterns
    // Mobile: 07xxx xxxxxx (11 digits total)
    // Landline: 01xxx xxxxxx or 02xxx xxxxxx (11 digits total)
    const ukMobileRegex = /^07[0-9]{9}$/
    const ukLandlineRegex = /^0[1-2][0-9]{8,9}$/
    
    // Check if it matches UK patterns
    if (!ukMobileRegex.test(phoneWithoutSpaces) && !ukLandlineRegex.test(phoneWithoutSpaces)) {
      return 'Please enter a valid UK phone number (e.g., 07123456789 or 02071234567)'
    }
    
    // Format with spaces for display
    if (ukMobileRegex.test(phoneWithoutSpaces)) {
      // Format: 07123 456789
      const formatted = phoneWithoutSpaces.replace(/(\d{5})(\d{3})(\d{3})/, '$1 $2 $3')
      return null // Valid, will be formatted in handleChange
    } else {
      // Format landline: 020 7123 4567 or 0121 234 5678
      if (phoneWithoutSpaces.startsWith('020')) {
        const formatted = phoneWithoutSpaces.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')
        return null // Valid, will be formatted in handleChange
      } else {
        const formatted = phoneWithoutSpaces.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
        return null // Valid, will be formatted in handleChange
      }
    }
  },

  department: (department: string): string | null => {
    // Department is now optional
    if (!department?.trim()) return null
    
    if (department.length > 100) return 'Department must be 100 characters or less'
    
    // Department validation: letters, numbers, spaces, hyphens, ampersands
    const deptRegex = /^[a-zA-Z0-9\s&-]+$/
    if (!deptRegex.test(department)) return 'Only letters, numbers, spaces, hyphens, and ampersands are allowed'
    
    return null
  },

  approvalCode: (code: string): string | null => {
    if (!code?.trim()) return null // Approval code is optional
    if (code.length < 6) return 'Approval code must be at least 6 characters'
    if (code.length > 50) return 'Approval code must be 50 characters or less'
    
    // Approval code validation: alphanumeric and hyphens only
    const codeRegex = /^[a-zA-Z0-9-]+$/
    if (!codeRegex.test(code)) return 'Only letters, numbers, and hyphens are allowed'
    
    return null
  }
}

// Error message mapping for backend errors
export const getErrorMessage = (error: string): string => {
  const errorMappings = [
    {
      patterns: ['USER_EXISTS', 'already exists', 'duplicate'],
      message: 'This email address is already registered. Please use a different email or <a href="/login" class="underline hover:no-underline">try logging in</a>.'
    },
    {
      patterns: ['email', 'required'],
      message: 'Email address is required for registration.'
    },
    {
      patterns: ['password', 'required'],
      message: 'Password is required for registration.'
    },
    {
      patterns: ['first_name', 'firstName'],
      message: 'First name is required.'
    },
    {
      patterns: ['last_name', 'lastName'],
      message: 'Last name is required.'
    },
    {
      patterns: ['network', 'fetch'],
      message: 'Network error. Please check your connection and try again.'
    },
    {
      patterns: ['server', '500'],
      message: 'Server error. Please try again in a few moments.'
    },
    {
      patterns: ['409'],
      message: 'This email address is already registered. Please use a different email or <a href="/login" class="underline hover:no-underline">try logging in</a>.'
    },
    {
      patterns: ['400'],
      message: 'Please check your information and try again.'
    },
    {
      patterns: ['VALIDATION_ERROR'],
      message: 'Please check your information and try again.'
    }
  ]

  for (const { patterns, message } of errorMappings) {
    if (patterns.some(pattern => error.includes(pattern))) {
      return message
    }
  }
  
  return error || 'Registration failed. Please check your information and try again.'
}

// Form field configuration
export interface FormFieldConfig {
  label: string
  required: boolean
  maxLength?: number
  type: string
  placeholder: string
  icon: string
  hint?: string
}

export const formFields: Record<string, FormFieldConfig> = {
  firstName: {
    label: 'First Name',
    required: true,
    maxLength: 50,
    type: 'text',
    placeholder: 'First name',
    icon: 'user'
  },
  lastName: {
    label: 'Last Name',
    required: true,
    maxLength: 50,
    type: 'text',
    placeholder: 'Last name',
    icon: 'user'
  },
  email: {
    label: 'Email Address',
    required: true,
    maxLength: 100,
    type: 'email',
    placeholder: 'your.email@example.com',
    icon: 'email'
  },
  password: {
    label: 'Password',
    required: true,
    maxLength: 128,
    type: 'password',
    placeholder: 'Create a strong password',
    icon: 'password',
    hint: 'Must be 8+ characters with uppercase, lowercase, number, and special character'
  },
  confirmPassword: {
    label: 'Confirm Password',
    required: true,
    type: 'password',
    placeholder: 'Confirm your password',
    icon: 'check'
  },
  phone: {
    label: 'Phone Number',
    required: true,
    maxLength: 15,
    type: 'tel',
    placeholder: '07123 456789 or 020 7123 4567',
    icon: 'phone',
    hint: 'UK mobile or landline number (required)'
  },
  department: {
    label: 'Department',
    required: false,
    maxLength: 100,
    type: 'text',
    placeholder: 'Engineering, Sales, etc. (Optional)',
    icon: 'building'
  },
  approvalCode: {
    label: 'Approval Code',
    required: false,
    maxLength: 50,
    type: 'text',
    placeholder: 'Enter approval code if you have one',
    icon: 'key',
    hint: 'If you have an approval code, your account will be activated immediately. Otherwise, it will require admin approval.'
  }
}

// Form validation helper
export const validateFormData = (formData: any, confirmPassword: string): Record<string, string> => {
  const errors: Record<string, string> = {}

  // Always validate each field (regardless of touched state)
  const firstNameError = validationRules.name(formData.firstName || '')
  if (firstNameError) errors.firstName = firstNameError

  const lastNameError = validationRules.name(formData.lastName || '')
  if (lastNameError) errors.lastName = lastNameError

  const emailError = validationRules.email(formData.email || '')
  if (emailError) errors.email = emailError

  const passwordError = validationRules.password(formData.password || '')
  if (passwordError) errors.password = passwordError

  // Confirm password validation
  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (formData.password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  // Phone field validation (now mandatory)
  if (formData.phone && formData.phone.trim()) {
    const phoneError = validationRules.phone(formData.phone)
    if (phoneError) errors.phone = phoneError
  } else {
    errors.phone = 'Phone number is required'
  }

  if (formData.department) {
    const departmentError = validationRules.department(formData.department)
    if (departmentError) errors.department = departmentError
  }

  if (formData.approvalCode) {
    const approvalCodeError = validationRules.approvalCode(formData.approvalCode)
    if (approvalCodeError) errors.approvalCode = approvalCodeError
  }

  return errors
}

// Password strength calculator (for future enhancement)
export const calculatePasswordStrength = (password: string): {
  score: number
  label: string
  color: string
} => {
  let score = 0
  
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++
  if (password.length >= 16) score++
  
  if (score <= 2) return { score, label: 'Weak', color: 'red' }
  if (score <= 4) return { score, label: 'Fair', color: 'yellow' }
  if (score <= 6) return { score, label: 'Good', color: 'blue' }
  return { score, label: 'Strong', color: 'green' }
}

// Enhanced validation helpers for debounced validation
export const createFieldValidator = (ruleName: keyof ValidationRules) => {
  return (value: string): string | null => {
    return validationRules[ruleName](value)
  }
}

// Real-time validation helpers
export const shouldValidateRealTime = (fieldName: string, value: string): boolean => {
  // Don't validate empty fields in real-time (except for required validation on blur)
  if (!value || value.trim() === '') return false
  
  // Always validate emails in real-time after minimum length
  if (fieldName === 'email' && value.length >= 3) return true
  
  // Validate passwords in real-time after minimum length
  if (fieldName === 'password' && value.length >= 1) return true
  
  // Validate names in real-time after minimum characters
  if ((fieldName === 'firstName' || fieldName === 'lastName') && value.length >= 2) return true
  
  // Validate phone numbers in real-time after prefix
  if (fieldName === 'phone' && value.length >= 5) return true
  
  return false
}

// Validation state helpers
export const getValidationState = (
  value: string,
  error: string | null,
  isDirty: boolean,
  isValidating: boolean
): {
  state: 'idle' | 'validating' | 'valid' | 'invalid' | 'warning'
  canShowError: boolean
  canShowSuccess: boolean
  shouldShowIndicator: boolean
} => {
  if (!isDirty) {
    return {
      state: 'idle',
      canShowError: false,
      canShowSuccess: false,
      shouldShowIndicator: false
    }
  }
  
  if (isValidating) {
    return {
      state: 'validating',
      canShowError: false,
      canShowSuccess: false,
      shouldShowIndicator: true
    }
  }
  
  if (error) {
    return {
      state: 'invalid',
      canShowError: true,
      canShowSuccess: false,
      shouldShowIndicator: true
    }
  }
  
  if (value && value.trim() !== '') {
    return {
      state: 'valid',
      canShowError: false,
      canShowSuccess: true,
      shouldShowIndicator: true
    }
  }
  
  return {
    state: 'idle',
    canShowError: false,
    canShowSuccess: false,
    shouldShowIndicator: false
  }
}

// Enhanced form field validation with debouncing support
export const validateFieldDebounced = (
  fieldName: string,
  value: string,
  isDirty: boolean = false
): {
  shouldValidate: boolean
  error: string | null
  delay: number
} => {
  // Don't validate if field hasn't been touched
  if (!isDirty) {
    return { shouldValidate: false, error: null, delay: 0 }
  }
  
  // Don't validate empty fields in real-time
  if (!value || value.trim() === '') {
    return { shouldValidate: false, error: null, delay: 0 }
  }
  
  // Check if we should validate this field in real-time
  if (!shouldValidateRealTime(fieldName, value)) {
    return { shouldValidate: false, error: null, delay: 0 }
  }
  
  // Dynamic delay based on field type and content
  let delay = 300 // Default delay
  
  if (fieldName === 'email') {
    // Faster validation for email as users type quickly
    delay = value.includes('@') ? 200 : 400
  } else if (fieldName === 'password') {
    // Slower validation for password to avoid distraction
    delay = 500
  } else if (fieldName === 'phone') {
    // Fast validation for phone numbers
    delay = 150
  }
  
  // Perform validation
  const error = validationRules[fieldName as keyof ValidationRules]?.(value) || null
  
  return {
    shouldValidate: true,
    error,
    delay
  }
}
