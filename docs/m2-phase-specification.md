# M2 Phase Specification

## Overview
M2フェーズでは、M1の基盤の上に以下の高度な機能を実装します。

## 前提条件
- M1のリアルタイム同期が完全動作していること
- 基本的なCRUD操作が安定していること
- テストカバレッジ80%以上

## 共通要件

### 新規ブロックタイプ
```typescript
// shared/api-types.ts に追加
export type AdvancedBlockType = 
  | 'heading_2' | 'heading_3'
  | 'bulleted_list' | 'numbered_list' 
  | 'toggle' | 'quote' | 'divider'
  | 'code' | 'image' | 'video'
  | 'table' | 'database';
```

### データベース機能
```typescript
interface DatabaseView {
  id: string;
  type: 'table' | 'board' | 'timeline' | 'calendar' | 'gallery';
  properties: DatabaseProperty[];
  filters: Filter[];
  sorts: Sort[];
}

interface DatabaseProperty {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multi_select' | 
        'date' | 'checkbox' | 'url' | 'email' | 'phone';
  options?: PropertyOptions;
}
```

## Frontend要件

### 1. 高度なブロックタイプ実装
- **リストブロック**
  - 箇条書き・番号付きリスト
  - ネスト対応（Tab/Shift+Tab）
  - リスト種類の相互変換

- **トグルブロック**
  - 折りたたみ可能なコンテンツ
  - 子ブロックの管理
  - アニメーション

- **コードブロック**
  - シンタックスハイライト（Prism.js）
  - 言語選択機能
  - コピーボタン

### 2. メディアブロック
- **画像ブロック**
  - ドラッグ&ドロップアップロード
  - リサイズ機能
  - キャプション

- **動画ブロック**
  - YouTube/Vimeo埋め込み
  - ローカル動画アップロード

### 3. データベース基本実装
- **テーブルビュー**
  - プロパティ管理
  - 行の追加/削除/編集
  - ソート・フィルター

### 4. 高度なエディタ機能
- **スラッシュコマンド拡張**
  - 全ブロックタイプ対応
  - ファジー検索
  - キーボードナビゲーション

- **マークダウンショートカット**
  - `#` → 見出し
  - `-` → リスト
  - `>` → 引用
  - ` ``` ` → コード

### 5. UI/UX改善
- **ブロック選択**
  - 複数選択（Shift+クリック）
  - 一括操作（削除、移動、変換）

- **検索機能**
  - ページ内検索（Ctrl+F）
  - グローバル検索

## Backend要件

### 1. ファイルストレージ
- **アップロードAPI**
  ```typescript
  POST /api/upload
  - 画像・動画アップロード
  - ファイルサイズ制限（画像5MB、動画50MB）
  - 形式検証
  ```

- **ストレージ実装**
  - ローカルファイルシステム（開発）
  - S3互換ストレージ対応準備

### 2. データベース機能API
- **データベース作成**
  ```typescript
  POST /api/databases
  PUT /api/databases/:id
  DELETE /api/databases/:id
  ```

- **プロパティ管理**
  ```typescript
  POST /api/databases/:id/properties
  PUT /api/properties/:id
  DELETE /api/properties/:id
  ```

### 3. 検索API
- **全文検索**
  ```typescript
  GET /api/search?q=query
  - ページタイトル検索
  - ブロックコンテンツ検索
  - SQLite FTS5使用
  ```

### 4. パフォーマンス最適化
- **ページング**
  ```typescript
  GET /api/pages?limit=20&cursor=xxx
  GET /api/blocks?pageId=xxx&limit=50&cursor=xxx
  ```

- **キャッシング**
  - Redis互換キャッシュ準備
  - 頻繁にアクセスされるデータのキャッシュ

## テスト要件

### Frontend
- ブロックタイプごとのユニットテスト
- データベース操作のテスト
- ファイルアップロードのテスト
- 検索機能のテスト

### Backend
- ファイルアップロードAPI統合テスト
- データベース機能テスト
- 検索APIテスト
- パフォーマンステスト（100ブロック、1000ブロック）

### E2Eテスト
- 複雑なドキュメント作成シナリオ
- データベース作成・編集シナリオ
- マルチユーザー編集シナリオ

## 非機能要件

### パフォーマンス
- 100ブロックのページ: 初期レンダリング < 500ms
- リアルタイム同期遅延: < 100ms
- 検索レスポンス: < 200ms

### セキュリティ
- ファイルアップロード検証
- XSS対策（サニタイズ）
- SQLインジェクション対策

### スケーラビリティ
- 1ページあたり1000ブロックまで対応
- 同時編集ユーザー: 20人/ページ

## 依存関係
- M1完了（特にリアルタイム同期）
- ファイルストレージ設計決定
- 検索エンジン選定

## マイルストーン
1. **Week 1**: 高度なブロックタイプ実装
2. **Week 2**: メディアブロック・ファイルアップロード
3. **Week 3**: データベース基本機能
4. **Week 4**: 検索・パフォーマンス最適化