'use client'

import { useState, useCallback, KeyboardEvent } from 'react'
import { Block, Page, BlockType } from '@/../../shared/api-types'
import { createBlock, convertBlockType } from '@/lib/blocks'
import BlockRenderer from '../blocks/BlockRenderer'

interface BlockEditorProps {
  page: Page
  blocks: Block[]
  onBlocksChange: (blocks: Block[]) => void
}

export default function BlockEditor({ page, blocks, onBlocksChange }: BlockEditorProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null)

  // ブロックテキスト更新
  const handleBlockUpdate = useCallback((id: string, text: string) => {
    const updatedBlocks = blocks.map(block =>
      block.id === id
        ? { ...block, properties: { ...block.properties, text }, updatedAt: new Date() }
        : block
    )
    onBlocksChange(updatedBlocks)
  }, [blocks, onBlocksChange])

  // ブロック全体の更新（チェックボックスなど）
  const handleBlockUpdateFull = useCallback((updatedBlock: Block) => {
    const updatedBlocks = blocks.map(block =>
      block.id === updatedBlock.id ? updatedBlock : block
    )
    onBlocksChange(updatedBlocks)
  }, [blocks, onBlocksChange])

  // ブロック削除
  const handleBlockDelete = useCallback((id: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== id)
    onBlocksChange(updatedBlocks)
    
    // 削除後、前のブロックを選択
    const index = blocks.findIndex(b => b.id === id)
    if (index > 0) {
      setSelectedBlockId(blocks[index - 1].id)
    }
  }, [blocks, onBlocksChange])

  // 新しいブロックを追加
  const addNewBlock = useCallback((afterId: string | null = null, type = 'paragraph' as const) => {
    const sortIndex = afterId 
      ? blocks.find(b => b.id === afterId)?.sortIndex || 0 + 1
      : blocks.length
    const newBlock = createBlock(type, page.id, null, {}, sortIndex)
    
    if (afterId === null) {
      // 最後に追加
      onBlocksChange([...blocks, newBlock])
    } else {
      // 指定されたブロックの後に追加
      const index = blocks.findIndex(b => b.id === afterId)
      const updatedBlocks = [
        ...blocks.slice(0, index + 1),
        newBlock,
        ...blocks.slice(index + 1)
      ]
      // sortIndexを更新
      updatedBlocks.forEach((block, idx) => {
        block.sortIndex = idx
      })
      onBlocksChange(updatedBlocks)
    }
    
    // 新しいブロックを選択
    setSelectedBlockId(newBlock.id)
    return newBlock
  }, [blocks, onBlocksChange, page.id])

  // キーボードイベントハンドラ
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>, blockId: string) => {
    const block = blocks.find(b => b.id === blockId)
    if (!block) return

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        // 現在のブロックの後に新しいブロックを追加
        addNewBlock(blockId)
        break

      case 'Backspace':
        if (block.properties.text === '') {
          e.preventDefault()
          handleBlockDelete(blockId)
        }
        break

      case 'Tab':
        e.preventDefault()
        // TODO: インデント処理（階層構造）の実装
        break

      case '/':
        // TODO: Show block menu
        break
    }
  }, [blocks, addNewBlock, handleBlockDelete])

  // ドラッグ&ドロップハンドラ
  const handleDragStart = (e: React.DragEvent, block: Block) => {
    setDraggedBlock(block)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedBlock(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetBlock: Block) => {
    e.preventDefault()
    if (!draggedBlock || draggedBlock.id === targetBlock.id) return

    const draggedIndex = blocks.findIndex(b => b.id === draggedBlock.id)
    const targetIndex = blocks.findIndex(b => b.id === targetBlock.id)

    const newBlocks = [...blocks]
    newBlocks.splice(draggedIndex, 1)
    newBlocks.splice(targetIndex, 0, draggedBlock)

    onBlocksChange(newBlocks)
    setDraggedBlock(null)
  }

  // Turn into機能
  const handleTurnInto = (blockId: string, newType: BlockType) => {
    const block = blocks.find(b => b.id === blockId)
    if (!block) return
    
    const convertedBlock = convertBlockType(block, newType)
    const updatedBlocks = blocks.map(b =>
      b.id === blockId ? convertedBlock : b
    )
    onBlocksChange(updatedBlocks)
  }

  return (
    <div className="min-h-[500px] pb-32">
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          isSelected={selectedBlockId === block.id}
          onUpdate={handleBlockUpdate}
          onUpdateBlock={handleBlockUpdateFull}
          onKeyDown={handleKeyDown}
          onSelect={setSelectedBlockId}
          onDelete={handleBlockDelete}
          onTurnInto={handleTurnInto}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ))}

      {/* 空のページの場合 */}
      {blocks.length === 0 && (
        <div
          className="text-notion-text-tertiary cursor-text px-2 py-1"
          onClick={() => addNewBlock()}
        >
          Type &apos;/&apos; for commands
        </div>
      )}

      {/* Add new block button */}
      <div className="mt-4">
        <button
          onClick={() => addNewBlock(blocks[blocks.length - 1]?.id)}
          className="px-3 py-1 text-sm text-notion-text-tertiary hover:bg-notion-bg-hover rounded transition-hover"
        >
          + Add a block
        </button>
      </div>
    </div>
  )
}