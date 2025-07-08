# M1 Phase Specification

## Overview
M1フェーズでは、M0 Skeletonの基盤の上に以下の機能を実装します。

## 共通要件

### API仕様
#### エンドポイント一覧
```
GET    /api/pages                 # ページ一覧取得
GET    /api/pages/:id             # ページ詳細取得
POST   /api/pages                 # ページ作成
PUT    /api/pages/:id             # ページ更新
DELETE /api/pages/:id             # ページ削除

GET    /api/pages/:pageId/blocks  # ブロック一覧取得
POST   /api/pages/:pageId/blocks  # ブロック作成
PUT    /api/blocks/:id            # ブロック更新
DELETE /api/blocks/:id            # ブロック削除
```

#### リクエスト/レスポンス形式
- Content-Type: `application/json`
- レスポンス形式: `ApiResponse<T>` (shared/api-types.ts参照)
- エラーレスポンス: `{ success: false, error: { code: string, message: string } }`

### WebSocket仕様
- エンドポイント: `ws://localhost:3001/`
- イベント: `WSMessage` 型に準拠 (shared/api-types.ts参照)
- 認証: M1では認証なし（固定ユーザー）

## Frontend要件

### 実装対象コンポーネント
1. **BlockEditor拡張**
   - ブロックタイプ切り替え (/, コマンドメニュー)
   - ドラッグ&ドロップによる並び替え
   - ネストされたブロックの表示

2. **Sidebar実装**
   - ページ一覧表示
   - ページ作成/削除
   - ページ間ナビゲーション

3. **API統合**
   - axios使用によるHTTPクライアント実装
   - エラーハンドリング
   - ローディング状態管理

### 状態管理
- Zustandストア実装
  - `pageStore`: 現在のページ状態
  - `blockStore`: ブロック一覧と操作
  - `uiStore`: UI状態（サイドバー開閉等）

## Backend要件

### データベース拡張
1. **Prismaスキーマ更新**
   - ブロックの親子関係
   - ページのネスト構造
   - 削除フラグ（論理削除）

2. **APIエンドポイント実装**
   - バリデーション（Zod使用）
   - エラーハンドリングミドルウェア
   - レスポンス整形

3. **WebSocketサーバー**
   - Socket.io実装
   - ルーム管理（ページ単位）
   - イベントブロードキャスト

### サービス層
- `PageService`: ページCRUD操作
- `BlockService`: ブロックCRUD操作
- `WebSocketService`: リアルタイム同期

## テスト要件

### Frontend
- コンポーネントテスト（React Testing Library）
- API統合テスト（MSW使用）
- E2Eテスト重要シナリオ
  - ページ作成→ブロック追加→保存
  - ブロックタイプ変更
  - ドラッグ&ドロップ

### Backend
- ユニットテスト（Jest）
  - サービス層
  - コントローラー層
- 統合テスト
  - API エンドポイント
  - WebSocket通信

## 非機能要件
- レスポンスタイム: API呼び出し < 200ms
- 同時編集: 最大10ユーザー/ページ
- データ整合性: 楽観的UI更新 + サーバー側検証

## 依存関係
- M0 Skeleton完了
- shared/api-types.ts の型定義
- データベーススキーマ確定