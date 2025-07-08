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

## M0 Skeleton 実装済み機能

### ✅ 実装済み
- **ブロックエディタ基盤**
  - Paragraphブロックの追加・削除
  - Enterキーで新規ブロック作成
  - Backspaceで空ブロック削除
  - ドラッグ&ドロップによる並び替え
  - 日本語入力（IME）対応
  
- **ブロックタイプ**
  - Paragraph (テキスト)
  - Heading (見出し 1-3)
  - Todo (チェックボックス付き)
  - Turn into機能 (ブロックタイプ変換)

- **ページ管理**
  - ページ一覧表示 (サイドバー)
  - ページ詳細表示・編集
  - ページタイトル編集

- **状態管理**
  - Zustandによる状態管理
  - LocalStorageへの自動永続化
  - モックデータの初期化

- **UIコンポーネント**
  - サイドバーナビゲーション
  - ブロックメニュー (Turn into)
  - ドラッグハンドル

- **テスト環境**
  - Jest + React Testing Library
  - ユニットテスト実装
  - コンポーネントテスト実装

### 🚧 未実装 (今後の課題)
- インデント機能 (階層構造)
- `/` コマンドメニュー
- リアルタイム同期 (Socket.io + Yjs)
- バックエンドAPI連携
- より多くのブロックタイプ (画像、コード等)

## API通信
バックエンドAPIとは`/shared/api-types.ts`で定義されたインターフェースを介して通信します。

## ディレクトリ構造

```
src/
├── app/              # Next.js App Router
├── components/       # UIコンポーネント
│   ├── blocks/      # ブロック関連
│   ├── editor/      # エディタ
│   ├── layout/      # レイアウト
│   └── sidebar/     # サイドバー
├── lib/             # ユーティリティ
├── stores/          # Zustand stores
└── styles/          # グローバルスタイル
```

## 開発コマンド

```bash
# 型チェック
npm run type-check

# Lint
npm run lint

# テスト
npm test
npm run test:watch     # ウォッチモード
npm run test:coverage  # カバレッジ
```

## 技術的な注意事項

### 日本語入力（IME）対応
ParagraphBlockコンポーネントでは、contentEditableとcomposition eventsを使用して日本語入力に対応しています。
- `onCompositionStart`/`onCompositionEnd`イベントでIME変換中の状態を管理
- IME変換中はEnterキーなどのショートカットを無効化
- 変換確定時にのみテキストを更新することで、変換中の再レンダリングを防止