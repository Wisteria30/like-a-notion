# Frontend - Like a Notion

Notionクローンのフロントエンド部分です。

## 技術スタック
- Next.js 14+ (React + TypeScript)
- Tailwind CSS
- Zustand (状態管理)
- TipTap or ProseMirror (リッチテキストエディタ)
- Socket.io-client (リアルタイム通信)
- Yjs (CRDT同期)

## セットアップ
```bash
cd frontend
npm install
npm run dev
```

## 開発サーバー
http://localhost:3000

## 主要機能
- ブロックベースエディタ
- ページ階層管理
- リアルタイム共同編集
- データベースビュー（テーブル）

## API通信
バックエンドAPIとは`/shared/api-types.ts`で定義されたインターフェースを介して通信します。