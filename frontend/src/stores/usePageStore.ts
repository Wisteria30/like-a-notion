import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Page, Block } from '@/../../shared/api-types'
import { createBlock } from '@/lib/blocks'

interface PageStore {
  // State
  pages: Page[]
  blocks: Map<string, Block[]> // pageId -> blocks[]
  
  // Actions
  setPages: (pages: Page[]) => void
  addPage: (page: Page) => void
  updatePage: (pageId: string, updates: Partial<Page>) => void
  deletePage: (pageId: string) => void
  
  getPageBlocks: (pageId: string) => Block[]
  setPageBlocks: (pageId: string, blocks: Block[]) => void
  addBlock: (pageId: string, block: Block) => void
  updateBlock: (pageId: string, blockId: string, updates: Partial<Block>) => void
  deleteBlock: (pageId: string, blockId: string) => void
  
  // Mock data initialization
  initializeMockData: () => void
}

export const usePageStore = create<PageStore>()(
  persist(
    (set, get) => ({
      pages: [],
      blocks: new Map(),
      
      setPages: (pages) => set({ pages }),
      
      addPage: (page) => set((state) => ({
        pages: [...state.pages, page]
      })),
      
      updatePage: (pageId, updates) => set((state) => ({
        pages: state.pages.map(p => 
          p.id === pageId ? { ...p, ...updates, updatedAt: new Date() } : p
        )
      })),
      
      deletePage: (pageId) => set((state) => {
        const newBlocks = new Map(state.blocks)
        newBlocks.delete(pageId)
        return {
          pages: state.pages.filter(p => p.id !== pageId),
          blocks: newBlocks
        }
      }),
      
      getPageBlocks: (pageId) => {
        return get().blocks.get(pageId) || []
      },
      
      setPageBlocks: (pageId, blocks) => set((state) => {
        const newBlocks = new Map(state.blocks)
        newBlocks.set(pageId, blocks)
        return { blocks: newBlocks }
      }),
      
      addBlock: (pageId, block) => set((state) => {
        const newBlocks = new Map(state.blocks)
        const pageBlocks = newBlocks.get(pageId) || []
        newBlocks.set(pageId, [...pageBlocks, block])
        return { blocks: newBlocks }
      }),
      
      updateBlock: (pageId, blockId, updates) => set((state) => {
        const newBlocks = new Map(state.blocks)
        const pageBlocks = newBlocks.get(pageId) || []
        newBlocks.set(pageId, pageBlocks.map(b =>
          b.id === blockId ? { ...b, ...updates, updatedAt: new Date() } : b
        ))
        return { blocks: newBlocks }
      }),
      
      deleteBlock: (pageId, blockId) => set((state) => {
        const newBlocks = new Map(state.blocks)
        const pageBlocks = newBlocks.get(pageId) || []
        newBlocks.set(pageId, pageBlocks.filter(b => b.id !== blockId))
        return { blocks: newBlocks }
      }),
      
      initializeMockData: () => {
        const state = get()
        if (state.pages.length > 0) return // Already initialized
        
        const mockPages: Page[] = [
          {
            id: '1',
            parentPageId: null,
            title: 'Welcome to Like a Notion',
            icon: '👋',
            coverImage: null,
            isDatabase: false,
            sortIndex: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdById: 'user-1',
          },
          {
            id: '2',
            parentPageId: null,
            title: 'Getting Started',
            icon: '🚀',
            coverImage: null,
            isDatabase: false,
            sortIndex: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdById: 'user-1',
          },
          {
            id: '3',
            parentPageId: null,
            title: 'Task List',
            icon: '✅',
            coverImage: null,
            isDatabase: false,
            sortIndex: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdById: 'user-1',
          },
        ]
        
        const mockBlocks = new Map<string, Block[]>()
        
        // Page 1 blocks
        mockBlocks.set('1', [
          createBlock('paragraph', '1', null, {
            text: 'This is your first paragraph block. Click to edit.',
          }, 0),
          createBlock('paragraph', '1', null, {
            text: 'You can add and delete blocks. Press Enter to create new blocks.',
          }, 1),
        ])
        
        // Page 2 blocks
        mockBlocks.set('2', [
          createBlock('heading_1', '2', null, {
            text: 'Getting Started with Like a Notion',
          }, 0),
          createBlock('paragraph', '2', null, {
            text: 'Press Enter to create new blocks.',
          }, 1),
        ])
        
        // Page 3 blocks
        mockBlocks.set('3', [
          createBlock('todo', '3', null, {
            text: 'Complete the block editor',
            checked: true,
          }, 0),
          createBlock('todo', '3', null, {
            text: 'Add more block types',
            checked: false,
          }, 1),
        ])
        
        set({ pages: mockPages, blocks: mockBlocks })
      }
    }),
    {
      name: 'page-storage',
      partialize: (state) => ({ 
        pages: state.pages,
        blocks: Array.from(state.blocks.entries())
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.blocks)) {
          state.blocks = new Map(state.blocks)
        }
      }
    }
  )
)