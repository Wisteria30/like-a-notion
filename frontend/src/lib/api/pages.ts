import { Page, CreatePageRequest, UpdatePageRequest } from '@/../../shared/api-types'
import { apiClient } from './client'

export const pagesApi = {
  // Get all pages with optional counts
  async list(includeChildPages = false, includeBlocks = false): Promise<Page[]> {
    return apiClient.get<Page[]>('/pages', {
      includeChildPages,
      includeBlocks,
    })
  },

  // Get a single page by ID
  async get(id: string, includeChildPages = false, includeBlocks = false): Promise<Page> {
    return apiClient.get<Page>(`/pages/${id}`, {
      includeChildPages,
      includeBlocks,
    })
  },

  // Create a new page
  async create(data: CreatePageRequest): Promise<Page> {
    return apiClient.post<Page>('/pages', data)
  },

  // Update a page
  async update(id: string, data: UpdatePageRequest): Promise<Page> {
    return apiClient.put<Page>(`/pages/${id}`, data)
  },

  // Delete a page (soft delete)
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/pages/${id}`)
  },
}

// Export for convenience
export { type Page } from '@/../../shared/api-types'