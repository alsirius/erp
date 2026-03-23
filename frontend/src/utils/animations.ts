// Animation utilities for enhanced form interactions
import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook for smooth scroll animations
 */
export const useSmoothScroll = (targetRef: React.RefObject<HTMLElement>, delay: number = 0) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (targetRef.current) {
        targetRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [targetRef, delay])
}

/**
 * Animation class names for different states
 */
export const animationClasses = {
  // Field animations
  fieldFocus: 'transition-all duration-200 ease-out transform scale-[1.02] shadow-lg',
  fieldBlur: 'transition-all duration-200 ease-out transform scale-100',
  fieldError: 'animate-pulse border-red-400 ring-red-200',
  fieldSuccess: 'border-emerald-400 ring-emerald-200',
  
  // Button animations
  buttonHover: 'transition-all duration-200 ease-out transform hover:scale-105 hover:shadow-lg',
  buttonActive: 'transition-all duration-100 ease-out transform active:scale-95',
  buttonLoading: 'transition-all duration-300 ease-out opacity-75 cursor-wait',
  
  // Progress animations
  stepEnter: 'animate-slideInRight',
  stepExit: 'animate-slideOutLeft',
  progressComplete: 'animate-bounce-once',
  
  // Validation animations
  validationShow: 'animate-fadeInUp',
  validationHide: 'animate-fadeOutDown',
  errorShake: 'animate-shake',
  successPulse: 'animate-pulse-once',
  
  // Loading animations
  loadingSpinner: 'animate-spin',
  loadingPulse: 'animate-pulse',
  loadingSkeleton: 'animate-shimmer'
}

/**
 * CSS-in-JS animation keyframes
 */
export const animationKeyframes = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOutLeft {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(-30px);
    }
  }

  @keyframes bounce-once {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeOutDown {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(10px);
    }
  }

  @keyframes shake {
    0%, 100% {
      transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: translateX(-5px);
    }
    20%, 40%, 60%, 80% {
      transform: translateX(5px);
    }
  }

  @keyframes pulse-once {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }

  .animate-slideInRight {
    animation: slideInRight 0.3s ease-out;
  }

  .animate-slideOutLeft {
    animation: slideOutLeft 0.3s ease-out;
  }

  .animate-bounce-once {
    animation: bounce-once 0.5s ease-out;
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.3s ease-out;
  }

  .animate-fadeOutDown {
    animation: fadeOutDown 0.3s ease-out;
  }

  .animate-shake {
    animation: shake 0.5s ease-out;
  }

  .animate-pulse-once {
    animation: pulse-once 0.3s ease-out;
  }

  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
  }
`

/**
 * Custom hook for managing animation states
 */
export const useAnimationState = (initialState: string = '') => {
  const [animationClass, setAnimationClass] = useState(initialState)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const playAnimation = (className: string, duration: number = 300) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Add the animation class
    setAnimationClass(className)

    // Remove the animation class after duration
    timeoutRef.current = setTimeout(() => {
      setAnimationClass('')
    }, duration)
  }

  const clearAnimation = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setAnimationClass('')
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    animationClass,
    playAnimation,
    clearAnimation
  }
}

/**
 * Utility functions for common animations
 */
export const animations = {
  /**
   * Animate an element with a shake effect (for errors)
   */
  shake: (element: HTMLElement | null) => {
    if (!element) return
    
    element.classList.add('animate-shake')
    setTimeout(() => {
      element.classList.remove('animate-shake')
    }, 500)
  },

  /**
   * Animate an element with a bounce effect (for success)
   */
  bounce: (element: HTMLElement | null) => {
    if (!element) return
    
    element.classList.add('animate-bounce-once')
    setTimeout(() => {
      element.classList.remove('animate-bounce-once')
    }, 500)
  },

  /**
   * Animate an element with a fade in effect
   */
  fadeIn: (element: HTMLElement | null, delay: number = 0) => {
    if (!element) return
    
    setTimeout(() => {
      element.classList.add('animate-fadeInUp')
      setTimeout(() => {
        element.classList.remove('animate-fadeInUp')
      }, 300)
    }, delay)
  },

  /**
   * Animate an element with a fade out effect
   */
  fadeOut: (element: HTMLElement | null, delay: number = 0) => {
    if (!element) return
    
    setTimeout(() => {
      element.classList.add('animate-fadeOutDown')
      setTimeout(() => {
        element.classList.remove('animate-fadeOutDown')
      }, 300)
    }, delay)
  }
}

/**
 * Enhanced transition utilities
 */
export const transitions = {
  /**
   * Smooth height transition for collapsible content
   */
  height: {
    enter: 'transition-all duration-300 ease-out',
    exit: 'transition-all duration-300 ease-out'
  },

  /**
   * Smooth opacity transitions
   */
  opacity: {
    enter: 'transition-opacity duration-200 ease-out',
    exit: 'transition-opacity duration-200 ease-out'
  },

  /**
   * Smooth transform transitions
   */
  transform: {
    enter: 'transition-transform duration-200 ease-out',
    exit: 'transition-transform duration-200 ease-out'
  },

  /**
   * Combined transitions for complex animations
   */
  all: {
    fast: 'transition-all duration-150 ease-out',
    normal: 'transition-all duration-200 ease-out',
    slow: 'transition-all duration-300 ease-out'
  }
}

/**
 * Button animation variants
 */
export const buttonAnimations = {
  primary: 'transition-all duration-200 ease-out transform hover:scale-105 hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
  secondary: 'transition-all duration-200 ease-out transform hover:scale-105 hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  danger: 'transition-all duration-200 ease-out transform hover:scale-105 hover:shadow-lg hover:bg-red-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
  loading: 'transition-all duration-300 ease-out opacity-75 cursor-not-allowed transform-none hover:scale-100 hover:shadow-none'
}

/**
 * Field animation variants
 */
export const fieldAnimations = {
  default: 'transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
  success: 'transition-all duration-200 ease-out border-emerald-300 ring-2 ring-emerald-100 focus:ring-emerald-500 focus:border-emerald-500',
  error: 'transition-all duration-200 ease-out border-red-300 ring-2 ring-red-100 focus:ring-red-500 focus:border-red-500',
  focused: 'transition-all duration-200 ease-out transform scale-[1.02] shadow-lg'
}
