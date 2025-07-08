# Backend - Like a Notion

Notionクローンのバックエンド部分です。

## 技術スタック
- Node.js + TypeScript
- Express.js
- SQLite (データベース)
- Socket.io (WebSocket)
- JWT (認証)
- Yjs (CRDT同期)

## セットアップ
```bash
cd backend
npm install
npm run dev
```

## 開発サーバー
- API: http://localhost:3001
- WebSocket: ws://localhost:3001

## 主要機能
- RESTful API
- WebSocket リアルタイム通信
- 認証・認可 (JWT + RBAC)
- ブロック・ページCRUD操作
- データベース管理

## API仕様
`/shared/api-types.ts`で定義されたインターフェースに準拠します。