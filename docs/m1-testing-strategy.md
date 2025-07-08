# M1 Testing Strategy

## テスト方針
- カバレッジ目標: 80%以上
- TDD推奨（テスト駆動開発）
- CI/CDパイプラインでの自動実行

## Frontend テスト

### 1. ユニットテスト

#### カスタムフック
```typescript
// frontend/src/hooks/__tests__/usePages.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { usePages } from '../usePages'
import { mockApiClient } from '../../test/mocks'

describe('usePages', () => {
  it('should fetch pages', async () => {
    const { result } = renderHook(() => usePages())
    
    await waitFor(() => {
      expect(result.current.pages).toHaveLength(3)
    })
  })
})
```

#### Zustand ストア
```typescript
// frontend/src/stores/__tests__/pageStore.test.ts
import { renderHook, act } from '@testing-library/react'
import { usePageStore } from '../pageStore'

describe('pageStore', () => {
  it('should update current page', () => {
    const { result } = renderHook(() => usePageStore())
    
    act(() => {
      result.current.setCurrentPage(mockPage)
    })
    
    expect(result.current.currentPage).toEqual(mockPage)
  })
})
```

### 2. コンポーネントテスト

#### BlockEditor
```typescript
// frontend/src/components/editor/__tests__/BlockEditor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BlockEditor } from '../BlockEditor'

describe('BlockEditor', () => {
  it('should add new block on Enter', async () => {
    const onBlocksChange = jest.fn()
    render(
      <BlockEditor 
        page={mockPage}
        blocks={[]}
        onBlocksChange={onBlocksChange}
      />
    )
    
    const editor = screen.getByRole('textbox')
    await userEvent.type(editor, 'Hello{Enter}')
    
    expect(onBlocksChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'paragraph',
          properties: { text: 'Hello' }
        })
      ])
    )
  })
})
```

### 3. 統合テスト (MSW)

#### API モック設定
```typescript
// frontend/src/test/mocks/handlers.ts
import { rest } from 'msw'
import { API_URL } from '@/config'

export const handlers = [
  rest.get(`${API_URL}/pages`, (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: mockPages
      })
    )
  }),
  
  rest.post(`${API_URL}/pages`, async (req, res, ctx) => {
    const body = await req.json()
    return res(
      ctx.json({
        success: true,
        data: { ...body, id: 'new-page-id' }
      })
    )
  }),
]
```

### 4. E2Eテスト (Playwright)

#### 基本シナリオ
```typescript
// e2e/pages.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Page Management', () => {
  test('create and edit page', async ({ page }) => {
    await page.goto('/')
    
    // ページ作成
    await page.click('[data-testid="create-page-button"]')
    await page.fill('[data-testid="page-title"]', 'My New Page')
    
    // ブロック追加
    await page.keyboard.type('This is my first block')
    await page.keyboard.press('Enter')
    await page.keyboard.type('This is my second block')
    
    // 保存確認
    await expect(page.locator('[data-testid="save-indicator"]')).toHaveText('Saved')
  })
})
```

## Backend テスト

### 1. ユニットテスト

#### サービス層
```typescript
// backend/src/services/__tests__/pageService.test.ts
import { PageService } from '../pageService'
import { prismaMock } from '../../test/prisma-mock'

describe('PageService', () => {
  const pageService = new PageService()
  
  describe('createPage', () => {
    it('should create a new page', async () => {
      const pageData = {
        title: 'Test Page',
        createdById: 'user-1'
      }
      
      prismaMock.page.create.mockResolvedValue({
        id: 'page-1',
        ...pageData,
        sortIndex: 0,
        isDatabase: false,
        parentPageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      const result = await pageService.createPage(pageData)
      
      expect(result).toHaveProperty('id')
      expect(result.title).toBe('Test Page')
    })
  })
})
```

#### バリデーション
```typescript
// backend/src/validators/__tests__/pageValidator.test.ts
import { createPageSchema } from '../pageValidator'

describe('Page Validators', () => {
  describe('createPageSchema', () => {
    it('should validate correct input', () => {
      const input = {
        title: 'Valid Page',
        parentPageId: 'parent-1',
      }
      
      const result = createPageSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
    
    it('should reject empty title', () => {
      const input = { title: '' }
      
      const result = createPageSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })
})
```

