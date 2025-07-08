'use client'

import { KeyboardEvent, useRef, useEffect } from 'react'
import { Block } from '@/../../shared/api-types'

interface ParagraphBlockProps {
  block: Block
  isSelected: boolean
  onUpdate: (id: string, text: string) => void
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>, blockId: string) => void
  onSelect: (id: string) => void
}

export default function ParagraphBlock({
  block,
  isSelected,
  onUpdate,
  onKeyDown,
  onSelect,
}: ParagraphBlockProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isSelected && contentRef.current) {
      contentRef.current.focus()
    }
  }, [isSelected])

  const handleInput = () => {
    if (contentRef.current) {
      const text = contentRef.current.textContent || ''
      onUpdate(block.id, text)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown(e, block.id)
  }

  const handleClick = () => {
    onSelect(block.id)
  }

  return (
    <div
      ref={contentRef}
      contentEditable
      suppressContentEditableWarning
      className={`
        block-content px-2 py-1 outline-none
        ${isSelected ? 'ring-1 ring-blue-400 ring-offset-1' : ''}
        ${!block.properties.text ? 'text-notion-text-tertiary' : ''}
      `}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      data-placeholder="Type '/' for commands"
      dangerouslySetInnerHTML={{
        __html: block.properties.text || ''
      }}
    />
  )
}