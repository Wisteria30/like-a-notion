# Backend - Like a Notion

Notionクローンのバックエンド部分です。

## 技術スタック
- Node.js + TypeScript
- Express.js
- Prisma ORM
- SQLite (データベース)
- Socket.io (WebSocket) ✅ M1実装済み
- Zod (バリデーション)
- Jest (テスト)
- JWT (認証) ※将来実装予定
- Yjs (CRDT同期) ※将来実装予定

## セットアップ

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定
```bash
cp .env.example .env
```

3. データベースのセットアップ
```bash
npm run db:migrate  # マイグレーション実行
npm run db:seed     # 初期データ投入
```

## 開発サーバー
```bash
npm run dev
```
- API: http://localhost:3001
- WebSocket: ws://localhost:3001/socket.io
- Health Check: http://localhost:3001/health

## コマンド一覧

### 開発
- `npm run dev` - 開発サーバー起動 (nodemon)
- `npm run build` - TypeScriptビルド
- `npm start` - プロダクションサーバー起動

### データベース
- `npm run db:migrate` - Prismaマイグレーション実行
- `npm run db:seed` - シードデータ投入
- `npm run db:reset` - データベースリセット

### テスト・品質
- `npm test` - テスト実行
- `npm run test:watch` - テストウォッチモード
- `npm run test:coverage` - カバレッジレポート付きテスト
- `npm run lint` - ESLint実行
- `npm run type-check` - TypeScript型チェック

## API仕様

### Pages API

#### GET /api/pages
トップレベルのページ一覧を取得

**レスポンス例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Page Title",
      "icon": "📄",
      "parentPageId": null,
      "sortIndex": 0,
      "_count": {
        "childPages": 2,
        "blocks": 5
      }
    }
  ]
}
```

#### POST /api/pages
新規ページ作成

**リクエスト:**
```json
{
  "title": "New Page",
  "parentPageId": "parent-uuid",
  "icon": "📝",
  "coverImage": "https://example.com/image.jpg"
}
```

#### GET /api/pages/:id
ページ詳細取得（子ページ含む）

#### PUT /api/pages/:id
ページ情報更新

#### DELETE /api/pages/:id
ページ削除（子ページ・ブロックも連動削除）

#### GET /api/pages/:id/blocks
ページ内のブロック一覧取得

### Blocks API

#### POST /api/blocks
ブロック作成

**リクエスト:**
```json
{
  "pageId": "page-uuid",
  "type": "paragraph",
  "properties": {
    "text": "Hello World"
  },
  "parentBlockId": "parent-uuid",
  "afterBlockId": "after-uuid"
}
```

#### PUT /api/blocks/:id
ブロック更新

**リクエスト:**
```json
{
  "properties": {
    "text": "Updated text"
  }
}
```

#### DELETE /api/blocks/:id
ブロック削除（子ブロックも連動削除）

## データモデル

### Pages
- `id`: UUID
- `parentPageId`: 親ページID（nullable）
- `title`: ページタイトル
- `icon`: アイコン絵文字（nullable）
- `coverImage`: カバー画像URL（nullable）
- `isDatabase`: データベースページフラグ
- `sortIndex`: 並び順
- `deletedAt`: 削除日時（ソフトデリート）✅ M1新規

### Blocks
- `id`: UUID
- `pageId`: 所属ページID
- `parentBlockId`: 親ブロックID（nullable）
- `type`: ブロックタイプ
- `properties`: ブロックプロパティ（JSON）✅ M1更新
- `sortIndex`: 並び順
- `deletedAt`: 削除日時（ソフトデリート）✅ M1新規

### Users
- `id`: UUID
- `email`: メールアドレス
- `name`: ユーザー名
- `avatarUrl`: アバター画像URL ✅ M1新規

## エラーレスポンス

```json
{
  "success": false,
  "error": "エラーメッセージ",
  "details": {} // Zodバリデーションエラーの詳細（optional）
}
```

## 主要機能
- RESTful API
- ページ・ブロックのCRUD操作
- 階層構造管理
- ソート順管理
- ソフトデリート（論理削除）
- WebSocketリアルタイム通信
- ページ別ルーム管理
- カスケード削除
- Zodによる入力検証
- エラーハンドリング

## WebSocket機能（M1新機能）

### 接続
```javascript
const socket = io('http://localhost:3001');
```

### ページルームへの参加
```javascript
socket.emit('join_page', { pageId: 'page-uuid' });
```

### リアルタイムイベント
- `page_updated` - ページ更新通知
- `block_created` - ブロック作成通知
- `block_updated` - ブロック更新通知
- `block_deleted` - ブロック削除通知
- `user_joined` - ユーザー参加通知
- `user_left` - ユーザー退出通知

### イベント構造
```typescript
interface WSMessage {
  type: 'page_updated' | 'block_created' | 'block_updated' | 'block_deleted' | 'user_joined' | 'user_left';
  pageId: string;
  data: any;
  userId?: string;
  timestamp: number;
}
```

## ディレクトリ構成
```
backend/
├── src/
│   ├── config/         # DB接続等の設定
│   ├── controllers/    # APIコントローラー
│   ├── middlewares/    # Express ミドルウェア
│   ├── routes/         # ルーティング定義
│   ├── services/       # ビジネスロジック層 ✅ M1新規
│   ├── types/          # 型定義・バリデーション
│   ├── utils/          # ユーティリティ関数
│   ├── app.ts          # Expressアプリケーション
│   └── server.ts       # サーバーエントリポイント
├── prisma/
│   ├── schema.prisma   # Prismaスキーマ定義
│   ├── migrations/     # DBマイグレーション
│   └── seed.ts         # シードデータ
├── tests/              # Jestテスト
└── dist/               # ビルド出力
```

## API型定義
`/shared/api-types.ts`で定義されたインターフェースに準拠します。