### 2. 統合テスト

#### APIエンドポイント
```typescript
// backend/src/__tests__/api/pages.test.ts
import request from 'supertest'
import { app } from '../../app'
import { prisma } from '../../lib/prisma'

describe('Pages API', () => {
  beforeEach(async () => {
    await prisma.page.deleteMany()
  })
  
  describe('POST /api/pages', () => {
    it('should create a page', async () => {
      const response = await request(app)
        .post('/api/pages')
        .send({
          title: 'Test Page',
          icon: '📄'
        })
        .expect(201)
      
      expect(response.body).toMatchObject({
        success: true,
        data: {
          title: 'Test Page',
          icon: '📄'
        }
      })
    })
  })
})
```

### 3. WebSocketテスト

```typescript
// backend/src/__tests__/websocket/sync.test.ts
import { createServer } from 'http'
import { Server } from 'socket.io'
import { io as Client } from 'socket.io-client'

describe('WebSocket Sync', () => {
  let io: Server
  let serverSocket: any
  let clientSocket: any
  
  beforeAll((done) => {
    const httpServer = createServer()
    io = new Server(httpServer)
    
    httpServer.listen(() => {
      const port = httpServer.address().port
      clientSocket = Client(`http://localhost:${port}`)
      
      io.on('connection', (socket) => {
        serverSocket = socket
      })
      
      clientSocket.on('connect', done)
    })
  })
  
  test('should broadcast block updates', (done) => {
    const blockUpdate = {
      type: 'block_updated',
      pageId: 'page-1',
      data: { id: 'block-1', properties: { text: 'Updated' } }
    }
    
    clientSocket.on('message', (message) => {
      expect(message).toEqual(blockUpdate)
      done()
    })
    
    serverSocket.emit('message', blockUpdate)
  })
})
```

## パフォーマンステスト

### Frontend
```typescript
// frontend/src/components/__tests__/performance.test.tsx
import { render } from '@testing-library/react'
import { measureRender } from '@/test/utils/performance'

test('BlockEditor should render within 100ms', async () => {
  const renderTime = await measureRender(
    <BlockEditor blocks={generate100Blocks()} />
  )
  
  expect(renderTime).toBeLessThan(100)
})
```

### Backend
```typescript
// backend/src/__tests__/performance/api.test.ts
describe('API Performance', () => {
  test('GET /pages should respond within 200ms', async () => {
    const start = Date.now()
    
    await request(app).get('/api/pages')
    
    const duration = Date.now() - start
    expect(duration).toBeLessThan(200)
  })
})
```

## CI/CD設定

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend && npm ci
      - run: cd frontend && npm run test
      - run: cd frontend && npm run test:coverage
      
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd backend && npm ci
      - run: cd backend && npm run test
      - run: cd backend && npm run test:coverage
      
  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run dev &
      - run: npx playwright install
      - run: npm run test:e2e
```

## テストデータ管理

### Factory Functions
```typescript
// shared/test/factories.ts
export const createMockPage = (overrides?: Partial<Page>): Page => ({
  id: 'page-1',
  title: 'Test Page',
  icon: '📄',
  parentPageId: null,
  isDatabase: false,
  sortIndex: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdById: 'user-1',
  ...overrides,
})

export const createMockBlock = (overrides?: Partial<Block>): Block => ({
  id: 'block-1',
  pageId: 'page-1',
  type: 'paragraph',
  properties: { text: 'Test block' },
  parentBlockId: null,
  sortIndex: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdById: 'user-1',
  lastEditedById: 'user-1',
  ...overrides,
})
```

## テスト実行コマンド

### Frontend
```bash
# ユニットテスト
npm run test

# カバレッジ付き
npm run test:coverage

# ウォッチモード
npm run test:watch

# E2Eテスト
npm run test:e2e
```

### Backend
```bash
# ユニットテスト
npm run test

# 統合テスト
npm run test:integration

# カバレッジ
npm run test:coverage

# 特定のファイルのみ
npm run test -- pageService.test.ts
```