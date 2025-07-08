import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ParagraphBlock from '../ParagraphBlock'
import { createBlock } from '@/lib/blocks'

describe('ParagraphBlock', () => {
  const mockHandlers = {
    onUpdate: jest.fn(),
    onKeyDown: jest.fn(),
    onSelect: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render block text', () => {
    const block = createBlock('paragraph', 'page-1', null, {
      text: 'Test paragraph content'
    })
    
    render(
      <ParagraphBlock
        block={block}
        isSelected={false}
        {...mockHandlers}
      />
    )
    
    expect(screen.getByText('Test paragraph content')).toBeInTheDocument()
  })

  it('should show placeholder when empty', () => {
    const block = createBlock('paragraph', 'page-1', null, { text: '' })
    
    const { container } = render(
      <ParagraphBlock
        block={block}
        isSelected={false}
        {...mockHandlers}
      />
    )
    
    const element = container.querySelector('[data-placeholder]')
    expect(element).toHaveAttribute('data-placeholder', "Type '/' for commands")
  })

  it('should call onSelect when clicked', () => {
    const block = createBlock('paragraph', 'page-1')
    
    const { container } = render(
      <ParagraphBlock
        block={block}
        isSelected={false}
        {...mockHandlers}
      />
    )
    
    const element = container.querySelector('[contenteditable]') as HTMLElement
    fireEvent.click(element)
    expect(mockHandlers.onSelect).toHaveBeenCalledWith(block.id)
  })

  it('should call onUpdate when text changes', async () => {
    const user = userEvent.setup()
    const block = createBlock('paragraph', 'page-1', null, { text: 'Initial' })
    
    render(
      <ParagraphBlock
        block={block}
        isSelected={true}
        {...mockHandlers}
      />
    )
    
    const element = screen.getByText('Initial')
    await user.clear(element)
    await user.type(element, 'New text')
    
    // onUpdate is called on input event
    expect(mockHandlers.onUpdate).toHaveBeenCalled()
  })

  it('should focus when selected', () => {
    const block = createBlock('paragraph', 'page-1')
    
    const { rerender, container } = render(
      <ParagraphBlock
        block={block}
        isSelected={false}
        {...mockHandlers}
      />
    )
    
    rerender(
      <ParagraphBlock
        block={block}
        isSelected={true}
        {...mockHandlers}
      />
    )
    
    const element = container.querySelector('[contenteditable]')
    expect(document.activeElement).toBe(element)
  })

  it('should pass key events to handler', () => {
    const block = createBlock('paragraph', 'page-1')
    
    const { container } = render(
      <ParagraphBlock
        block={block}
        isSelected={true}
        {...mockHandlers}
      />
    )
    
    const element = container.querySelector('[contenteditable]') as HTMLElement
    fireEvent.keyDown(element, { key: 'Enter' })
    
    expect(mockHandlers.onKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'Enter' }),
      block.id
    )
  })
})