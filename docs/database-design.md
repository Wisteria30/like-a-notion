# Database Design & Migration Strategy

## Database Schema

### Pages Table
```sql
CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  parent_page_id TEXT REFERENCES pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT,
  cover_image TEXT,
  is_database BOOLEAN DEFAULT false,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by_id TEXT NOT NULL,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_pages_parent ON pages(parent_page_id);
CREATE INDEX idx_pages_deleted ON pages(deleted_at);
CREATE INDEX idx_pages_sort ON pages(parent_page_id, sort_index);
```

### Blocks Table
```sql
CREATE TABLE blocks (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  parent_block_id TEXT REFERENCES blocks(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  properties JSON NOT NULL,
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by_id TEXT NOT NULL,
  last_edited_by_id TEXT NOT NULL,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_blocks_page ON blocks(page_id);
CREATE INDEX idx_blocks_parent ON blocks(parent_block_id);
CREATE INDEX idx_blocks_deleted ON blocks(deleted_at);
CREATE INDEX idx_blocks_sort ON blocks(page_id, parent_block_id, sort_index);
```

### Users Table (M1では簡易版)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id         String   @id @default(uuid())
  email      String   @unique
  name       String
  avatarUrl  String?  @map("avatar_url")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  
  createdPages Page[]  @relation("PageCreator")
  createdBlocks Block[] @relation("BlockCreator")
  editedBlocks Block[]  @relation("BlockEditor")
  
  @@map("users")
}

model Page {
  id           String    @id @default(uuid())
  parentPageId String?   @map("parent_page_id")
  title        String
  icon         String?
  coverImage   String?   @map("cover_image")
  isDatabase   Boolean   @default(false) @map("is_database")
  sortIndex    Int       @default(0) @map("sort_index")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  createdById  String    @map("created_by_id")
  deletedAt    DateTime? @map("deleted_at")
  
  parentPage   Page?     @relation("PageHierarchy", fields: [parentPageId], references: [id], onDelete: Cascade)
  childPages   Page[]    @relation("PageHierarchy")
  blocks       Block[]
  creator      User      @relation("PageCreator", fields: [createdById], references: [id])
  
  @@index([parentPageId])
  @@index([deletedAt])
  @@index([parentPageId, sortIndex])
  @@map("pages")
}

model Block {
  id              String    @id @default(uuid())
  pageId          String    @map("page_id")
  parentBlockId   String?   @map("parent_block_id")
  type            String
  properties      Json
  sortIndex       Int       @default(0) @map("sort_index")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  createdById     String    @map("created_by_id")
  lastEditedById  String    @map("last_edited_by_id")
  deletedAt       DateTime? @map("deleted_at")
  
  page            Page      @relation(fields: [pageId], references: [id], onDelete: Cascade)
  parentBlock     Block?    @relation("BlockHierarchy", fields: [parentBlockId], references: [id], onDelete: Cascade)
  childBlocks     Block[]   @relation("BlockHierarchy")
  creator         User      @relation("BlockCreator", fields: [createdById], references: [id])
  lastEditor      User      @relation("BlockEditor", fields: [lastEditedById], references: [id])
  
  @@index([pageId])
  @@index([parentBlockId])
  @@index([deletedAt])
  @@index([pageId, parentBlockId, sortIndex])
  @@map("blocks")
}
```

## Migration Strategy

### 初期マイグレーション (M0)
```bash
# 1. Prismaスキーマ作成
npx prisma init

# 2. 初期マイグレーション生成
npx prisma migrate dev --name init

# 3. クライアント生成
npx prisma generate
```

### M1マイグレーション
```bash
# 1. スキーマ更新後
npx prisma migrate dev --name add_block_hierarchy

