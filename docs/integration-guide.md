# Frontend-Backend Integration Guide

## 環境設定

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Backend (.env)
```
DATABASE_URL="file:./dev.db"
PORT=3001
NODE_ENV=development
```

## API通信実装

### Frontend: API Client設定
```typescript
// frontend/src/lib/api/client.ts
import axios from 'axios'
import { ApiResponse } from '@shared/api-types'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const apiError = error.response?.data?.error || {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
    }
    return Promise.reject(apiError)
  }
)
```

### Frontend: API Hooks実装例
```typescript
// frontend/src/hooks/usePages.ts
import { Page } from '@shared/api-types'

export const usePages = () => {
  const fetchPages = async (): Promise<Page[]> => {
    const response = await apiClient.get<ApiResponse<Page[]>>('/pages')
    return response.data
  }
  
  const createPage = async (page: Partial<Page>): Promise<Page> => {
    const response = await apiClient.post<ApiResponse<Page>>('/pages', page)
    return response.data
  }
  
  // ... 他のメソッド
}
```

### Backend: CORSとミドルウェア設定
```typescript
// backend/src/server.ts
import cors from 'cors'
import helmet from 'helmet'

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))
app.use(helmet())
app.use(express.json())
```

## WebSocket統合

### Frontend: Socket接続
```typescript
// frontend/src/lib/websocket/client.ts
import { io, Socket } from 'socket.io-client'
import { WSMessage } from '@shared/api-types'

class WebSocketClient {
  private socket: Socket | null = null

  connect(pageId: string) {
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      transports: ['websocket'],
    })

    this.socket.emit('join-page', { pageId })
  }

  sendMessage(message: WSMessage) {
    this.socket?.emit('message', message)
  }

  onMessage(callback: (message: WSMessage) => void) {
    this.socket?.on('message', callback)
  }

  disconnect() {
    this.socket?.disconnect()
  }
}
```

### Backend: Socket.ioサーバー
```typescript
// backend/src/websocket/server.ts
import { Server } from 'socket.io'
import { WSMessage } from '@shared/api-types'

export const setupWebSocket = (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    socket.on('join-page', ({ pageId }) => {
      socket.join(`page-${pageId}`)
    })

    socket.on('message', (message: WSMessage) => {
      // ブロードキャスト
      socket.to(`page-${message.pageId}`).emit('message', message)
    })
  })
}
```

## データ同期パターン

### 楽観的更新
```typescript
// Frontend
const updateBlock = async (block: Block) => {
  // 1. UIを即座に更新
  updateLocalBlock(block)
  
  try {
    // 2. サーバーに送信
    const updated = await apiClient.put(`/blocks/${block.id}`, block)
    // 3. サーバーレスポンスで再同期
    updateLocalBlock(updated)
  } catch (error) {
    // 4. エラー時はロールバック
    rollbackBlock(block.id)
    showError(error)
  }
}
```

### リアルタイム同期
```typescript
// Frontend: WebSocket受信処理
wsClient.onMessage((message: WSMessage) => {
  switch (message.type) {
    case 'block_updated':
      // 他ユーザーの変更を反映
      if (message.userId !== currentUserId) {
        updateLocalBlock(message.data)
      }
      break
    case 'block_created':
      addLocalBlock(message.data)
      break
    case 'block_deleted':
      removeLocalBlock(message.data.id)
      break
  }
})
```

## エラーハンドリング

### 共通エラーコード
```typescript
// shared/api-types.ts に追加
export enum ErrorCode {
  // 認証系
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // リソース系
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  
  // バリデーション系
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  
  // サーバー系
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}
```

### Frontend: エラー表示
```typescript
// frontend/src/hooks/useErrorHandler.ts
export const useErrorHandler = () => {
  const handleError = (error: ApiError) => {
    switch (error.code) {
      case ErrorCode.NOT_FOUND:
        showToast('ページが見つかりません', 'error')
        router.push('/')
        break
      case ErrorCode.VALIDATION_ERROR:
        showToast(error.message, 'warning')
        break
      default:
        showToast('エラーが発生しました', 'error')
    }
  }
}
```

## デバッグとトラブルシューティング

### ログ設定
```typescript
// Backend
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
})

// API呼び出しログ
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})
```

### 開発ツール
- Chrome DevTools Network タブでAPI通信を確認
- WebSocket通信は WS タブで確認
- Redux DevTools Extension で Zustand の状態を確認

## チェックリスト

### Frontend
- [ ] 環境変数設定 (.env.local)
- [ ] API Client 初期化
- [ ] エラーハンドリング実装
- [ ] WebSocket接続管理
- [ ] 状態管理ストア実装

### Backend
- [ ] CORS設定
- [ ] ミドルウェア設定
- [ ] エラーハンドリングミドルウェア
- [ ] WebSocketサーバー起動
- [ ] ログ設定

### 統合テスト
- [ ] API疎通確認
- [ ] WebSocket接続確認
- [ ] エラーレスポンス確認
- [ ] 同時編集シナリオ