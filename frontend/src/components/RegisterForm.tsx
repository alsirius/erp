'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { RegisterRequest } from '@/types'
import { validationRules, getErrorMessage, validateFormData, formFields, createFieldValidator } from '@/utils/validation'
import { useDebouncedValidation, useEnhancedValidation } from '@/hooks/useDebouncedValidation'
import { ValidationIndicator, FieldValidationIndicator, PasswordStrengthIndicator } from '@/components/ValidationIndicator'
import '@/styles/animations.css'

// Icon components for better organization
const Icons = {
  user: () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  
  email: () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  
  password: () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  
  phone: () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  
  building: () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  
  key: () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  
  check: () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  
  eyeOpen: () => (
    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  
  eyeClosed: () => (
    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
    </svg>
  ),
  
  error: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  
  logo: () => (
    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  
  spinner: () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  
  checkCircle: () => (
    <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  
  nextStep: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),

  nextStepIcon: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),

  nextStepCircle: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8l4 4m0 0l-4 4m4-4H8" />
    </svg>
  ),

  support: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),

  report: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

// Reusable Next Step Button Component
const NextStepButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  text?: string;
  className?: string;
  showText?: boolean;
}> = ({ onClick, disabled = false, text = "Next", className = "", showText = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-14 h-14 text-white bg-emerald-600 border border-transparent rounded-full hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ml-4 flex-shrink-0 ${className}`}
      title={text} // Tooltip for accessibility
    >
      <Icons.nextStepCircle />
    </button>
  )
}

// Main component
export default function RegisterForm() {
  const errorRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { register, loading, error, clearError } = useAuth()

  // Form state
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '+44 0',
    department: '',
    approvalCode: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  // Error scroll effect
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  // Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Prevent numbers in name fields
    if (name === 'firstName' || name === 'lastName') {
      // Allow only letters, spaces, hyphens, apostrophes, and international characters
      const nameRegex = /^[a-zA-Z\u00C0-\u017F\s'-]*$/
      if (!nameRegex.test(value)) {
        // Remove any invalid characters
        const cleanValue = value.replace(/[^a-zA-Z\u00C0-\u017F\s'-]/g, '')
        setFormData(prev => ({ ...prev, [name]: cleanValue }))
        return
      }
    }
    
    // Handle email field - no spaces allowed
    if (name === 'email') {
      // Remove all spaces from email
      const cleanValue = value.replace(/\s/g, '')
      setFormData(prev => ({ ...prev, [name]: cleanValue }))
      
      // Clear error for this field as user types
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }))
      }
      return
    }
    
    // Handle phone field formatting - UK format with spaces
    if (name === 'phone') {
      // Remove all non-digit characters
      let digitsOnly = value.replace(/\D/g, '')
      
      // Limit to 11 digits (UK phone numbers)
      if (digitsOnly.length > 11) {
        digitsOnly = digitsOnly.slice(0, 11)
      }
      
      // Format based on UK patterns
      let formattedValue = ''
      if (digitsOnly.startsWith('07')) {
        // Mobile format: 07123 456789
        if (digitsOnly.length <= 5) {
          formattedValue = digitsOnly
        } else if (digitsOnly.length <= 8) {
          formattedValue = digitsOnly.slice(0, 5) + ' ' + digitsOnly.slice(5)
        } else {
          formattedValue = digitsOnly.slice(0, 5) + ' ' + digitsOnly.slice(5, 8) + ' ' + digitsOnly.slice(8)
        }
      } else if (digitsOnly.startsWith('020')) {
        // London landline: 020 7123 4567
        if (digitsOnly.length <= 3) {
          formattedValue = digitsOnly
        } else if (digitsOnly.length <= 7) {
          formattedValue = digitsOnly.slice(0, 3) + ' ' + digitsOnly.slice(3)
        } else {
          formattedValue = digitsOnly.slice(0, 3) + ' ' + digitsOnly.slice(3, 7) + ' ' + digitsOnly.slice(7)
        }
      } else if (digitsOnly.startsWith('0') && digitsOnly.length >= 3) {
        // Other landline: 0121 234 5678
        if (digitsOnly.length <= 4) {
          formattedValue = digitsOnly
        } else if (digitsOnly.length <= 7) {
          formattedValue = digitsOnly.slice(0, 4) + ' ' + digitsOnly.slice(4)
        } else {
          formattedValue = digitsOnly.slice(0, 4) + ' ' + digitsOnly.slice(4, 7) + ' ' + digitsOnly.slice(7)
        }
      } else {
        // Just use digits as typed
        formattedValue = digitsOnly
      }
      
      setFormData(prev => ({ ...prev, [name]: formattedValue }))
      
      // Clear error for this field as user types
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }))
      }
      return
    }
    
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error for this field as user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    
    if (error) clearError()
  }

  const handleFieldBlur = (fieldName: string) => {
    // Simple step progression - advance when fields are filled
    checkStepProgression()
  }

  const checkStepProgression = () => {
    // Disabled - users must use SKIP TO NEXT buttons to navigate
    // This prevents unwanted auto-advancement
    return
  }

  const canAdvanceToNextStep = () => {
    switch (currentStep) {
      case 1: {
        const firstNameTrimmed = formData.firstName?.trim() || ''
        const lastNameTrimmed = formData.lastName?.trim() || ''
        
        return firstNameTrimmed.length >= 2 && lastNameTrimmed.length >= 2
      }
      case 2: {
        const emailTrimmed = formData.email?.trim() || ''
        return emailTrimmed.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)
      }
      case 3: {
        return formData.password && confirmPassword && formData.password === confirmPassword
      }
      case 4: {
        const phoneTrimmed = formData.phone?.trim() || ''
        const phoneWithoutSpaces = phoneTrimmed.replace(/\s/g, '')
        
        // UK phone validation
        const ukMobileRegex = /^07[0-9]{9}$/
        const ukLandlineRegex = /^0[1-2][0-9]{8,9}$/
        
        return ukMobileRegex.test(phoneWithoutSpaces) || ukLandlineRegex.test(phoneWithoutSpaces)
      }
      case 5: {
        // Step 5 is optional, can always advance
        return true
      }
      default:
        return false
    }
  }

  const handleStepClick = (stepNumber: number) => {
    // Allow navigation to any step
    setCurrentStep(stepNumber)
  }

  const getStepTitle = (step: number): string => {
    switch (step) {
      case 1: return 'Your Name'
      case 2: return 'Email Address'
      case 3: return 'Password'
      case 4: return 'Phone Number'
      case 5: return 'Department & Code'
      case 6: return 'Review & Submit'
      default: return ''
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)
    
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }))
    }
    
    if (error) clearError()
  }

  const scrollToFieldError = () => {
    const firstErrorField = Object.keys(errors)[0]
    if (firstErrorField) {
      const element = document.getElementById(firstErrorField)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.focus()
      }
    }
  }

  // Support functionality
  const generatePasswordHash = (password: string): string => {
    // Simple hash for support (not secure, just for identification)
    let hash = 0
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0')
  }

  const sendSupportRequest = async () => {
    try {
      const supportData = {
        timestamp: new Date().toISOString(),
        formData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          department: formData.department || 'Not provided',
          approvalCode: formData.approvalCode || 'Not provided'
        },
        passwordIndicators: {
          length: formData.password?.length || 0,
          hasUppercase: /[A-Z]/.test(formData.password || ''),
          hasLowercase: /[a-z]/.test(formData.password || ''),
          hasNumbers: /\d/.test(formData.password || ''),
          hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password || ''),
          passwordHash: generatePasswordHash(formData.password || ''),
          confirmPasswordHash: generatePasswordHash(confirmPassword || '')
        },
        validationErrors: errors,
        currentStep: currentStep,
        userAgent: navigator.userAgent,
        supportRequest: 'User struggling with registration form'
      }

      // Create email content
      const emailContent = `
SUPPORT REQUEST - Registration Form Issue

Timestamp: ${supportData.timestamp}
User Agent: ${supportData.userAgent}

FORM DATA:
- Name: ${supportData.formData.firstName} ${supportData.formData.lastName}
- Email: ${supportData.formData.email}
- Phone: ${supportData.formData.phone}
- Department: ${supportData.formData.department}
- Approval Code: ${supportData.formData.approvalCode}

PASSWORD INDICATORS:
- Length: ${supportData.passwordIndicators.length} characters
- Has Uppercase: ${supportData.passwordIndicators.hasUppercase}
- Has Lowercase: ${supportData.passwordIndicators.hasLowercase}
- Has Numbers: ${supportData.passwordIndicators.hasNumbers}
- Has Special Chars: ${supportData.passwordIndicators.hasSpecialChars}
- Password Hash: ${supportData.passwordIndicators.passwordHash}
- Confirm Password Hash: ${supportData.passwordIndicators.confirmPasswordHash}

VALIDATION ERRORS:
${Object.keys(supportData.validationErrors).length > 0 
  ? Object.entries(supportData.validationErrors).map(([field, error]) => `- ${field}: ${error}`).join('\n')
  : 'No validation errors'
}

CURRENT STEP: ${supportData.currentStep}

REQUEST: ${supportData.supportRequest}
      `.trim()

      // Create mailto link
      const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@siriux.com'
      const subject = encodeURIComponent('Registration Form Support Request')
      const body = encodeURIComponent(emailContent)
      
      window.open(`mailto:${supportEmail}?subject=${subject}&body=${body}`)
      
    } catch (error) {
      console.error('Failed to send support request:', error)
      alert('Failed to open email client. Please contact support directly.')
    }
  }

  // SQL injection and security patterns to block
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  /(--|;|\/\*|\*\/|xp_|sp_)/,
  /(\bOR\b.*=.*\bOR\b|\bAND\b.*=.*\bAND\b)/i,
  /('|(\\')|('')|(%27)|(%22))/i,
  /(<script|javascript:|vbscript:|onload=|onerror=)/i,
  /(\bUNION\b.*\bSELECT\b)/i
]

// Security check function
const containsSecurityThreats = (value: string): boolean => {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value))
}

const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    // Validate first name with industry standards
    const firstNameTrimmed = formData.firstName?.trim() || ''
    if (!firstNameTrimmed) {
      newErrors.firstName = 'First name is required'
    } else if (firstNameTrimmed.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters'
    } else if (firstNameTrimmed.length > 50) {
      newErrors.firstName = 'First name must be less than 50 characters'
    } else if (!/^[a-zA-Z\u00C0-\u017F\s'-]+$/.test(firstNameTrimmed)) {
      newErrors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes'
    } else if (/\s{2,}/.test(firstNameTrimmed)) {
      newErrors.firstName = 'First name cannot contain consecutive spaces'
    } else if (/'{2,}/.test(firstNameTrimmed)) {
      newErrors.firstName = 'First name cannot contain consecutive apostrophes'
    } else if (/-{2,}/.test(firstNameTrimmed)) {
      newErrors.firstName = 'First name cannot contain consecutive hyphens'
    } else if (/[\s'-]{2,}/.test(firstNameTrimmed)) {
      newErrors.firstName = 'First name cannot contain consecutive spaces, hyphens, or apostrophes'
    } else if (/^[\s'-]|[\s'-]$/.test(firstNameTrimmed)) {
      newErrors.firstName = 'First name cannot start or end with space, hyphen, or apostrophe'
    } else if (!/[a-zA-Z\u00C0-\u017F]{2,}/.test(firstNameTrimmed.replace(/[^a-zA-Z\u00C0-\u017F]/g, ''))) {
      newErrors.firstName = 'First name must contain at least 2 alphabetic characters'
    } else if (containsSecurityThreats(firstNameTrimmed)) {
      newErrors.firstName = 'Invalid characters in first name'
    }
    
    // Validate last name with industry standards
    const lastNameTrimmed = formData.lastName?.trim() || ''
    if (!lastNameTrimmed) {
      newErrors.lastName = 'Last name is required'
    } else if (lastNameTrimmed.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters'
    } else if (lastNameTrimmed.length > 50) {
      newErrors.lastName = 'Last name must be less than 50 characters'
    } else if (!/^[a-zA-Z\u00C0-\u017F\s'-]+$/.test(lastNameTrimmed)) {
      newErrors.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes'
    } else if (/\s{2,}/.test(lastNameTrimmed)) {
      newErrors.lastName = 'Last name cannot contain consecutive spaces'
    } else if (/'{2,}/.test(lastNameTrimmed)) {
      newErrors.lastName = 'Last name cannot contain consecutive apostrophes'
    } else if (/-{2,}/.test(lastNameTrimmed)) {
      newErrors.lastName = 'Last name cannot contain consecutive hyphens'
    } else if (/[\s'-]{2,}/.test(lastNameTrimmed)) {
      newErrors.lastName = 'Last name cannot contain consecutive spaces, hyphens, or apostrophes'
    } else if (/^[\s'-]|[\s'-]$/.test(lastNameTrimmed)) {
      newErrors.lastName = 'Last name cannot start or end with space, hyphen, or apostrophe'
    } else if (!/[a-zA-Z\u00C0-\u017F]{2,}/.test(lastNameTrimmed.replace(/[^a-zA-Z\u00C0-\u017F]/g, ''))) {
      newErrors.lastName = 'Last name must contain at least 2 alphabetic characters'
    } else if (containsSecurityThreats(lastNameTrimmed)) {
      newErrors.lastName = 'Invalid characters in last name'
    }
    
    // Validate email with industry standards
    const emailTrimmed = formData.email?.trim() || ''
    if (!emailTrimmed) {
      newErrors.email = 'Email is required'
    } else if (/\s/.test(emailTrimmed)) {
      newErrors.email = 'Email cannot contain spaces'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      newErrors.email = 'Please enter a valid email address (e.g., user@domain.com)'
    } else {
      // More detailed email validation
      const [localPart, domain] = emailTrimmed.split('@')
      if (localPart.length < 1) {
        newErrors.email = 'Email username is too short'
      } else if (localPart.length > 64) {
        newErrors.email = 'Email username is too long'
      } else if (domain.length < 4) {
        newErrors.email = 'Email domain is too short'
      } else if (!domain.includes('.')) {
        newErrors.email = 'Email domain must include a dot'
      } else if (containsSecurityThreats(emailTrimmed)) {
        newErrors.email = 'Invalid email format'
      }
    }
    
    // Validate password with proper policy
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      // Password policy validation
      const password = formData.password
      if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long'
      } else if (password.length > 128) {
        newErrors.password = 'Password must be less than 128 characters'
      } else if (!/[a-z]/.test(password)) {
        newErrors.password = 'Password must contain at least one lowercase letter'
      } else if (!/[A-Z]/.test(password)) {
        newErrors.password = 'Password must contain at least one uppercase letter'
      } else if (!/\d/.test(password)) {
        newErrors.password = 'Password must contain at least one number'
      } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        newErrors.password = 'Password must contain at least one special character'
      } else if (containsSecurityThreats(password)) {
        newErrors.password = 'Invalid characters in password'
      }
    }
    
    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    
    // If there are any errors, block submission and show them
    if (Object.keys(newErrors).length > 0) {
      console.log('Validation errors found:', newErrors)
      setTimeout(() => scrollToFieldError(), 100)
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear any previous errors
    setErrors({})
    
    if (!validateForm()) return

    setIsSubmitting(true)
    clearError()

    try {
      await register(formData)
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch (err: any) {
      // Handle detailed error messages
      console.error('Registration error:', err)
      
      // Show specific error message based on the error
      let errorMessage = 'Registration failed'
      
      if (err?.response?.data?.error) {
        errorMessage = err.response.data.error
        console.log('🔴 Backend error message:', errorMessage)
      } else if (err?.message) {
        errorMessage = err.message
        console.log('🔴 JavaScript error message:', errorMessage)
      } else if (typeof err === 'string') {
        errorMessage = err
        console.log('🔴 String error:', errorMessage)
      }
      
      // Set the error to display
      setErrors({ combined: errorMessage })
      
      // Scroll to show the error
      setTimeout(() => {
        if (errorRef.current) {
          errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render helpers
  const renderField = (fieldName: string, stepNumber: number) => {
    const field = formFields[fieldName]
    if (!field) return null

    // Check if this field should be visible based on current step
    if (stepNumber > currentStep) return null

    const getIcon = (iconName: string) => {
      switch (iconName) {
        case 'user': return Icons.user()
        case 'email': return Icons.email()
        case 'password': return Icons.password()
        case 'phone': return Icons.phone()
        case 'building': return Icons.building()
        case 'key': return Icons.key()
        case 'check': return Icons.check()
        default: return null
      }
    }

    const fieldValue = fieldName === 'confirmPassword' ? confirmPassword : formData[fieldName as keyof RegisterRequest]
    const isFieldFilled = fieldValue && fieldValue.trim() !== ''
    const isCurrentStep = stepNumber === currentStep
    const isFieldFocused = focusedField === fieldName
    const hasError = errors[fieldName]

    // Determine field styling based on state
    const getFieldClassName = () => {
      const baseClasses = 'appearance-none relative block w-full py-3 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:z-10 sm:text-sm transition-all duration-200'
      
      const paddingClasses = fieldName === 'phone' ? 'pl-16' : 'pl-10'
      const rightPaddingClasses = (fieldName === 'password' || fieldName === 'confirmPassword') ? 'pr-10' : 'pr-3'
      
      let stateClasses = ''
      if (isFieldFocused) {
        stateClasses = 'border-emerald-400 ring-2 ring-emerald-200 shadow-lg transform scale-[1.02]'
      } else if (hasError) {
        stateClasses = 'border-red-300 ring-2 ring-red-100'
      } else if (isCurrentStep) {
        stateClasses = 'border-emerald-200 ring-1 ring-emerald-50 hover:border-emerald-300'
      } else {
        stateClasses = 'border-gray-300'
      }
      
      const shadowClasses = isCurrentStep ? 'shadow-sm' : ''
      
      return `${baseClasses} ${paddingClasses} ${rightPaddingClasses} ${stateClasses} ${shadowClasses}`
    }

    return (
      <div className={`transition-all duration-500 ${
        isCurrentStep ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 hidden'
      }`}>
        <label htmlFor={fieldName} className={`block text-sm font-medium mb-2 transition-colors ${
          isCurrentStep ? 'text-gray-900' : 'text-gray-600'
        }`}>
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
          {!field.required && <span className="text-gray-400"> (Optional)</span>}
        </label>
        
        <div className="relative">
          {fieldName !== 'phone' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {getIcon(field.icon)}
            </div>
          )}
          {fieldName === 'phone' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-700 font-medium">+44 0</span>
            </div>
          )}
          
          <input
            id={fieldName}
            name={fieldName}
            type={field.type === 'password' && fieldName === 'password' ? (showPassword ? 'text' : 'password') : 
                  field.type === 'password' && fieldName === 'confirmPassword' ? (showConfirmPassword ? 'text' : 'password') : 
                  field.type}
            required={field.required}
            maxLength={field.maxLength}
            className={getFieldClassName()}
            placeholder={field.placeholder}
            value={fieldValue || ''}
            onChange={(e) => {
              const syntheticEvent = {
                target: { name: fieldName, value: e.target.value }
              } as React.ChangeEvent<HTMLInputElement>
              fieldName === 'confirmPassword' ? handleConfirmPasswordChange(syntheticEvent) : handleChange(syntheticEvent)
            }}
            onFocus={() => {
              setFocusedField(fieldName)
            }}
            onBlur={() => {
              setFocusedField(null)
              handleFieldBlur(fieldName)
            }}
            disabled={isSubmitting}
            autoFocus={isCurrentStep && fieldName !== 'confirmPassword'}
          />
          
          {(fieldName === 'password' || fieldName === 'confirmPassword') && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={() => fieldName === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
                className="h-5 w-5 text-gray-400 hover:text-gray-600"
              >
                {(fieldName === 'password' ? showPassword : showConfirmPassword) ? Icons.eyeOpen() : Icons.eyeClosed()}
              </button>
            </div>
          )}
        </div>
        
        {/* Error message */}
        {hasError && (
          <div className="mt-1 flex items-start gap-2 animate-pulse">
            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-600">{hasError}</p>
          </div>
        )}
        
        {/* Password strength indicator and requirements */}
        {fieldName === 'password' && fieldValue && (
          <div className="mt-2 space-y-2">
            <PasswordStrengthIndicator
              password={fieldValue}
              showLabel={true}
              showBar={true}
              size="sm"
            />
            <div className="text-xs text-gray-600 space-y-1">
              <div className={fieldValue.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                {fieldValue.length >= 8 ? '✓' : '○'} At least 8 characters
              </div>
              <div className={/[a-z]/.test(fieldValue) ? 'text-green-600' : 'text-gray-500'}>
                {/[a-z]/.test(fieldValue) ? '✓' : '○'} One lowercase letter
              </div>
              <div className={/[A-Z]/.test(fieldValue) ? 'text-green-600' : 'text-gray-500'}>
                {/[A-Z]/.test(fieldValue) ? '✓' : '○'} One uppercase letter
              </div>
              <div className={/\d/.test(fieldValue) ? 'text-green-600' : 'text-gray-500'}>
                {/\d/.test(fieldValue) ? '✓' : '○'} One number
              </div>
              <div className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(fieldValue) ? 'text-green-600' : 'text-gray-500'}>
                {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(fieldValue) ? '✓' : '○'} One special character
              </div>
            </div>
          </div>
        )}
        
        {/* Field hint */}
        {field.hint && !hasError && (
          <p className="mt-1 text-xs text-gray-500">{field.hint}</p>
        )}
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Header section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-3xl shadow-xl mb-6 transform hover:scale-105 transition-transform duration-200">
            {Icons.logo()}
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Join Siriux Today
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Create your account and start your journey with us. Fill in your information to get started.
          </p>
        </div>

        {/* Main form card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 transition-all duration-300 hover:shadow-3xl">
          <div className="text-center mb-8">
            <p className="text-gray-600 flex items-center justify-center gap-2">
              {Icons.checkCircle()}
              All fields marked with <span className="text-red-500 font-medium">*</span> are required
            </p>
          </div>
              
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                {error && (
                  <div ref={errorRef} className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 shadow-sm">
                    <div className="flex-shrink-0 mt-0.5">
                      {Icons.error()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-red-800">Registration Error</h3>
                      <p 
                        className="text-sm text-red-700 mt-1 whitespace-pre-line" 
                        dangerouslySetInnerHTML={{ __html: getErrorMessage(error) }}
                      />
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={clearError}
                          className="text-sm text-red-600 hover:text-red-800 underline"
                        >
                          Dismiss
                        </button>
                        <span className="text-red-400">•</span>
                        <button
                          type="button"
                          onClick={sendSupportRequest}
                          className="text-sm text-red-600 hover:text-red-800 underline flex items-center gap-1"
                        >
                          <Icons.support />
                          Report to Support
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show combined validation errors */}
                {errors.combined && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 shadow-sm">
                    <div className="flex-shrink-0 mt-0.5">
                      {Icons.error()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-red-800">Registration Error</h3>
                      <p className="text-sm text-red-700 mt-1">{errors.combined}</p>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setErrors(prev => ({ ...prev, combined: '' }))}
                          className="text-sm text-red-600 hover:text-red-800 underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress indicator */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => handleStepClick(step)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                          step === currentStep
                            ? 'bg-emerald-500 text-white shadow-lg scale-110'
                            : step < currentStep
                              ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                        }`}
                        title={`Step ${step}: ${getStepTitle(step)}`}
                      >
                        {step < currentStep ? '✓' : step}
                      </button>
                    ))}
                  </div>
                  <div className="text-center text-sm text-gray-600 font-medium">
                    {getStepTitle(currentStep)}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Step 1: Names */}
                  <div className={`transition-all duration-500 ${
                    currentStep === 1 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 hidden'
                  }`}>
                    <div className="space-y-4">
                      <div className="flex flex-col-3 gap-3 items-end">
                        {renderField('firstName', 1)}
                        {renderField('lastName', 1)}
                        <NextStepButton
                          onClick={() => setCurrentStep(2)}
                          disabled={!canAdvanceToNextStep()}
                          text="Skip to Next"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Email */}
                  <div className={`transition-all duration-500 ${
                    currentStep === 2 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 hidden'
                  }`}>
                    <div className="space-y-4">
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          {renderField('email', 2)}
                        </div>
                        <NextStepButton
                          onClick={() => setCurrentStep(3)}
                          disabled={!canAdvanceToNextStep()}
                          text="Skip to Next"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Passwords */}
                  <div className={`transition-all duration-500 ${
                    currentStep === 3 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 hidden'
                  }`}>
                    <div className="space-y-4">
                      {renderField('password', 3)}
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          {renderField('confirmPassword', 3)}
                        </div>
                        <NextStepButton
                          onClick={() => setCurrentStep(4)}
                          disabled={!formData.password || !confirmPassword}
                          text="Move to Next"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Phone */}
                  <div className={`transition-all duration-500 ${
                    currentStep === 4 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 hidden'
                  }`}>
                    <div className="space-y-4">
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          {renderField('phone', 4)}
                        </div>
                        <NextStepButton
                          onClick={() => setCurrentStep(5)}
                          disabled={!canAdvanceToNextStep()}
                          text="Skip to Next"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 5: Department and Approval Code (Combined Optional) */}
                  <div className={`space-y-4 transition-all duration-500 ${
                    currentStep === 5 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 hidden'
                  }`}>
                    {renderField('department', 5)}
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        {renderField('approvalCode', 5)}
                      </div>
                      <NextStepButton
                        onClick={() => setCurrentStep(6)}
                        text="Skip to Review"
                      />
                    </div>
                  </div>

                  {/* Step 6: Review and Submit */}
                  <div className={`space-y-4 transition-all duration-500 ${
                    currentStep === 6 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 hidden'
                  }`}>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-emerald-800 mb-4">Review Your Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-emerald-100">
                          <span className="text-sm font-medium text-gray-700">First Name:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">{formData.firstName || 'Not provided'}</span>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(1)}
                              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-emerald-100">
                          <span className="text-sm font-medium text-gray-700">Last Name:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">{formData.lastName || 'Not provided'}</span>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(1)}
                              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-emerald-100">
                          <span className="text-sm font-medium text-gray-700">Email:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">{formData.email || 'Not provided'}</span>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(2)}
                              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-emerald-100">
                          <span className="text-sm font-medium text-gray-700">Password:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">{formData.password ? '••••••••••' : 'Not provided'}</span>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(3)}
                              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-emerald-100">
                          <span className="text-sm font-medium text-gray-700">Phone:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">{formData.phone && formData.phone !== '+44 0' ? formData.phone : 'Not provided'}</span>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(4)}
                              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-emerald-100">
                          <span className="text-sm font-medium text-gray-700">Department:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">{formData.department || 'Not provided'}</span>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(5)}
                              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                        {formData.approvalCode && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm font-medium text-gray-700">Approval Code:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900">{formData.approvalCode}</span>
                              <button
                                type="button"
                                onClick={() => setCurrentStep(5)}
                                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Show validation errors if any */}
                        {Object.keys(errors).length > 0 && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <h4 className="text-sm font-semibold text-red-800 mb-2">Please fix the following errors:</h4>
                            {Object.entries(errors).map(([field, error]) => (
                              <div key={field} className="text-sm text-red-700">
                                • <strong>{field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}:</strong> {error}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* CREATE ACCOUNT button - only show on final step */}
                    <div>
                      <button
                        type="submit"
                        disabled={loading || isSubmitting}
                        className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-semibold rounded-xl text-white transition-all duration-200 transform ${
                          (loading || isSubmitting) 
                            ? 'bg-gray-400 cursor-not-allowed opacity-75' 
                            : 'bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                      >
                        {(loading || isSubmitting) ? (
                          <>
                            {Icons.spinner()}
                            Creating Account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </button>
                      {/* Support button */}
                      <div className="mt-3 text-center">
                        <button
                          type="button"
                          onClick={sendSupportRequest}
                          className="text-sm text-gray-500 hover:text-gray-700 underline flex items-center gap-1 justify-center"
                        >
                          <Icons.support />
                          Having trouble? Get help from support
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remove the old submit button that was outside the step structure */}
                {/* <div> ... old submit button removed ... </div> */}
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                href="/login"
                className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2024 Siriux. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