# 2. データ移行スクリプト実行
npm run db:migrate-data
```

## Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  // デフォルトユーザー作成
  const user = await prisma.user.create({
    data: {
      id: 'user-1',
      email: 'demo@likeanation.com',
      name: 'Demo User',
    },
  })

  // ルートページ作成
  const welcomePage = await prisma.page.create({
    data: {
      id: uuidv4(),
      title: 'Welcome to Like a Notion',
      icon: '👋',
      createdById: user.id,
      blocks: {
        create: [
          {
            id: uuidv4(),
            type: 'paragraph',
            properties: {
              text: 'This is your first paragraph block. Click to edit.',
            },
            sortIndex: 0,
            createdById: user.id,
            lastEditedById: user.id,
          },
          {
            id: uuidv4(),
            type: 'paragraph',
            properties: {
              text: 'Press Enter to create new blocks.',
            },
            sortIndex: 1,
            createdById: user.id,
            lastEditedById: user.id,
          },
        ],
      },
    },
  })

  // サブページ作成
  const gettingStarted = await prisma.page.create({
    data: {
      id: uuidv4(),
      parentPageId: welcomePage.id,
      title: 'Getting Started',
      icon: '🚀',
      sortIndex: 0,
      createdById: user.id,
    },
  })

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

## Query Patterns

### ページツリー取得
```typescript
// 再帰的にページツリーを取得
async function getPageTree(parentId: string | null = null): Promise<Page[]> {
  const pages = await prisma.page.findMany({
    where: {
      parentPageId: parentId,
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          childPages: true,
          blocks: true,
        },
      },
    },
    orderBy: {
      sortIndex: 'asc',
    },
  })

  // 各ページの子ページを再帰的に取得
  for (const page of pages) {
    if (page._count.childPages > 0) {
      page.childPages = await getPageTree(page.id)
    }
  }

  return pages
}
```

### ブロックツリー取得
```typescript
// ページ内の全ブロックをツリー構造で取得
async function getBlockTree(pageId: string): Promise<Block[]> {
  const blocks = await prisma.block.findMany({
    where: {
      pageId,
      deletedAt: null,
    },
    orderBy: {
      sortIndex: 'asc',
    },
  })

  // ブロックをツリー構造に変換
  const blockMap = new Map(blocks.map(b => [b.id, { ...b, childBlocks: [] }]))
  const rootBlocks: Block[] = []

  blocks.forEach(block => {
    if (block.parentBlockId) {
      const parent = blockMap.get(block.parentBlockId)
      if (parent) {
        parent.childBlocks.push(blockMap.get(block.id)!)
      }
    } else {
      rootBlocks.push(blockMap.get(block.id)!)
    }
  })

  return rootBlocks
}
```

### ソート順更新
```typescript
// ブロックの並び順を更新
async function updateBlockOrder(
  blockId: string,
  newParentId: string | null,
  afterBlockId: string | null
) {
  const block = await prisma.block.findUnique({ where: { id: blockId } })
  if (!block) throw new Error('Block not found')

  // 同じ親の下のブロックを取得
  const siblings = await prisma.block.findMany({
    where: {
      pageId: block.pageId,
      parentBlockId: newParentId,
      deletedAt: null,
      NOT: { id: blockId },
    },
    orderBy: { sortIndex: 'asc' },
  })

  // 新しいsortIndexを計算
  let newSortIndex = 0
  if (afterBlockId) {
    const afterBlock = siblings.find(b => b.id === afterBlockId)
    const afterIndex = siblings.indexOf(afterBlock!)
    const nextBlock = siblings[afterIndex + 1]
    
    if (nextBlock) {
      newSortIndex = (afterBlock!.sortIndex + nextBlock.sortIndex) / 2
    } else {
      newSortIndex = afterBlock!.sortIndex + 1000
    }
  } else if (siblings.length > 0) {
    newSortIndex = siblings[0].sortIndex / 2
  }

  // ブロックを更新
  await prisma.block.update({
    where: { id: blockId },
    data: {
      parentBlockId: newParentId,
      sortIndex: newSortIndex,
    },
  })
}
```

## インデックス戦略

### パフォーマンス最適化
1. **頻繁なクエリパターンに基づくインデックス**
   - 親子関係の検索: `parent_page_id`, `parent_block_id`
   - ソート: `sort_index`
   - 論理削除: `deleted_at`

2. **複合インデックス**
   - ページ内ブロック検索: `(page_id, parent_block_id, sort_index)`
   - ページ階層: `(parent_page_id, sort_index)`

### データ整合性
1. **外部キー制約**
   - カスケード削除: ページ削除時に関連ブロックも削除
   - 親子関係の整合性保証

2. **論理削除**
   - `deleted_at`フィールドによるソフトデリート
   - 復元可能な削除実装

## バックアップ戦略

### 開発環境
```bash
# SQLiteデータベースのバックアップ
cp prisma/dev.db prisma/backup/dev-$(date +%Y%m%d-%H%M%S).db
```

### 本番環境（将来）
- 定期的な自動バックアップ
- ポイントインタイムリカバリ
- レプリケーション設定