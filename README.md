# Like a Notion

Notionのクローンアプリ
Webアプリです。

- Backend
- Frontend（Web）

の2つの構成です。

## ディレクトリ構成

```
like-a-notion/
├── frontend/          # フロントエンド (Next.js)
├── backend/           # バックエンド (Express + SQLite)
├── shared/            # 共通型定義
│   └── api-types.ts   # API インターフェース定義
├── DesignDoc.md       # 設計仕様書
└── notion-clone-implementation-guide.md  # 実装ガイド
```

## 並列開発について

フロントエンドとバックエンドは独立したディレクトリに分離されており、`shared/api-types.ts`に定義されたインターフェースを共有することで並列開発が可能です。

### フロントエンドチーム
- `/frontend`ディレクトリで作業
- モックAPIを使用して開発可能
- バックエンドとは`shared/api-types.ts`で定義されたインターフェースで通信

### バックエンドチーム
- `/backend`ディレクトリで作業
- API仕様に従ってエンドポイントを実装
- SQLiteでデータベース管理

## Deps
- ローカルで動く必要があります。
- 大まかな方針は[DesignDoc](DesignDoc.md)に記載しています。
- 実装を手助けするリファレンスとして[リファレンス](./notion-clone-implementation-guide.md)を記載しています。技術スタックなどが違う可能性があるので、あくまで参考です。
- リレーショナルDBはSQLiteを使用してください。

## 開発開始方法

### フロントエンド
```bash
cd frontend
npm install
npm run dev
```

### バックエンド
```bash
cd backend
npm install
cp .env.example .env  # 環境変数の設定
npm run dev
```