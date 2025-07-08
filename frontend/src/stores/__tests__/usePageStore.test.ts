import { act, renderHook } from '@testing-library/react'
import { usePageStore } from '../usePageStore'
import { Page, Block } from '@/../../shared/api-types'

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}))

describe('usePageStore', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    // Clear store before each test
    const { result } = renderHook(() => usePageStore())
    act(() => {
      result.current.setPages([])
      result.current.blocks.clear()
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('page operations', () => {
    it('should add a page', () => {
      const { result } = renderHook(() => usePageStore())
      
      const newPage: Page = {
        id: 'test-page',
        parentPageId: null,
        title: 'Test Page',
        icon: '📄',
        coverImage: null,
        isDatabase: false,
        sortIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'user-1',
      }
      
      act(() => {
        result.current.addPage(newPage)
      })
      
      expect(result.current.pages).toHaveLength(1)
      expect(result.current.pages[0]).toEqual(newPage)
    })

    it('should update a page', () => {
      const { result } = renderHook(() => usePageStore())
      
      const page: Page = {
        id: 'test-page',
        parentPageId: null,
        title: 'Original Title',
        icon: '📄',
        coverImage: null,
        isDatabase: false,
        sortIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'user-1',
      }
      
      act(() => {
        result.current.setPages([page])
      })
      
      // Wait a bit to ensure different timestamp
      jest.advanceTimersByTime(1)
      
      act(() => {
        result.current.updatePage('test-page', { title: 'Updated Title' })
      })
      
      expect(result.current.pages[0].title).toBe('Updated Title')
      // updatedAt should be updated
      expect(result.current.pages[0].updatedAt).not.toBe(page.updatedAt)
    })

    it('should delete a page and its blocks', () => {
      const { result } = renderHook(() => usePageStore())
      
      act(() => {
        result.current.setPages([{
          id: 'page-1',
          title: 'Page 1',
        } as Page])
        
        result.current.setPageBlocks('page-1', [
          { id: 'block-1', pageId: 'page-1' } as Block
        ])
        
        result.current.deletePage('page-1')
      })
      
      expect(result.current.pages).toHaveLength(0)
      expect(result.current.getPageBlocks('page-1')).toHaveLength(0)
    })
  })

  describe('block operations', () => {
    it('should get blocks for a page', () => {
      const { result } = renderHook(() => usePageStore())
      
      const blocks: Block[] = [
        { id: 'block-1', pageId: 'page-1', type: 'paragraph' } as Block,
        { id: 'block-2', pageId: 'page-1', type: 'paragraph' } as Block,
      ]
      
      act(() => {
        result.current.setPageBlocks('page-1', blocks)
      })
      
      expect(result.current.getPageBlocks('page-1')).toEqual(blocks)
      expect(result.current.getPageBlocks('page-2')).toEqual([])
    })

    it('should add a block to a page', () => {
      const { result } = renderHook(() => usePageStore())
      
      const block: Block = {
        id: 'block-1',
        pageId: 'page-1',
        parentBlockId: null,
        type: 'paragraph',
        properties: { text: 'Test' },
        sortIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'user-1',
        lastEditedById: 'user-1',
      }
      
      act(() => {
        result.current.addBlock('page-1', block)
      })
      
      expect(result.current.getPageBlocks('page-1')).toHaveLength(1)
      expect(result.current.getPageBlocks('page-1')[0]).toEqual(block)
    })

    it('should update a block', () => {
      const { result } = renderHook(() => usePageStore())
      
      const block: Block = {
        id: 'block-1',
        pageId: 'page-1',
        properties: { text: 'Original' },
      } as Block
      
      act(() => {
        result.current.setPageBlocks('page-1', [block])
        result.current.updateBlock('page-1', 'block-1', {
          properties: { text: 'Updated' }
        })
      })
      
      const updatedBlock = result.current.getPageBlocks('page-1')[0]
      expect(updatedBlock.properties.text).toBe('Updated')
      // updatedAt should be updated
      expect(updatedBlock.updatedAt).toBeDefined()
    })

    it('should delete a block', () => {
      const { result } = renderHook(() => usePageStore())
      
      act(() => {
        result.current.setPageBlocks('page-1', [
          { id: 'block-1', pageId: 'page-1' } as Block,
          { id: 'block-2', pageId: 'page-1' } as Block,
        ])
        
        result.current.deleteBlock('page-1', 'block-1')
      })
      
      expect(result.current.getPageBlocks('page-1')).toHaveLength(1)
      expect(result.current.getPageBlocks('page-1')[0].id).toBe('block-2')
    })
  })

  describe('mock data initialization', () => {
    it('should initialize mock data only once', () => {
      const { result } = renderHook(() => usePageStore())
      
      act(() => {
        result.current.initializeMockData()
      })
      
      const initialPageCount = result.current.pages.length
      expect(initialPageCount).toBeGreaterThan(0)
      
      // Call again
      act(() => {
        result.current.initializeMockData()
      })
      
      // Should not duplicate
      expect(result.current.pages).toHaveLength(initialPageCount)
    })

    it('should create pages with blocks', () => {
      const { result } = renderHook(() => usePageStore())
      
      act(() => {
        result.current.initializeMockData()
      })
      
      // Check that each page has blocks
      result.current.pages.forEach(page => {
        const blocks = result.current.getPageBlocks(page.id)
        expect(blocks.length).toBeGreaterThan(0)
      })
    })
  })
})