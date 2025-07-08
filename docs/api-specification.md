# API Specification

## Base URL
```
Development: http://localhost:3001/api
Production: https://api.likeantion.com/api
```

## Headers
```
Content-Type: application/json
Authorization: Bearer <token> (M1では未実装)
```

## Pages API

### GET /api/pages
ページ一覧を取得

#### Response
```typescript
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "parentPageId": null,
      "title": "Welcome to Like a Notion",
      "icon": "👋",
      "coverImage": null,
      "isDatabase": false,
      "sortIndex": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "createdById": "user-1",
      "_count": {
        "childPages": 2,
        "blocks": 10
      }
    }
  ]
}
```

### GET /api/pages/:id
ページ詳細を取得

#### Parameters
- `id` (path): ページID

#### Query Parameters
- `includeBlocks` (boolean): ブロックを含めるか (default: false)
- `includeChildPages` (boolean): 子ページを含めるか (default: false)

#### Response
```typescript
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "parentPageId": null,
    "title": "Welcome to Like a Notion",
    "icon": "👋",
    "coverImage": null,
    "isDatabase": false,
    "sortIndex": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "createdById": "user-1",
    "blocks": [], // includeBlocks=trueの場合
    "childPages": [] // includeChildPages=trueの場合
  }
}
```

### POST /api/pages
新規ページを作成

#### Request Body
```typescript
{
  "title": "My New Page",
  "parentPageId": "550e8400-e29b-41d4-a716-446655440000", // optional
  "icon": "📄", // optional
  "coverImage": "https://example.com/cover.jpg" // optional
}
```

#### Response
```typescript
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "parentPageId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "My New Page",
    "icon": "📄",
    "coverImage": "https://example.com/cover.jpg",
    "isDatabase": false,
    "sortIndex": 1,
    "createdAt": "2024-01-02T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z",
    "createdById": "user-1"
  }
}
```

### PUT /api/pages/:id
ページを更新

#### Parameters
- `id` (path): ページID

#### Request Body
```typescript
{
  "title": "Updated Title", // optional
  "icon": "🔥", // optional
  "coverImage": "https://example.com/new-cover.jpg" // optional
}
```

#### Response
```typescript
{
  "success": true,
  "data": {
    // 更新されたページオブジェクト
  }
}
```

### DELETE /api/pages/:id
ページを削除（論理削除）

#### Parameters
- `id` (path): ページID

#### Response
```typescript
{
  "success": true,
  "data": {
    "message": "Page deleted successfully"
  }
}
```

## Blocks API

### GET /api/pages/:pageId/blocks
ページ内のブロック一覧を取得

#### Parameters
- `pageId` (path): ページID

#### Response
```typescript
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "pageId": "550e8400-e29b-41d4-a716-446655440000",
      "parentBlockId": null,
      "type": "paragraph",
      "properties": {
        "text": "This is a paragraph block"
      },
      "sortIndex": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "createdById": "user-1",
      "lastEditedById": "user-1",
      "childBlocks": []
    }
  ]
}
```

### POST /api/pages/:pageId/blocks
新規ブロックを作成

#### Parameters
- `pageId` (path): ページID

#### Request Body
```typescript
{
  "type": "paragraph",
  "properties": {
    "text": "New block content"
  },
  "parentBlockId": "770e8400-e29b-41d4-a716-446655440000", // optional
  "afterBlockId": "880e8400-e29b-41d4-a716-446655440000" // optional
}
```

#### Response
```typescript
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "pageId": "550e8400-e29b-41d4-a716-446655440000",
    "parentBlockId": "770e8400-e29b-41d4-a716-446655440000",
    "type": "paragraph",
    "properties": {
      "text": "New block content"
    },
    "sortIndex": 1,
    "createdAt": "2024-01-02T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z",
    "createdById": "user-1",
    "lastEditedById": "user-1"
  }
}
```

### PUT /api/blocks/:id
ブロックを更新

#### Parameters
- `id` (path): ブロックID

#### Request Body
```typescript
{
  "properties": {
    "text": "Updated block content"
  },
  "sortIndex": 2 // optional
}
```

#### Response
```typescript
{
  "success": true,
  "data": {
    // 更新されたブロックオブジェクト
  }
}
```

### DELETE /api/blocks/:id
ブロックを削除

#### Parameters
- `id` (path): ブロックID

#### Response
```typescript
{
  "success": true,
  "data": {
    "message": "Block deleted successfully"
  }
}
```

## Error Responses

### 400 Bad Request
```typescript
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "details": {
    "title": ["Title is required"],
    "pageId": ["Invalid UUID format"]
  }
}
```

### 404 Not Found
```typescript
{
  "success": false,
  "error": "NOT_FOUND",
  "details": "Page not found"
}
```

### 500 Internal Server Error
```typescript
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "details": "An unexpected error occurred"
}
```

## WebSocket Events

### Connection
```javascript
const socket = io('ws://localhost:3001', {
  transports: ['websocket']
})
```

### Events

#### join-page
ページルームに参加
```typescript
socket.emit('join-page', { pageId: '550e8400-e29b-41d4-a716-446655440000' })
```

#### leave-page
ページルームから退出
```typescript
socket.emit('leave-page', { pageId: '550e8400-e29b-41d4-a716-446655440000' })
```

#### block-updated
ブロック更新イベント
```typescript
// 送信
socket.emit('block-updated', {
  pageId: '550e8400-e29b-41d4-a716-446655440000',
  block: {
    id: '770e8400-e29b-41d4-a716-446655440000',
    properties: { text: 'Updated text' }
  }
})

// 受信
socket.on('block-updated', (data) => {
  console.log('Block updated:', data.block)
})
```

#### block-created
ブロック作成イベント
```typescript
socket.emit('block-created', {
  pageId: '550e8400-e29b-41d4-a716-446655440000',
  block: { /* block data */ }
})
```

#### block-deleted
ブロック削除イベント
```typescript
socket.emit('block-deleted', {
  pageId: '550e8400-e29b-41d4-a716-446655440000',
  blockId: '770e8400-e29b-41d4-a716-446655440000'
})
```

#### cursor-moved
カーソル移動イベント（将来実装）
```typescript
socket.emit('cursor-moved', {
  pageId: '550e8400-e29b-41d4-a716-446655440000',
  blockId: '770e8400-e29b-41d4-a716-446655440000',
  position: { line: 0, character: 10 }
})
```

## Rate Limiting (将来実装)
- 60 requests per minute per IP
- WebSocket: 100 messages per minute per connection

## Pagination (将来実装)
```
GET /api/pages?page=1&limit=20
```

Response:
```typescript
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```