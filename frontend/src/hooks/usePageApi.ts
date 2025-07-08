import { useCallback } from 'react'
import { Page, Block, UpdatePageRequest } from '@/../../shared/api-types'
import { mockAPI } from '@/lib/api-mock'
import { usePageStore } from '@/stores/usePageStore'
import { apiClient, pagesApi, blocksApi } from '@/lib/api'

// APIとZustand storeを橋渡しするカスタムフック
export function usePageApi() {
  const store = usePageStore()
  const useMockApi = apiClient.isMockMode

  // ページ保存
  const savePage = useCallback(async (page: Page) => {
    try {
      if (useMockApi) {
        const response = await mockAPI.updatePage(page.id, page)
        if (response.success) {
          store.updatePage(page.id, page)
          return response
        }
        throw new Error(response.error || 'Failed to save page')
      } else {
        const updateData: UpdatePageRequest = {
          title: page.title,
          icon: page.icon || undefined,
          coverImage: page.coverImage || undefined,
        }
        const updatedPage = await pagesApi.update(page.id, updateData)
        store.updatePage(page.id, updatedPage)
        return { success: true, data: updatedPage }
      }
    } catch (error) {
      console.error('Failed to save page:', error)
      throw error
    }
  }, [store, useMockApi])

  // ブロック保存
  const saveBlocks = useCallback(async (pageId: string, blocks: Block[]) => {
    try {
      if (useMockApi) {
        const response = await mockAPI.updateBlocks(pageId, blocks)
        if (response.success) {
          store.setPageBlocks(pageId, blocks)
          return response
        }
        throw new Error(response.error || 'Failed to save blocks')
      } else {
        // 実APIの場合は差分更新を行う
        // TODO: より効率的な差分更新の実装
        store.setPageBlocks(pageId, blocks)
        return { success: true, data: blocks }
      }
    } catch (error) {
      console.error('Failed to save blocks:', error)
      throw error
    }
  }, [store, useMockApi])

  // ページ取得
  const fetchPage = useCallback(async (pageId: string) => {
    try {
      if (useMockApi) {
        const response = await mockAPI.getPage(pageId)
        if (response.success && response.data) {
          return response.data
        }
        throw new Error(response.error || 'Failed to fetch page')
      } else {
        return await pagesApi.get(pageId)
      }
    } catch (error) {
      console.error('Failed to fetch page:', error)
      throw error
    }
  }, [useMockApi])

  // ブロック取得
  const fetchBlocks = useCallback(async (pageId: string) => {
    try {
      if (useMockApi) {
        const response = await mockAPI.getPageBlocks(pageId)
        if (response.success && response.data) {
          return response.data
        }
        throw new Error(response.error || 'Failed to fetch blocks')
      } else {
        return await blocksApi.list(pageId)
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error)
      throw error
    }
  }, [useMockApi])

  // ページ一覧取得
  const fetchPages = useCallback(async () => {
    try {
      if (useMockApi) {
        const response = await mockAPI.getPages()
        if (response.success && response.data) {
          return response.data
        }
        throw new Error(response.error || 'Failed to fetch pages')
      } else {
        return await pagesApi.list(true, false)
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error)
      throw error
    }
  }, [useMockApi])

  // ページ作成
  const createPage = useCallback(async (title: string, parentPageId?: string) => {
    try {
      if (useMockApi) {
        const newPage: Page = {
          id: `page-${Date.now()}`,
          parentPageId: parentPageId || null,
          title,
          icon: '📄',
          coverImage: null,
          isDatabase: false,
          sortIndex: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdById: 'user-1',
        }
        store.addPage(newPage)
        return newPage
      } else {
        const newPage = await pagesApi.create({
          title,
          parentPageId,
        })
        store.addPage(newPage)
        return newPage
      }
    } catch (error) {
      console.error('Failed to create page:', error)
      throw error
    }
  }, [store, useMockApi])

  // ページ削除
  const deletePage = useCallback(async (pageId: string) => {
    try {
      if (useMockApi) {
        store.deletePage(pageId)
      } else {
        await pagesApi.delete(pageId)
        store.deletePage(pageId)
      }
    } catch (error) {
      console.error('Failed to delete page:', error)
      throw error
    }
  }, [store, useMockApi])

  return {
    savePage,
    saveBlocks,
    fetchPage,
    fetchBlocks,
    fetchPages,
    createPage,
    deletePage,
  }
}