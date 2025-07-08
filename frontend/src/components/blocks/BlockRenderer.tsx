'use client'

import { KeyboardEvent } from 'react'
import { Block, BlockType } from '@/../../shared/api-types'
import ParagraphBlock from './ParagraphBlockFixed'
import BlockWrapper from './BlockWrapper'

interface BlockRendererProps {
  block: Block
  isSelected: boolean
  onUpdate: (id: string, text: string) => void
  onUpdateBlock: (block: Block) => void
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>, blockId: string) => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onTurnInto: (id: string, newType: BlockType) => void
  onDragStart: (e: React.DragEvent, block: Block) => void
  onDragEnd: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, block: Block) => void
}

export default function BlockRenderer({
  block,
  isSelected,
  onUpdate,
  onUpdateBlock,
  onKeyDown,
  onSelect,
  onDelete,
  onTurnInto,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: BlockRendererProps) {
  const renderBlockContent = () => {
    switch (block.type) {
      case 'paragraph':
        return (
          <ParagraphBlock
            block={block}
            isSelected={isSelected}
            onUpdate={onUpdate}
            onKeyDown={onKeyDown}
            onSelect={onSelect}
          />
        )
      
      case 'heading_1':
        return (
          <h1 className="text-h1 font-bold">
            {block.properties.text || 'Heading 1'}
          </h1>
        )
      
      case 'heading_2':
        return (
          <h2 className="text-h2 font-semibold">
            {block.properties.text || 'Heading 2'}
          </h2>
        )
      
      case 'heading_3':
        return (
          <h3 className="text-h3 font-medium">
            {block.properties.text || 'Heading 3'}
          </h3>
        )
      
      case 'todo':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={block.properties.checked || false}
              onChange={(e) => {
                const updatedBlock = {
                  ...block,
                  properties: { ...block.properties, checked: e.target.checked }
                }
                onUpdateBlock(updatedBlock)
              }}
              className="w-4 h-4 rounded border-notion-border"
            />
            <div className="flex-1">
              <ParagraphBlock
                block={block}
                isSelected={isSelected}
                onUpdate={onUpdate}
                onKeyDown={onKeyDown}
                onSelect={onSelect}
              />
            </div>
          </div>
        )
      
      default:
        return (
          <div className="text-notion-text-secondary">
            Unsupported block type: {block.type}
          </div>
        )
    }
  }

  return (
    <BlockWrapper
      block={block}
      onDelete={onDelete}
      onTurnInto={onTurnInto}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {renderBlockContent()}
    </BlockWrapper>
  )
}