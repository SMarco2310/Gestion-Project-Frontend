import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  title: string
  message?: string
  type: ToastType
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// 1. Global state using Vue's ref OUTSIDE the composable function 
// This ensures that all components share the exact same array of toasts!
const toasts = ref<Toast[]>([])

export const useToast = () => {
  
  // Function to add a new toast
  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString()
    const newToast = {
      ...toast,
      id,
      duration: toast.duration || 4000 // Default to 4 seconds
    }
    
    toasts.value.push(newToast)
    
    // Automatically remove the toast after its duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }

  // Function to manually remove a toast early
  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts,
    addToast,
    removeToast
  }
}
