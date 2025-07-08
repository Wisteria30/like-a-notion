# バックエンドエンジニアへの依頼

## M0フェーズお疲れ様でした！

API実装は完璧に動作しており、lint修正も完了しています。残るはテストの修正のみです。

## 緊急対応依頼（M0完了条件）

### テスト修正（推定作業時間：1-2時間）

#### 1. tests/setup.ts の改修
```typescript
export async function resetDatabase() {
  // トランザクションで一括削除
  await prisma.$transaction([
    prisma.block.deleteMany(),
    prisma.page.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  
  // デフォルトユーザー作成
  await prisma.user.create({
    data: {
      id: 'default-user-id',
      email: 'default@example.com',
      name: 'Default User',
    },
  });
}
```

#### 2. 各テストファイルの修正
- `beforeEach` で `await resetDatabase()` を呼び出す
- テストデータの作成順序を確認（外部キー制約）

#### 3. 動作確認
- `npm run test` で全テスト成功
- `npm run test:coverage` でカバレッジ80%達成

## M1フェーズ準備

テスト修正完了後、以下のドキュメントを確認してM1フェーズの準備を開始してください：

### 主要ドキュメント
- `/workspace/like-a-notion/docs/m1-phase-specification.md` - M1要件
- `/workspace/like-a-notion/docs/database-design.md` - DB設計
- `/workspace/like-a-notion/docs/m1-testing-strategy.md` - テスト戦略

### M1での主要タスク
1. WebSocketサーバー実装（Socket.io）
2. サービス層の実装
3. ブロックの親子関係サポート
4. 論理削除の実装

## 完了報告
テスト修正が完了したら、以下を含む完了報告をお願いします：
- テスト実行結果のスクリーンショット
- カバレッジレポート
- APIエンドポイント一覧（curlサンプル付き）

### APIエンドポイント一覧（サンプル）
```bash
# ページ一覧取得
curl http://localhost:3001/api/pages

# ページ作成
curl -X POST http://localhost:3001/api/pages \
  -H "Content-Type: application/json" \
  -d '{"title": "New Page", "icon": "📄"}'

# ブロック一覧取得
curl http://localhost:3001/api/pages/{pageId}/blocks

# ブロック作成
curl -X POST http://localhost:3001/api/blocks \
  -H "Content-Type: application/json" \
  -d '{"pageId": "...", "type": "paragraph", "properties": {"text": "Hello"}}'
```

## M1フェーズのゴール
- フロントエンドとバックエンドの完全統合
- リアルタイム同期の基礎実装
- E2Eテストの実施

## コミュニケーション
- API仕様変更時は必ず `shared/api-types.ts` を更新
- 問題発生時は早めにEMへエスカレーション

頑張ってください！質問があればいつでもお聞きください。