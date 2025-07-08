'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Page } from '@/../../shared/api-types'

interface SidebarProps {
  pages: Page[]
  onCreatePage: () => Promise<void>
  onDeletePage: (pageId: string) => Promise<void>
}

export default function Sidebar({ pages, onCreatePage, onDeletePage }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hoveredPageId, setHoveredPageId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-full bg-notion-bg-secondary border-r border-notion-border
        transition-all duration-200 z-10
        ${isCollapsed ? 'w-12' : 'w-64'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-notion-border">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <h2 className="font-semibold text-notion-text">My Workspace</h2>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-notion-bg-hover rounded transition-hover"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg 
                className="w-5 h-5 text-notion-text-secondary" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isCollapsed ? 'M13 5l7 7-7 7' : 'M11 19l-7-7 7-7'}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {!isCollapsed && (
            <>
              {/* Quick Actions */}
              <div className="mb-4">
                <button 
                  onClick={async () => {
                    if (!isCreating) {
                      setIsCreating(true)
                      try {
                        await onCreatePage()
                      } finally {
                        setIsCreating(false)
                      }
                    }
                  }}
                  disabled={isCreating}
                  className="w-full px-3 py-2 text-left text-sm text-notion-text-secondary hover:bg-notion-bg-hover rounded-md transition-hover flex items-center space-x-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{isCreating ? 'Creating...' : 'New Page'}</span>
                </button>
              </div>

              {/* Pages List */}
              <div>
                <h3 className="px-3 py-1 text-xs font-semibold text-notion-text-tertiary uppercase tracking-wider">
                  Pages
                </h3>
                <ul className="space-y-1 mt-2">
                  {pages.map((page) => {
                    const isActive = pathname === `/pages/${page.id}`
                    const isHovered = hoveredPageId === page.id
                    return (
                      <li 
                        key={page.id}
                        onMouseEnter={() => setHoveredPageId(page.id)}
                        onMouseLeave={() => setHoveredPageId(null)}
                      >
                        <div className="relative group">
                          <Link
                            href={`/pages/${page.id}`}
                            className={`
                              flex items-center space-x-2 px-3 py-1.5 rounded-md transition-hover
                              ${isActive 
                                ? 'bg-notion-bg-hover text-notion-text' 
                                : 'text-notion-text-secondary hover:bg-notion-bg-hover'
                              }
                            `}
                          >
                            <span className="text-lg">{page.icon || '📄'}</span>
                            <span className="text-sm truncate flex-1">{page.title}</span>
                          </Link>
                          {isHovered && (
                            <button
                              onClick={async (e) => {
                                e.preventDefault()
                                if (confirm(`Delete "${page.title}"?`)) {
                                  await onDeletePage(page.id)
                                  if (pathname === `/pages/${page.id}`) {
                                    router.push('/')
                                  }
                                }
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete page"
                            >
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </>
          )}

          {/* Collapsed View */}
          {isCollapsed && (
            <ul className="space-y-2">
              {pages.map((page) => {
                const isActive = pathname === `/pages/${page.id}`
                return (
                  <li key={page.id}>
                    <Link
                      href={`/pages/${page.id}`}
                      className={`
                        flex items-center justify-center p-2 rounded-md transition-hover
                        ${isActive 
                          ? 'bg-notion-bg-hover' 
                          : 'hover:bg-notion-bg-hover'
                        }
                      `}
                      title={page.title}
                    >
                      <span className="text-xl">{page.icon || '📄'}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </nav>
      </div>
    </aside>
  )
}