'use client'

import { useState, useCallback } from 'react'
import Toast, { ToastType } from '@/components/ui/Toast'

interface ToastData {
  id: string
  message: string
  type: ToastType
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const ToastContainer = useCallback(() => {
    return (
      <>
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{ top: `${(index + 1) * 4}rem` }}
            className="fixed right-4 z-50"
          >
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </>
    )
  }, [toasts, removeToast])

  return {
    showToast,
    ToastContainer,
  }
}