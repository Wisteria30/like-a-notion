import { 
  createBlock, 
  buildBlockTree, 
  flattenBlockTree,
  calculateIndentLevel,
  convertBlockType,
  canHaveChildren,
  canIndent
} from '../blocks'
import { Block } from '@/../../shared/api-types'

describe('blocks utilities', () => {
  describe('createBlock', () => {
    it('should create a new block with default values', () => {
      const block = createBlock('paragraph', 'page-1')
      
      expect(block.type).toBe('paragraph')
      expect(block.pageId).toBe('page-1')
      expect(block.parentBlockId).toBeNull()
      expect(block.properties.text).toBe('')
      expect(block.sortIndex).toBe(0)
      expect(block.id).toBeDefined()
      expect(block.createdAt).toBeInstanceOf(Date)
      expect(block.updatedAt).toBeInstanceOf(Date)
    })

    it('should create a block with custom properties', () => {
      const block = createBlock('todo', 'page-1', null, {
        text: 'Test todo',
        checked: true
      })
      
      expect(block.properties.text).toBe('Test todo')
      expect(block.properties.checked).toBe(true)
    })

    it('should create a block with parent and sortIndex', () => {
      const block = createBlock('paragraph', 'page-1', 'parent-block', {}, 5)
      
      expect(block.parentBlockId).toBe('parent-block')
      expect(block.sortIndex).toBe(5)
    })
  })

  describe('buildBlockTree', () => {
    it('should build a tree from flat blocks', () => {
      const parent1 = createBlock('paragraph', 'page-1', null, { text: 'Parent 1' }, 0)
      const blocks: Block[] = [
        parent1,
        createBlock('paragraph', 'page-1', parent1.id, { text: 'Child 1' }, 0),
        createBlock('paragraph', 'page-1', null, { text: 'Parent 2' }, 1),
      ]

      const tree = buildBlockTree(blocks)
      
      expect(tree).toHaveLength(2)
      expect(tree[0].children).toHaveLength(1)
      expect(tree[0].children[0].properties.text).toBe('Child 1')
      expect(tree[1].children).toHaveLength(0)
    })

    it('should sort children by sortIndex', () => {
      const parent = createBlock('paragraph', 'page-1')
      const blocks: Block[] = [
        parent,
        createBlock('paragraph', 'page-1', parent.id, { text: 'Child 2' }, 2),
        createBlock('paragraph', 'page-1', parent.id, { text: 'Child 1' }, 1),
        createBlock('paragraph', 'page-1', parent.id, { text: 'Child 3' }, 3),
      ]

      const tree = buildBlockTree(blocks)
      
      expect(tree[0].children).toHaveLength(3)
      expect(tree[0].children[0].properties.text).toBe('Child 1')
      expect(tree[0].children[1].properties.text).toBe('Child 2')
      expect(tree[0].children[2].properties.text).toBe('Child 3')
    })
  })

  describe('flattenBlockTree', () => {
    it('should flatten a tree back to array', () => {
      const parent = createBlock('paragraph', 'page-1', null, { text: 'Parent' })
      const blocks: Block[] = [
        parent,
        createBlock('paragraph', 'page-1', parent.id, { text: 'Child' }),
      ]

      const tree = buildBlockTree(blocks)
      const flattened = flattenBlockTree(tree)
      
      expect(flattened).toHaveLength(2)
      expect(flattened.find(b => b.properties.text === 'Parent')).toBeDefined()
      expect(flattened.find(b => b.properties.text === 'Child')).toBeDefined()
    })
  })

  describe('calculateIndentLevel', () => {
    it('should calculate correct indent levels', () => {
      const block1 = createBlock('paragraph', 'page-1', null)
      const block2 = createBlock('paragraph', 'page-1', block1.id)
      const blocks: Block[] = [
        block1,
        block2,
        createBlock('paragraph', 'page-1', block2.id),
      ]

      const blockMap = new Map(blocks.map(b => [b.id, b]))
      
      expect(calculateIndentLevel(blocks[0], blockMap)).toBe(0)
      expect(calculateIndentLevel(blocks[1], blockMap)).toBe(1)
      expect(calculateIndentLevel(blocks[2], blockMap)).toBe(2)
    })
  })

  describe('convertBlockType', () => {
    it('should convert paragraph to todo with default checked', () => {
      const block = createBlock('paragraph', 'page-1', null, { text: 'Test' })
      const converted = convertBlockType(block, 'todo')
      
      expect(converted.type).toBe('todo')
      expect(converted.properties.text).toBe('Test')
      expect(converted.properties.checked).toBe(false)
    })

    it('should preserve checked state when converting between types', () => {
      const todoBlock = createBlock('todo', 'page-1', null, { 
        text: 'Test', 
        checked: true 
      })
      
      // Convert to paragraph and back
      const paragraph = convertBlockType(todoBlock, 'paragraph')
      const backToTodo = convertBlockType(paragraph, 'todo')
      
      expect(backToTodo.properties.checked).toBe(true)
    })

    it('should add language property for code blocks', () => {
      const block = createBlock('paragraph', 'page-1', null, { text: 'Code' })
      const converted = convertBlockType(block, 'code')
      
      expect(converted.properties.language).toBe('plaintext')
    })
  })

  describe('canHaveChildren', () => {
    it('should return true for container types', () => {
      expect(canHaveChildren('page')).toBe(true)
      expect(canHaveChildren('bullet_list')).toBe(true)
      expect(canHaveChildren('numbered_list')).toBe(true)
      expect(canHaveChildren('todo')).toBe(true)
    })

    it('should return false for leaf types', () => {
      expect(canHaveChildren('paragraph')).toBe(false)
      expect(canHaveChildren('heading_1')).toBe(false)
      expect(canHaveChildren('quote')).toBe(false)
      expect(canHaveChildren('code')).toBe(false)
    })
  })

  describe('canIndent', () => {
    it('should return true for indentable types', () => {
      expect(canIndent('paragraph')).toBe(true)
      expect(canIndent('bullet_list')).toBe(true)
      expect(canIndent('todo')).toBe(true)
    })

    it('should return false for non-indentable types', () => {
      expect(canIndent('heading_1')).toBe(false)
      expect(canIndent('page')).toBe(false)
      expect(canIndent('database')).toBe(false)
    })
  })
})