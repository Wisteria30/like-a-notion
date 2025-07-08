import { Page, Block, ApiResponse } from '@/../../shared/api-types'

// 遅延シミュレーション
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// モックAPIクラス
class MockAPI {
  // ページ取得
  async getPage(pageId: string): Promise<ApiResponse<Page>> {
    await delay(100)
    
    // usePageStoreから取得する代わりに、ここではダミーを返す
    // 実際の実装では、Zustand storeと連携
    return {
      success: true,
      data: {
        id: pageId,
        parentPageId: null,
        title: 'Mock Page',
        icon: '📄',
        coverImage: null,
        isDatabase: false,
        sortIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'user-1',
      }
    }
  }
  
  // ページ一覧取得
  async getPages(): Promise<ApiResponse<Page[]>> {
    await delay(100)
    return { success: true, data: [] }
  }
  
  // ページ作成
  async createPage(page: Partial<Page>): Promise<ApiResponse<Page>> {
    await delay(200)
    const newPage: Page = {
      id: Math.random().toString(36).substr(2, 9),
      parentPageId: null,
      title: page.title || 'Untitled',
      icon: page.icon || null,
      coverImage: null,
      isDatabase: false,
      sortIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: 'user-1',
      ...page
    }
    return { success: true, data: newPage }
  }
  
  // ページ更新
  async updatePage(pageId: string, updates: Partial<Page>): Promise<ApiResponse<Page>> {
    await delay(100)
    return {
      success: true,
      data: {
        id: pageId,
        ...updates,
        updatedAt: new Date()
      } as Page
    }
  }
  
  // ページ削除
  async deletePage(_pageId: string): Promise<ApiResponse<void>> {
    await delay(100)
    return { success: true }
  }
  
  // ブロック一覧取得
  async getPageBlocks(_pageId: string): Promise<ApiResponse<Block[]>> {
    await delay(100)
    return { success: true, data: [] }
  }
  
  // ブロック作成
  async createBlock(block: Partial<Block>): Promise<ApiResponse<Block>> {
    await delay(100)
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      pageId: block.pageId || '',
      parentBlockId: null,
      type: 'paragraph',
      properties: {},
      sortIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: 'user-1',
      lastEditedById: 'user-1',
      ...block
    }
    return { success: true, data: newBlock }
  }
  
  // ブロック更新
  async updateBlock(blockId: string, updates: Partial<Block>): Promise<ApiResponse<Block>> {
    await delay(50)
    return {
      success: true,
      data: {
        id: blockId,
        ...updates,
        updatedAt: new Date(),
        lastEditedById: 'user-1'
      } as Block
    }
  }
  
  // ブロック削除
  async deleteBlock(_blockId: string): Promise<ApiResponse<void>> {
    await delay(50)
    return { success: true }
  }
  
  // ブロック一括更新（トランザクション）
  async updateBlocks(_pageId: string, blocks: Block[]): Promise<ApiResponse<Block[]>> {
    await delay(100)
    return {
      success: true,
      data: blocks.map(b => ({
        ...b,
        updatedAt: new Date(),
        lastEditedById: 'user-1'
      }))
    }
  }
}

// シングルトンインスタンス
export const mockAPI = new MockAPI()