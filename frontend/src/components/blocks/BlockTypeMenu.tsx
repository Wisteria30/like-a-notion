'use client'

import { useState, useRef, useEffect } from 'react'
import { BlockType } from '@/../../shared/api-types'
import { BLOCK_CONFIGS } from '@/lib/types'

interface BlockTypeMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: BlockType) => void
  position?: { top: number; left: number }
}

const BASIC_BLOCKS: BlockType[] = [
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'todo',
  'bullet_list',
  'numbered_list',
  'quote',
  'code',
]

export default function BlockTypeMenu({
  isOpen,
  onClose,
  onSelect,
  position,
}: BlockTypeMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < BASIC_BLOCKS.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : BASIC_BLOCKS.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          onSelect(BASIC_BLOCKS[selectedIndex])
          onClose()
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, selectedIndex, onSelect, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-white rounded-lg shadow-lg border border-notion-border py-2 w-64"
      style={position}
    >
      <div className="px-3 py-2 text-xs font-semibold text-notion-text-tertiary uppercase tracking-wider">
        Basic Blocks
      </div>
      {BASIC_BLOCKS.map((type, index) => {
        const config = BLOCK_CONFIGS[type]
        return (
          <button
            key={type}
            onClick={() => {
              onSelect(type)
              onClose()
            }}
            className={`
              w-full px-3 py-2 flex items-center space-x-3 text-left
              transition-colors
              ${
                index === selectedIndex
                  ? 'bg-notion-bg-hover'
                  : 'hover:bg-notion-bg-hover'
              }
            `}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className="w-8 text-center text-lg">{config.icon}</span>
            <div className="flex-1">
              <div className="font-medium text-sm">{config.label}</div>
              {config.shortcut && (
                <div className="text-xs text-notion-text-tertiary">
                  Type /{config.shortcut}
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}