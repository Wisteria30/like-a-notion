import { Block, BlockType } from '@/../../shared/api-types'

// ブロックツリー構造（UIレンダリング用）
export interface BlockTree extends Block {
  children: BlockTree[]
}

// エディタの選択状態
export interface EditorSelection {
  blockId: string
  offset: number
  length: number
}

// ブロックレンダリング設定
export interface BlockConfig {
  type: BlockType
  icon: string
  label: string
  shortcut?: string
  placeholder: string
  canHaveChildren: boolean
  canIndent: boolean
}

// ブロック設定マップ
export const BLOCK_CONFIGS: Record<BlockType, BlockConfig> = {
  paragraph: {
    type: 'paragraph',
    icon: '¶',
    label: 'Text',
    shortcut: 'text',
    placeholder: "Type '/' for commands",
    canHaveChildren: false,
    canIndent: true,
  },
  heading_1: {
    type: 'heading_1',
    icon: 'H1',
    label: 'Heading 1',
    shortcut: 'h1',
    placeholder: 'Heading 1',
    canHaveChildren: false,
    canIndent: false,
  },
  heading_2: {
    type: 'heading_2',
    icon: 'H2',
    label: 'Heading 2',
    shortcut: 'h2',
    placeholder: 'Heading 2',
    canHaveChildren: false,
    canIndent: false,
  },
  heading_3: {
    type: 'heading_3',
    icon: 'H3',
    label: 'Heading 3',
    shortcut: 'h3',
    placeholder: 'Heading 3',
    canHaveChildren: false,
    canIndent: false,
  },
  bullet_list: {
    type: 'bullet_list',
    icon: '•',
    label: 'Bullet List',
    shortcut: 'bullet',
    placeholder: 'List item',
    canHaveChildren: true,
    canIndent: true,
  },
  numbered_list: {
    type: 'numbered_list',
    icon: '1.',
    label: 'Numbered List',
    shortcut: 'number',
    placeholder: 'List item',
    canHaveChildren: true,
    canIndent: true,
  },
  todo: {
    type: 'todo',
    icon: '☐',
    label: 'To-do',
    shortcut: 'todo',
    placeholder: 'To-do',
    canHaveChildren: true,
    canIndent: true,
  },
  quote: {
    type: 'quote',
    icon: '"',
    label: 'Quote',
    shortcut: 'quote',
    placeholder: 'Quote',
    canHaveChildren: false,
    canIndent: false,
  },
  code: {
    type: 'code',
    icon: '</>',
    label: 'Code',
    shortcut: 'code',
    placeholder: 'Code snippet',
    canHaveChildren: false,
    canIndent: false,
  },
  image: {
    type: 'image',
    icon: '🖼',
    label: 'Image',
    shortcut: 'image',
    placeholder: 'Add an image',
    canHaveChildren: false,
    canIndent: false,
  },
  page: {
    type: 'page',
    icon: '📄',
    label: 'Page',
    placeholder: 'Untitled',
    canHaveChildren: true,
    canIndent: false,
  },
  database: {
    type: 'database',
    icon: '📊',
    label: 'Database',
    placeholder: 'Untitled Database',
    canHaveChildren: true,
    canIndent: false,
  },
}