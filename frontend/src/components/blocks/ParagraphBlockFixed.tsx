'use client'

import { KeyboardEvent, useRef, useEffect, useState } from 'react'
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
  const [isComposing, setIsComposing] = useState(false)
  const lastTextRef = useRef(block.properties.text || '')

  useEffect(() => {
    if (isSelected && contentRef.current) {
      contentRef.current.focus()
    }
  }, [isSelected])

  // contentEditableの内容を初期化（初回のみ）
  useEffect(() => {
    if (contentRef.current && contentRef.current.textContent !== block.properties.text) {
      // カーソル位置を保持
      const selection = window.getSelection()
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null
      const startOffset = range?.startOffset || 0
      
      contentRef.current.textContent = block.properties.text || ''
      
      // カーソル位置を復元
      if (range && selection) {
        try {
          const newRange = document.createRange()
          const textNode = contentRef.current.firstChild || contentRef.current
          newRange.setStart(textNode, Math.min(startOffset, textNode.textContent?.length || 0))
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        } catch {
          // カーソル位置の復元に失敗した場合は無視
        }
      }
    }
  }, [block.properties.text])

  const handleInput = () => {
    if (contentRef.current && !isComposing) {
      const text = contentRef.current.textContent || ''
      // 同じ内容の場合は更新しない（無限ループ防止）
      if (text !== lastTextRef.current) {
        lastTextRef.current = text
        onUpdate(block.id, text)
      }
    }
  }

  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = () => {
    setIsComposing(false)
    // 変換確定時に更新
    if (contentRef.current) {
      const text = contentRef.current.textContent || ''
      lastTextRef.current = text
      onUpdate(block.id, text)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // IME変換中はEnterキーなどの処理をスキップ
    if (!isComposing) {
      onKeyDown(e, block.id)
    }
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
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      data-placeholder="Type '/' for commands"
    />
  )
}