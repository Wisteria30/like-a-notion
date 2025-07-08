'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import BlockEditor from '@/components/editor/BlockEditor'
import { usePageStore } from '@/stores/usePageStore'
import { usePageApi } from '@/hooks/usePageApi'
import { useToast } from '@/hooks/useToast'
import { Block, Page } from '@/../../shared/api-types'

export default function PageDetail() {
  const params = useParams()
  const router = useRouter()
  const pageId = params.id as string
  const { pages, getPageBlocks, updatePage, setPageBlocks } = usePageStore()
  const { fetchPage, fetchBlocks, savePage, saveBlocks } = usePageApi()
  const { showToast, ToastContainer } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState<Page | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])

  // Load page and blocks from API
  useEffect(() => {
    const loadPageData = async () => {
      try {
        setIsLoading(true)
        
        // Try to get from store first
        let pageData = pages.find(p => p.id === pageId)
        let blocksData = getPageBlocks(pageId)
        
        // If not in store, fetch from API
        if (!pageData) {
          pageData = await fetchPage(pageId)
          updatePage(pageId, pageData)
        }
        
        if (blocksData.length === 0) {
          blocksData = await fetchBlocks(pageId)
          setPageBlocks(pageId, blocksData)
        }
        
        setPage(pageData)
        setBlocks(blocksData)
      } catch (error) {
        console.error('Failed to load page:', error)
        showToast('Failed to load page', 'error')
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    loadPageData()
  }, [pageId, pages, getPageBlocks, fetchPage, fetchBlocks, updatePage, setPageBlocks, router, showToast])

  const handlePageTitleChange = async (newTitle: string) => {
    if (page) {
      try {
        const updatedPage = { ...page, title: newTitle }
        setPage(updatedPage)
        updatePage(pageId, { title: newTitle })
        
        // Save to API with debouncing effect handled by store
        await savePage(updatedPage)
      } catch (error) {
        console.error('Failed to save page title:', error)
        showToast('Failed to save page title', 'error')
      }
    }
  }

  const handleBlocksChange = async (newBlocks: Block[]) => {
    try {
      setBlocks(newBlocks)
      setPageBlocks(pageId, newBlocks)
      
      // Save to API with debouncing effect handled by store
      await saveBlocks(pageId, newBlocks)
    } catch (error) {
      console.error('Failed to save blocks:', error)
      showToast('Failed to save blocks', 'error')
    }
  }

  if (isLoading || !page) {
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

  return (
    <div className="page-container">
      <header className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <span className="text-5xl">{page.icon || '📄'}</span>
          <input
            type="text"
            value={page.title}
            onChange={(e) => handlePageTitleChange(e.target.value)}
            className="text-page-title font-bold flex-1 outline-none bg-transparent"
            placeholder="Untitled"
          />
        </div>
      </header>

      <main>
        <BlockEditor
          page={page}
          blocks={blocks}
          onBlocksChange={handleBlocksChange}
        />
      </main>
      <ToastContainer />
    </div>
  )
}