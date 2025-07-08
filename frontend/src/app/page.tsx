'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the first page
    router.push('/pages/1')
  }, [router])

  return (
    <div className="page-container">
      <div className="animate-pulse">
        <div className="h-12 bg-notion-bg-secondary rounded w-1/3 mb-8"></div>
        <div className="space-y-4">
          <div className="h-4 bg-notion-bg-secondary rounded w-full"></div>
          <div className="h-4 bg-notion-bg-secondary rounded w-5/6"></div>
        </div>
      </div>
    </div>
  )
}