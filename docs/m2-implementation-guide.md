# M2 Implementation Guide

## 実装優先順位

### Phase 1: M1完了作業（必須）
M2開始前に以下を完了する必要があります：

1. **リアルタイム同期の統合**（4-6時間）
   - BlockEditorでWebSocket接続
   - ブロック変更のリアルタイム反映
   - 他ユーザーのカーソル表示

2. **基本UI機能**（3-4時間）
   - ドラッグ&ドロップ実装
   - ネストブロック対応
   - blockStore/uiStore実装

3. **テストカバレッジ改善**（4-6時間）
   - Frontend: 15.54% → 80%
   - Backend: 53.51% → 80%

### Phase 2: M2コア機能

#### Week 1: ブロックタイプ拡張

**Frontend実装**
```typescript
// components/blocks/HeadingBlock.tsx
interface HeadingBlockProps {
  level: 1 | 2 | 3;
  text: string;
  onUpdate: (text: string) => void;
}

// components/blocks/ListBlock.tsx
interface ListBlockProps {
  type: 'bulleted' | 'numbered';
  items: string[];
  indent: number;
  onUpdate: (items: string[]) => void;
}

// components/blocks/ToggleBlock.tsx
interface ToggleBlockProps {
  summary: string;
  isOpen: boolean;
  children: Block[];
  onToggle: () => void;
}
```

**マークダウンショートカット実装**
```typescript
// lib/markdown-shortcuts.ts
const shortcuts = {
  '#': { type: 'heading_1' },
  '##': { type: 'heading_2' },
  '###': { type: 'heading_3' },
  '-': { type: 'bulleted_list' },
  '1.': { type: 'numbered_list' },
  '>': { type: 'quote' },
  '```': { type: 'code' },
};
```

#### Week 2: メディア機能

**ファイルアップロード実装**
```typescript
// Backend: src/controllers/upload.controller.ts
import multer from 'multer';

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB 
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  }
});
```

**Frontend: 画像ブロック**
```typescript
// components/blocks/ImageBlock.tsx
const ImageBlock = ({ url, caption, onUpload }) => {
  const handleDrop = async (e: DragEvent) => {
    const file = e.dataTransfer.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/upload', formData);
    onUpload(response.data.url);
  };
  
  return (
    <div onDrop={handleDrop}>
      {url ? <img src={url} /> : <DropZone />}
      <input placeholder="キャプション" />
    </div>
  );
};
```

#### Week 3: データベース基本機能

**データベーススキーマ拡張**
```prisma
model Database {
  id         String    @id @default(uuid())
  pageId     String    @unique
  viewType   String    @default("table")
  properties Json      // DatabaseProperty[]
  
  page       Page      @relation(fields: [pageId], references: [id])
  rows       DatabaseRow[]
}

model DatabaseRow {
  id         String    @id @default(uuid())
  databaseId String
  cells      Json      // { propertyId: value }
  sortIndex  Int       @default(0)
  
  database   Database  @relation(fields: [databaseId], references: [id])
}
```

**Frontend: テーブルビュー**
```typescript
// components/database/TableView.tsx
const TableView = ({ database, rows }) => {
  return (
    <table>
      <thead>
        <tr>
          {database.properties.map(prop => (
            <th key={prop.id}>
              {prop.name}
              <PropertyTypeSelector type={prop.type} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <TableRow key={row.id} row={row} properties={database.properties} />
        ))}
      </tbody>
    </table>
  );
};
```

#### Week 4: 検索とパフォーマンス

**SQLite全文検索実装**
```sql
-- マイグレーション
CREATE VIRTUAL TABLE pages_fts USING fts5(
  id UNINDEXED,
  title,
  content
);

CREATE VIRTUAL TABLE blocks_fts USING fts5(
  id UNINDEXED,
  page_id UNINDEXED,
  content
);

-- トリガーで同期
CREATE TRIGGER pages_ai AFTER INSERT ON pages BEGIN
  INSERT INTO pages_fts(id, title) VALUES (new.id, new.title);
END;
```

**検索API実装**
```typescript
// src/services/searchService.ts
export class SearchService {
  async search(query: string) {
    const pages = await prisma.$queryRaw`
      SELECT id, title, snippet(pages_fts, 1, '<mark>', '</mark>', '...', 20) as excerpt
      FROM pages_fts
      WHERE pages_fts MATCH ${query}
      ORDER BY rank
      LIMIT 20
    `;
    
    const blocks = await prisma.$queryRaw`
      SELECT id, page_id, snippet(blocks_fts, 2, '<mark>', '</mark>', '...', 30) as excerpt
      FROM blocks_fts
      WHERE blocks_fts MATCH ${query}
      ORDER BY rank
      LIMIT 30
    `;
    
    return { pages, blocks };
  }
}
```

## テスト戦略

### ユニットテスト例
```typescript
// blocks/HeadingBlock.test.tsx
describe('HeadingBlock', () => {
  it('should render different heading levels', () => {
    const { container } = render(<HeadingBlock level={2} text="Test" />);
    expect(container.querySelector('h2')).toBeInTheDocument();
  });
  
  it('should handle markdown shortcuts', () => {
    const onUpdate = jest.fn();
    const { getByRole } = render(<HeadingBlock level={1} text="" onUpdate={onUpdate} />);
    
    fireEvent.change(getByRole('textbox'), { target: { value: '## ' } });
    expect(onUpdate).toHaveBeenCalledWith({ type: 'heading_2' });
  });
});
```

### 統合テスト例
```typescript
// api/upload.test.ts
describe('Upload API', () => {
  it('should upload image file', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', 'test/fixtures/test-image.jpg')
      .expect(201);
      
    expect(response.body).toHaveProperty('url');
    expect(fs.existsSync(`uploads/${response.body.filename}`)).toBe(true);
  });
  
  it('should reject large files', async () => {
    const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
    await request(app)
      .post('/api/upload')
      .attach('file', largeBuffer, 'large.jpg')
      .expect(413);
  });
});
```

## パフォーマンス最適化

### ページング実装
```typescript
// Frontend: hooks/useInfiniteBlocks.ts
const useInfiniteBlocks = (pageId: string) => {
  return useInfiniteQuery({
    queryKey: ['blocks', pageId],
    queryFn: ({ pageParam = 0 }) => 
      blocksApi.list(pageId, { limit: 50, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};
```

### 仮想スクロール
```typescript
// components/VirtualBlockList.tsx
import { VariableSizeList } from 'react-window';

const VirtualBlockList = ({ blocks, height }) => {
  const getItemSize = (index: number) => {
    const block = blocks[index];
    return block.type === 'heading_1' ? 60 : 40;
  };
  
  return (
    <VariableSizeList
      height={height}
      itemCount={blocks.length}
      itemSize={getItemSize}
    >
      {({ index, style }) => (
        <div style={style}>
          <BlockRenderer block={blocks[index]} />
        </div>
      )}
    </VariableSizeList>
  );
};
```

## セキュリティ考慮事項

### XSS対策
```typescript
// lib/sanitize.ts
import DOMPurify from 'dompurify';

export const sanitizeHTML = (html: string) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
};
```

### ファイルアップロード検証
```typescript
// Backend: validators/upload.ts
import fileType from 'file-type';

export const validateFile = async (buffer: Buffer) => {
  const type = await fileType.fromBuffer(buffer);
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (!type || !allowedTypes.includes(type.mime)) {
    throw new Error('Invalid file type');
  }
  
  // Additional virus scan here
  return true;
};
```