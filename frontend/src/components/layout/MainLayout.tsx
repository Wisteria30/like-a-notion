'use client'

import { ReactNode, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../sidebar/Sidebar'
import { usePageStore } from '@/stores/usePageStore'
import { usePageApi } from '@/hooks/usePageApi'
import { useToast } from '@/hooks/useToast'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter()
  const { pages, setPages, initializeMockData } = usePageStore()
  const { fetchPages, createPage, deletePage } = usePageApi()
  const { showToast, ToastContainer } = useToast()
  const [isLoading, setIsLoading] = useState(true)

  // Load pages from API
  useEffect(() => {
    const loadPages = async () => {
      try {
        const apiPages = await fetchPages()
        setPages(apiPages)
      } catch (error) {
        console.error('Failed to load pages:', error)
        // Fall back to mock data if API fails
        initializeMockData()
      } finally {
        setIsLoading(false)
      }
    }

    loadPages()
  }, [fetchPages, setPages, initializeMockData])

  // Handle page creation
  const handleCreatePage = useCallback(async () => {
    try {
      const newPage = await createPage('Untitled')
      showToast('Page created successfully', 'success')
      router.push(`/pages/${newPage.id}`)
    } catch (error) {
      console.error('Failed to create page:', error)
      showToast('Failed to create page. Please try again.', 'error')
    }
  }, [createPage, router, showToast])

  // Handle page deletion
  const handleDeletePage = useCallback(async (pageId: string) => {
    try {
      await deletePage(pageId)
      showToast('Page deleted successfully', 'success')
    } catch (error) {
      console.error('Failed to delete page:', error)
      showToast('Failed to delete page. Please try again.', 'error')
    }
  }, [deletePage, showToast])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-notion-bg flex items-center justify-center">
        <div className="text-notion-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-notion-bg">
      <Sidebar 
        pages={pages} 
        onCreatePage={handleCreatePage}
        onDeletePage={handleDeletePage}
      />
      <main className="ml-64 transition-all duration-200">
        {children}
      </main>
      <ToastContainer />
    </div>
  )
}