'use client'

import { useState } from 'react'
import { BlockType } from '@/../../shared/api-types'
import { BLOCK_CONFIGS } from '@/lib/types'

interface TurnIntoMenuProps {
  currentType: BlockType
  onSelect: (type: BlockType) => void
  onClose: () => void
}

const CONVERTIBLE_TYPES: BlockType[] = [
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'todo',
  'bullet_list',
  'numbered_list',
  'quote',
]

export default function TurnIntoMenu({
  currentType,
  onSelect,
  onClose,
}: TurnIntoMenuProps) {
  const [selectedType, setSelectedType] = useState<BlockType | null>(null)

  const handleSelect = (type: BlockType) => {
    if (type !== currentType) {
      onSelect(type)
    }
    onClose()
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-notion-border py-2 w-56">
      <div className="px-3 py-2 text-xs font-semibold text-notion-text-tertiary uppercase tracking-wider">
        Turn into
      </div>
      {CONVERTIBLE_TYPES.map((type) => {
        const config = BLOCK_CONFIGS[type]
        const isCurrentType = type === currentType
        
        return (
          <button
            key={type}
            onClick={() => handleSelect(type)}
            onMouseEnter={() => setSelectedType(type)}
            className={`
              w-full px-3 py-2 flex items-center space-x-3 text-left
              transition-colors
              ${isCurrentType 
                ? 'text-notion-text-tertiary cursor-default' 
                : 'hover:bg-notion-bg-hover'
              }
              ${selectedType === type && !isCurrentType ? 'bg-notion-bg-hover' : ''}
            `}
            disabled={isCurrentType}
          >
            <span className="w-8 text-center text-lg">{config.icon}</span>
            <span className="flex-1 text-sm">{config.label}</span>
            {isCurrentType && (
              <span className="text-xs text-notion-text-tertiary">✓</span>
            )}
          </button>
        )
      })}
    </div>
  )
}