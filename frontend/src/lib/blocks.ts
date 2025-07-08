import { v4 as uuidv4 } from 'uuid'
import { Block, BlockType, BlockProperties } from '@/../../shared/api-types'
import { BlockTree } from './types'

// 新しいブロックを作成
export function createBlock(
  type: BlockType,
  pageId: string,
  parentBlockId: string | null = null,
  properties: Partial<BlockProperties> = {},
  sortIndex: number = 0
): Block {
  return {
    id: uuidv4(),
    pageId,
    parentBlockId,
    type,
    properties: {
      text: '',
      ...properties,
    },
    sortIndex,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: 'current-user', // TODO: 実際のユーザーIDを使用
    lastEditedById: 'current-user',
  }
}

// フラットなブロック配列をツリー構造に変換
export function buildBlockTree(blocks: Block[]): BlockTree[] {
  const blockMap = new Map<string, BlockTree>()
  const rootBlocks: BlockTree[] = []

  // まずBlockTreeオブジェクトを作成
  blocks.forEach(block => {
    blockMap.set(block.id, { ...block, children: [] })
  })

  // 親子関係を構築
  blocks.forEach(block => {
    const blockTree = blockMap.get(block.id)!
    
    if (block.parentBlockId && blockMap.has(block.parentBlockId)) {
      const parent = blockMap.get(block.parentBlockId)!
      parent.children.push(blockTree)
    } else {
      rootBlocks.push(blockTree)
    }
  })

  // sortIndexに従って子ブロックをソート
  blockMap.forEach(blockTree => {
    blockTree.children.sort((a, b) => a.sortIndex - b.sortIndex)
  })

  return rootBlocks
}

// ツリー構造をフラットな配列に変換
export function flattenBlockTree(trees: BlockTree[]): Block[] {
  const blocks: Block[] = []

  function traverse(tree: BlockTree) {
    const { children, ...block } = tree
    blocks.push(block)
    children.forEach(traverse)
  }

  trees.forEach(traverse)
  return blocks
}

// ブロックのインデントレベルを計算
export function calculateIndentLevel(block: Block, blocks: Map<string, Block>): number {
  let level = 0
  let currentId = block.parentBlockId

  while (currentId) {
    const parent = blocks.get(currentId)
    if (!parent) break
    level++
    currentId = parent.parentBlockId
  }

  return level
}

// ブロックタイプ変換時のプロパティ保持
export function convertBlockType(block: Block, newType: BlockType): Block {
  const newBlock = { ...block }
  newBlock.type = newType

  // タイプ変換時の特別な処理
  switch (newType) {
    case 'todo':
      if (!('checked' in newBlock.properties)) {
        newBlock.properties.checked = false
      }
      break
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
      // ヘッディングは子要素を持てない
      // childBlocksは削除しない（APIレスポンス用のため）
      break
    case 'code':
      if (!('language' in newBlock.properties)) {
        newBlock.properties.language = 'plaintext'
      }
      break
  }

  return newBlock
}

// ブロックが子要素を持てるかチェック
export function canHaveChildren(type: BlockType): boolean {
  const childlessTypes: BlockType[] = [
    'paragraph',
    'heading_1',
    'heading_2', 
    'heading_3',
    'quote',
    'code',
    'image',
  ]
  return !childlessTypes.includes(type)
}

// ブロックがインデント可能かチェック
export function canIndent(type: BlockType): boolean {
  const nonIndentableTypes: BlockType[] = [
    'heading_1',
    'heading_2',
    'heading_3',
    'page',
    'database',
  ]
  return !nonIndentableTypes.includes(type)
}