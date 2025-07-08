# フロントエンドエンジニアへの依頼

## M0フェーズ完了おめでとうございます！

素晴らしい仕事でした。全タスクを完了し、日本語入力問題も解決していただきありがとうございます。品質面でも問題なく、M1フェーズへ進む準備が整っています。

## M1フェーズ作業依頼

以下のドキュメントを参照して、M1フェーズの実装を進めてください：

### 主要ドキュメント
- `/workspace/like-a-notion/docs/m1-phase-specification.md` - M1要件定義
- `/workspace/like-a-notion/docs/integration-guide.md` - API統合ガイド
- `/workspace/like-a-notion/docs/api-specification.md` - API仕様

### 実装優先順位

#### 1. API統合基盤 (高優先度)
- `/frontend/src/lib/api/client.ts` - APIクライアント実装
- `.env.local` - 環境変数設定
- モックAPIと実APIの切り替え機能

#### 2. Sidebar実装 (高優先度)
- ページ一覧表示
- ページ作成/削除機能
- ページ間ナビゲーション

#### 3. BlockEditor拡張 (中優先度)
- ブロックタイプ切り替え（/コマンドメニュー）
- ドラッグ&ドロップ

#### 4. 状態管理の実API対応 (高優先度)
- usePageStoreの改修
- エラーハンドリング
- ローディング状態

### 注意事項
- バックエンドAPIは `http://localhost:3001` で稼働中
- 認証は未実装のため、固定ユーザー（user-1）を使用
- `ParagraphBlockFixed.tsx` は適切なタイミングで元の実装に統合してください

## M1フェーズのゴール
- フロントエンドとバックエンドの完全統合
- リアルタイム同期の基礎実装
- E2Eテストの実施

## コミュニケーション
- API仕様変更時は必ず `shared/api-types.ts` を更新
- 問題発生時は早めにEMへエスカレーション

頑張ってください！質問があればいつでもお聞きください。