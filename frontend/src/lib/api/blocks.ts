import { Block, CreateBlockRequest, UpdateBlockRequest } from '@/../../shared/api-types'
import { apiClient } from './client'

export const blocksApi = {
  // Get all blocks for a page
  async list(pageId: string): Promise<Block[]> {
    return apiClient.get<Block[]>(`/pages/${pageId}/blocks`)
  },

  // Create a new block
  async create(pageId: string, data: Omit<CreateBlockRequest, 'pageId'>): Promise<Block> {
    return apiClient.post<Block>(`/blocks`, { ...data, pageId })
  },

  // Update a block
  async update(id: string, data: UpdateBlockRequest): Promise<Block> {
    return apiClient.put<Block>(`/blocks/${id}`, data)
  },

  // Delete a block
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/blocks/${id}`)
  },
}

// Export for convenience
export { type Block } from '@/../../shared/api-types'