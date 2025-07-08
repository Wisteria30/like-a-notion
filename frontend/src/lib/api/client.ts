import axios, { AxiosInstance, AxiosError } from 'axios'
import { ApiResponse } from '@/../../shared/api-types'

class ApiClient {
  private client: AxiosInstance
  private useMockApi: boolean

  constructor() {
    this.useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true'
    
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      this.handleError
    )
  }

  private handleError = (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.data?.error) {
      const errorMessage = error.response.data.error
      console.error(`API Error: ${errorMessage}`)
      
      // Create a new error with the API error message
      const enhancedError = new Error(errorMessage) as Error & { originalError?: AxiosError }
      enhancedError.originalError = error
      
      return Promise.reject(enhancedError)
    }
    
    // Network error or other issues
    const networkError = new Error(
      error.message || 'An unexpected error occurred'
    ) as Error & { originalError?: AxiosError }
    networkError.originalError = error
    
    return Promise.reject(networkError)
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, { params })
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data!
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data)
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data!
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data)
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data!
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url)
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data!
  }

  // Check if we should use mock API
  get isMockMode(): boolean {
    return this.useMockApi
  }
}

// Export singleton instance
export const apiClient = new ApiClient()