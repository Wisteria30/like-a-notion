'use client'

import { ReactNode, useState } from 'react'
import { Block, BlockType } from '@/../../shared/api-types'
import { BLOCK_CONFIGS } from '@/lib/types'
import TurnIntoMenu from './TurnIntoMenu'

interface BlockWrapperProps {
  block: Block
  children: ReactNode
  onDragStart?: (e: React.DragEvent, block: Block) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, block: Block) => void
  onDelete?: (id: string) => void
  onTurnInto?: (id: string, newType: BlockType) => void
}

export default function BlockWrapper({
  block,
  children,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDelete,
  onTurnInto,
}: BlockWrapperProps) {
  const [showMenu, setShowMenu] = useState(false)
  const config = BLOCK_CONFIGS[block.type]

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, block)
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (onDragEnd) {
      onDragEnd(e)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (onDragOver) {
      onDragOver(e)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (onDrop) {
      onDrop(e, block)
    }
  }

  return (
    <div
      className="group relative"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ paddingLeft: `${0}px` }}
    >
      {/* Drag Handle */}
      <div className="absolute left-0 -ml-12 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
        <button
          className="p-1 hover:bg-notion-bg-hover rounded cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => e.preventDefault()}
        >
          <svg className="w-5 h-5 text-notion-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {/* Block Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-notion-bg-hover rounded"
          >
            <svg className="w-4 h-4 text-notion-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute top-full left-0 mt-1 z-20">
              <TurnIntoMenu
                currentType={block.type}
                onSelect={(newType) => {
                  if (onTurnInto) onTurnInto(block.id, newType)
                  setShowMenu(false)
                }}
                onClose={() => setShowMenu(false)}
              />
              <button
                onClick={() => {
                  if (onDelete) onDelete(block.id)
                  setShowMenu(false)
                }}
                className="mt-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-hover bg-white rounded-lg shadow-lg border border-notion-border"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Block Type Icon */}
      <div className="absolute -ml-6 mt-1 text-notion-text-tertiary text-sm">
        {config.icon}
      </div>

      {/* Block Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  )
}