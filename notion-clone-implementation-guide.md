# Notionクローンアプリ 完全実装ガイド

このドキュメントは、ジュニアエンジニアがNotionのようなアプリケーションを0から構築するための包括的なガイドです。AppFlowyの実装を参考に、必要な全ての要素を詳細に説明します。

## 目次

1. [システム概要](#1-システム概要)
2. [技術スタック](#2-技術スタック)
3. [データベース設計](#3-データベース設計)
4. [認証・権限管理](#4-認証権限管理)
5. [ドキュメントエディタ](#5-ドキュメントエディタ)
6. [データベースビュー](#6-データベースビュー)
7. [同期・コラボレーション](#7-同期コラボレーション)
8. [実装手順](#8-実装手順)
9. [デプロイメント](#9-デプロイメント)

## 1. システム概要

### 1.1 基本要件
Notionクローンアプリは以下の機能を提供する必要があります：

- **ドキュメントエディタ**: リッチテキスト編集、ブロックベースの構造
- **データベース**: テーブル、カンバン、カレンダービュー
- **階層構造**: ページの親子関係、無限のネスト
- **リアルタイムコラボレーション**: 複数ユーザーの同時編集
- **オフライン対応**: ローカルファーストアーキテクチャ
- **権限管理**: ワークスペース、ページレベルのアクセス制御

### 1.2 アーキテクチャパターン

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Web/Mobile)             │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   UI    │  │  State   │  │  Local Storage   │  │
│  │ React/  │  │  Redux/  │  │  IndexedDB/      │  │
│  │ Flutter │  │  BLoC    │  │  SQLite          │  │
│  └────┬────┘  └────┬─────┘  └────────┬─────────┘  │
└──────┼─────────────┼─────────────────┼─────────────┘
       │             │                 │
       ▼             ▼                 ▼
┌─────────────────────────────────────────────────────┐
│                    API Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │  REST    │  │ GraphQL  │  │   WebSocket     │  │
│  │  API     │  │   API    │  │   (Real-time)   │  │
│  └────┬─────┘  └────┬─────┘  └────────┬────────┘  │
└──────┼──────────────┼─────────────────┼────────────┘
       │              │                 │
       ▼              ▼                 ▼
┌─────────────────────────────────────────────────────┐
│                Backend Services                      │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │  Auth    │  │Document  │  │  Collaboration  │  │
│  │ Service  │  │ Service  │  │     Service     │  │
│  └──────────┘  └──────────┘  └─────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │Database  │  │  File    │  │    Search       │  │
│  │ Service  │  │ Storage  │  │    Service      │  │
│  └──────────┘  └──────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│                    Data Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │PostgreSQL│  │  Redis   │  │   S3/MinIO      │  │
│  │   JSONB  │  │  Cache   │  │  File Storage   │  │
│  └──────────┘  └──────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 2. 技術スタック

### 2.1 フロントエンド

**Web版**
```json
{
  "framework": "React 18+ または Next.js 14+",
  "状態管理": "Redux Toolkit + RTK Query",
  "エディタ": "Slate.js または Lexical",
  "UI": "Tailwind CSS + Radix UI",
  "リアルタイム": "Socket.io-client",
  "ローカルDB": "IndexedDB (Dexie.js)",
  "CRDT": "Yjs"
}
```

**モバイル版**
```yaml
framework: Flutter 3.0+
状態管理: flutter_bloc
エディタ: flutter_quill または custom
ローカルDB: sqflite
同期: dio + web_socket_channel
```

### 2.2 バックエンド

```javascript
// Node.js/TypeScript スタック
{
  "フレームワーク": "NestJS または Express + TypeScript",
  "ORM": "Prisma または TypeORM",
  "リアルタイム": "Socket.io",
  "認証": "Passport.js + JWT",
  "キュー": "Bull (Redis)",
  "検索": "Elasticsearch または MeiliSearch"
}

// 代替: Rust スタック（高パフォーマンス）
{
  "フレームワーク": "Actix-web または Axum",
  "ORM": "Diesel または SeaORM",
  "非同期": "Tokio",
  "WebSocket": "tokio-tungstenite"
}
```

### 2.3 インフラストラクチャ

```yaml
データベース:
  - PostgreSQL 14+ (メインDB)
  - Redis (キャッシュ、セッション、キュー)
  - Elasticsearch (全文検索)

ストレージ:
  - S3互換オブジェクトストレージ (画像、ファイル)
  - CDN (CloudFront/Cloudflare)

デプロイ:
  - Docker + Kubernetes
  - または Vercel/Railway (簡易版)
```

## 3. データベース設計

### 3.1 主要テーブル

```sql
-- ユーザーとワークスペース
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    icon TEXT,
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workspace_members (
    workspace_id UUID REFERENCES workspaces(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(50) NOT NULL, -- 'owner', 'admin', 'member', 'guest'
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workspace_id, user_id)
);

-- ビュー（ページとデータベース）
CREATE TABLE views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id),
    parent_id UUID REFERENCES views(id),
    name VARCHAR(255) NOT NULL,
    icon TEXT,
    cover_url TEXT,
    layout VARCHAR(50) NOT NULL, -- 'document', 'grid', 'board', 'calendar', 'gallery'
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    -- 階層構造のための追加フィールド
    path ltree, -- PostgreSQL拡張機能を使用
    sort_order INTEGER DEFAULT 0
);

-- ドキュメントコンテンツ（CRDT対応）
CREATE TABLE documents (
    view_id UUID PRIMARY KEY REFERENCES views(id),
    content JSONB NOT NULL, -- ブロック構造のJSON
    text_content TEXT, -- 検索用のプレーンテキスト
    state_vector BYTEA, -- Yjs state vector
    update_seq BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ドキュメント更新履歴（CRDT）
CREATE TABLE document_updates (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID REFERENCES documents(view_id),
    update_data BYTEA NOT NULL, -- Yjs update
    user_id UUID REFERENCES users(id),
    device_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- データベーススキーマ
CREATE TABLE database_schemas (
    view_id UUID PRIMARY KEY REFERENCES views(id),
    fields JSONB NOT NULL, -- フィールド定義の配列
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- データベース行
CREATE TABLE database_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    view_id UUID REFERENCES views(id),
    cells JSONB NOT NULL, -- {field_id: value} の形式
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- インデックス
CREATE INDEX idx_views_workspace_parent ON views(workspace_id, parent_id);
CREATE INDEX idx_views_path ON views USING gist(path);
CREATE INDEX idx_documents_text ON documents USING gin(to_tsvector('english', text_content));
CREATE INDEX idx_database_rows_view ON database_rows(view_id) WHERE deleted_at IS NULL;
```

### 3.2 フィールドタイプの定義

```typescript
// データベースフィールドの型定義
interface FieldType {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiSelect' | 'date' | 
        'checkbox' | 'url' | 'email' | 'phone' | 'formula' | 
        'relation' | 'rollup' | 'createdTime' | 'createdBy' | 
        'lastEditedTime' | 'lastEditedBy' | 'files';
  options?: FieldOptions;
}

interface FieldOptions {
  // Select/MultiSelect
  choices?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  
  // Number
  format?: 'number' | 'currency' | 'percent';
  precision?: number;
  
  // Date
  dateFormat?: string;
  includeTime?: boolean;
  
  // Relation
  relationDatabaseId?: string;
  
  // Formula
  expression?: string;
}
```

## 4. 認証・権限管理

### 4.1 認証フロー

```typescript
// JWT認証の実装例
class AuthService {
  async signUp(data: SignUpDto): Promise<AuthResponse> {
    // 1. バリデーション
    const validated = await this.validateSignUpData(data);
    
    // 2. ユーザー作成
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name
    });
    
    // 3. デフォルトワークスペース作成
    const workspace = await this.workspaceService.createDefault(user.id);
    
    // 4. トークン生成
    const tokens = this.generateTokens(user);
    
    // 5. セッション保存
    await this.saveSession(user.id, tokens.refreshToken);
    
    return {
      user: this.sanitizeUser(user),
      workspace,
      ...tokens
    };
  }

  generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };
    
    return {
      accessToken: this.jwt.sign(payload, { 
        expiresIn: '15m',
        secret: process.env.JWT_ACCESS_SECRET 
      }),
      refreshToken: this.jwt.sign(payload, { 
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET 
      })
    };
  }
}
```

### 4.2 権限管理

```typescript
// 権限チェックの実装
enum Permission {
  // ワークスペースレベル
  WORKSPACE_VIEW = 'workspace:view',
  WORKSPACE_EDIT = 'workspace:edit',
  WORKSPACE_DELETE = 'workspace:delete',
  WORKSPACE_INVITE = 'workspace:invite',
  
  // ビューレベル
  VIEW_CREATE = 'view:create',
  VIEW_READ = 'view:read',
  VIEW_UPDATE = 'view:update',
  VIEW_DELETE = 'view:delete',
  VIEW_SHARE = 'view:share'
}

class PermissionService {
  async checkPermission(
    userId: string,
    resourceId: string,
    permission: Permission
  ): Promise<boolean> {
    // 1. リソースタイプの特定
    const resourceType = this.getResourceType(permission);
    
    // 2. ユーザーのロール取得
    const role = await this.getUserRole(userId, resourceId, resourceType);
    
    // 3. ロールベースの権限チェック
    return this.roleHasPermission(role, permission);
  }
  
  private rolePermissions = {
    owner: [Permission.WORKSPACE_VIEW, Permission.WORKSPACE_EDIT, 
            Permission.WORKSPACE_DELETE, Permission.WORKSPACE_INVITE,
            Permission.VIEW_CREATE, Permission.VIEW_READ, 
            Permission.VIEW_UPDATE, Permission.VIEW_DELETE, 
            Permission.VIEW_SHARE],
    admin: [Permission.WORKSPACE_VIEW, Permission.WORKSPACE_EDIT,
            Permission.WORKSPACE_INVITE, Permission.VIEW_CREATE,
            Permission.VIEW_READ, Permission.VIEW_UPDATE,
            Permission.VIEW_DELETE, Permission.VIEW_SHARE],
    member: [Permission.WORKSPACE_VIEW, Permission.VIEW_CREATE,
             Permission.VIEW_READ, Permission.VIEW_UPDATE],
    guest: [Permission.WORKSPACE_VIEW, Permission.VIEW_READ]
  };
}
```

## 5. ドキュメントエディタ

### 5.1 ブロックベースアーキテクチャ

```typescript
// ブロックの基本構造
interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
  children?: Block[];
  metadata?: BlockMetadata;
}

type BlockType = 
  | 'paragraph' 
  | 'heading_1' | 'heading_2' | 'heading_3'
  | 'bulleted_list_item' | 'numbered_list_item' | 'toggle_list_item'
  | 'to_do' | 'quote' | 'callout' | 'divider'
  | 'code' | 'image' | 'video' | 'file' | 'embed'
  | 'table' | 'column_list' | 'link_to_page'
  | 'synced_block' | 'template_button';

interface BlockContent {
  text?: RichText[];
  checked?: boolean;  // to-do
  language?: string;  // code block
  url?: string;       // image, video, embed
  caption?: RichText[];
}

interface RichText {
  type: 'text' | 'mention' | 'equation';
  text?: {
    content: string;
    link?: { url: string };
  };
  mention?: {
    type: 'user' | 'page' | 'database' | 'date';
    id?: string;
    user?: { id: string; name: string };
    page?: { id: string; title: string };
    date?: { start: string; end?: string };
  };
  equation?: {
    expression: string;
  };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
    background?: string;
  };
}
```

### 5.2 エディタの実装（React + Slate.js）

```tsx
// エディタコンポーネントの実装例
import { Slate, Editable, withReact, useSlate } from 'slate-react';
import { createEditor, Transforms, Editor, Node } from 'slate';
import { withHistory } from 'slate-history';

const NotionEditor: React.FC = () => {
  const [value, setValue] = useState<Node[]>(initialValue);
  const editor = useMemo(
    () => withPlugins(withHistory(withReact(createEditor()))),
    []
  );

  // プラグインシステム
  const withPlugins = (editor: Editor) => {
    const { isInline, isVoid, normalizeNode } = editor;

    // インライン要素の定義
    editor.isInline = (element) => {
      return ['mention', 'link'].includes(element.type) || isInline(element);
    };

    // Void要素の定義
    editor.isVoid = (element) => {
      return ['image', 'video', 'divider'].includes(element.type) || isVoid(element);
    };

    // 正規化ルール
    editor.normalizeNode = (entry) => {
      const [node, path] = entry;

      // ブロックレベルの正規化
      if (Editor.isBlock(editor, node)) {
        // 空のブロックをparagraphに変換
        if (node.children.length === 0) {
          Transforms.setNodes(
            editor,
            { type: 'paragraph' },
            { at: path }
          );
        }
      }

      normalizeNode(entry);
    };

    return editor;
  };

  // スラッシュコマンドの実装
  const handleSlashCommand = useCallback((search: string) => {
    const commands = [
      { title: 'Text', icon: '📝', type: 'paragraph' },
      { title: 'Heading 1', icon: 'H1', type: 'heading_1' },
      { title: 'Heading 2', icon: 'H2', type: 'heading_2' },
      { title: 'Bulleted List', icon: '•', type: 'bulleted_list_item' },
      { title: 'Numbered List', icon: '1.', type: 'numbered_list_item' },
      { title: 'To-do List', icon: '☐', type: 'to_do' },
      { title: 'Toggle List', icon: '▸', type: 'toggle_list_item' },
      { title: 'Quote', icon: '"', type: 'quote' },
      { title: 'Divider', icon: '—', type: 'divider' },
      { title: 'Callout', icon: '💡', type: 'callout' },
      { title: 'Code', icon: '</>', type: 'code' },
      { title: 'Image', icon: '🖼', type: 'image' }
    ];

    return commands.filter(cmd => 
      cmd.title.toLowerCase().includes(search.toLowerCase())
    );
  }, []);

  // レンダリング
  const renderElement = useCallback((props: RenderElementProps) => {
    switch (props.element.type) {
      case 'heading_1':
        return <H1 {...props} />;
      case 'heading_2':
        return <H2 {...props} />;
      case 'paragraph':
        return <Paragraph {...props} />;
      case 'bulleted_list_item':
        return <BulletedListItem {...props} />;
      case 'numbered_list_item':
        return <NumberedListItem {...props} />;
      case 'to_do':
        return <TodoListItem {...props} />;
      case 'quote':
        return <Quote {...props} />;
      case 'code':
        return <CodeBlock {...props} />;
      case 'image':
        return <Image {...props} />;
      case 'divider':
        return <Divider {...props} />;
      default:
        return <Paragraph {...props} />;
    }
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return <Leaf {...props} />;
  }, []);

  return (
    <Slate editor={editor} value={value} onChange={setValue}>
      <Toolbar />
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder="Type '/' for commands"
        onKeyDown={handleKeyDown}
      />
      {showSlashMenu && <SlashCommandMenu commands={slashCommands} />}
    </Slate>
  );
};
```

### 5.3 リアルタイム同期（Yjs実装）

```typescript
// Yjsを使ったリアルタイム同期
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

class CollaborationService {
  private doc: Y.Doc;
  private provider: WebsocketProvider;
  private persistence: IndexeddbPersistence;

  constructor(documentId: string, userId: string) {
    // Yjsドキュメントの初期化
    this.doc = new Y.Doc();
    
    // ローカル永続化
    this.persistence = new IndexeddbPersistence(documentId, this.doc);
    
    // WebSocket接続
    this.provider = new WebsocketProvider(
      process.env.REACT_APP_WS_URL!,
      documentId,
      this.doc,
      {
        params: { userId },
        WebSocketPolyfill: WebSocket
      }
    );

    // Awareness（ユーザープレゼンス）の設定
    this.setupAwareness(userId);
  }

  setupAwareness(userId: string) {
    const awareness = this.provider.awareness;
    
    // 自分の状態を設定
    awareness.setLocalState({
      userId,
      cursor: null,
      selection: null,
      user: {
        name: 'Current User',
        color: this.generateUserColor(userId)
      }
    });

    // 他のユーザーの状態変更を監視
    awareness.on('change', (changes: any) => {
      const states = awareness.getStates();
      this.updateRemoteCursors(states);
    });
  }

  // ドキュメント構造の操作
  getSharedType() {
    return this.doc.getArray<Y.Map<any>>('blocks');
  }

  insertBlock(index: number, block: Block) {
    const yBlock = new Y.Map();
    Object.entries(block).forEach(([key, value]) => {
      yBlock.set(key, value);
    });
    
    this.doc.transact(() => {
      this.getSharedType().insert(index, [yBlock]);
    });
  }

  updateBlock(blockId: string, updates: Partial<Block>) {
    const blocks = this.getSharedType();
    const index = blocks.toArray().findIndex(
      b => b.get('id') === blockId
    );
    
    if (index >= 0) {
      this.doc.transact(() => {
        const block = blocks.get(index);
        Object.entries(updates).forEach(([key, value]) => {
          block.set(key, value);
        });
      });
    }
  }

  // 変更の監視
  observeChanges(callback: (event: Y.YArrayEvent<Y.Map<any>>) => void) {
    this.getSharedType().observe(callback);
  }

  destroy() {
    this.provider.destroy();
    this.persistence.destroy();
    this.doc.destroy();
  }
}
```

## 6. データベースビュー

### 6.1 グリッドビュー（テーブル）

```tsx
// グリッドビューコンポーネント
interface GridViewProps {
  databaseId: string;
  fields: Field[];
  rows: Row[];
  onCellEdit: (rowId: string, fieldId: string, value: any) => void;
}

const GridView: React.FC<GridViewProps> = ({ 
  databaseId, 
  fields, 
  rows, 
  onCellEdit 
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([]);
  const [filterConfig, setFilterConfig] = useState<FilterConfig[]>([]);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  // 仮想スクロールの実装
  const rowVirtualizer = useVirtual({
    size: rows.length,
    parentRef: tableContainerRef,
    estimateSize: useCallback(() => 35, []),
    overscan: 10
  });

  // セル編集の処理
  const handleCellEdit = useCallback((
    rowId: string, 
    fieldId: string, 
    value: any
  ) => {
    // 楽観的更新
    updateLocalState(rowId, fieldId, value);
    
    // サーバーに送信（デバウンス付き）
    debouncedSave(rowId, fieldId, value);
  }, []);

  // フィールドごとのセルレンダラー
  const renderCell = (row: Row, field: Field) => {
    const value = row.cells[field.id];
    
    switch (field.type) {
      case 'text':
        return <TextCell value={value} onChange={handleCellEdit} />;
      case 'number':
        return <NumberCell value={value} field={field} onChange={handleCellEdit} />;
      case 'select':
        return <SelectCell value={value} options={field.options} onChange={handleCellEdit} />;
      case 'multiSelect':
        return <MultiSelectCell value={value} options={field.options} onChange={handleCellEdit} />;
      case 'date':
        return <DateCell value={value} onChange={handleCellEdit} />;
      case 'checkbox':
        return <CheckboxCell value={value} onChange={handleCellEdit} />;
      case 'relation':
        return <RelationCell value={value} field={field} onChange={handleCellEdit} />;
      default:
        return <TextCell value={value} onChange={handleCellEdit} />;
    }
  };

  return (
    <div className="grid-view">
      <div className="grid-header">
        {fields.map(field => (
          <GridHeaderCell 
            key={field.id}
            field={field}
            onSort={handleSort}
            onFilter={handleFilter}
            onResize={handleResize}
          />
        ))}
      </div>
      
      <div ref={tableContainerRef} className="grid-body">
        {rowVirtualizer.virtualItems.map(virtualRow => {
          const row = rows[virtualRow.index];
          return (
            <div 
              key={row.id}
              className="grid-row"
              style={{
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              {fields.map(field => (
                <div key={field.id} className="grid-cell">
                  {renderCell(row, field)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      
      <GridFooter 
        fields={fields}
        rows={rows}
        calculations={calculations}
      />
    </div>
  );
};
```

### 6.2 カンバンビュー

```tsx
// カンバンビューの実装
interface BoardViewProps {
  databaseId: string;
  groupField: Field;
  cards: Card[];
  onCardMove: (cardId: string, newGroupId: string) => void;
}

const BoardView: React.FC<BoardViewProps> = ({ 
  databaseId, 
  groupField, 
  cards, 
  onCardMove 
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  
  // ドラッグ&ドロップの設定
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // カードの移動処理
    moveCard(
      draggableId,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index
    );
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="board-view">
        {groups.map(group => (
          <BoardColumn
            key={group.id}
            group={group}
            cards={cards.filter(card => card.groupId === group.id)}
          />
        ))}
        
        <AddGroupButton onClick={handleAddGroup} />
      </div>
    </DragDropContext>
  );
};

const BoardColumn: React.FC<BoardColumnProps> = ({ group, cards }) => {
  return (
    <div className="board-column">
      <div className="column-header">
        <h3>{group.name}</h3>
        <span className="card-count">{cards.length}</span>
      </div>
      
      <Droppable droppableId={group.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            className={`column-cards ${
              snapshot.isDraggingOver ? 'dragging-over' : ''
            }`}
            {...provided.droppableProps}
          >
            {cards.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`board-card ${
                      snapshot.isDragging ? 'dragging' : ''
                    }`}
                  >
                    <BoardCard card={card} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      
      <AddCardButton groupId={group.id} />
    </div>
  );
};
```

### 6.3 カレンダービュー

```tsx
// カレンダービューの実装
interface CalendarViewProps {
  databaseId: string;
  dateField: Field;
  events: CalendarEvent[];
  onEventMove: (eventId: string, newDate: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  databaseId, 
  dateField, 
  events, 
  onEventMove 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  // カレンダーイベントのレンダリング
  const renderEvent = (event: CalendarEvent) => {
    return (
      <Draggable draggableId={event.id} index={0}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="calendar-event"
            style={{
              backgroundColor: event.color,
              ...provided.draggableProps.style
            }}
          >
            <span className="event-title">{event.title}</span>
            <span className="event-time">{formatTime(event.start)}</span>
          </div>
        )}
      </Draggable>
    );
  };

  // 月表示の実装
  const MonthView = () => {
    const weeks = getWeeksInMonth(currentDate);
    
    return (
      <div className="month-view">
        <div className="weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="week">
            {week.map((day, dayIndex) => (
              <Droppable 
                key={`${weekIndex}-${dayIndex}`} 
                droppableId={day.toISOString()}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`day ${
                      !isSameMonth(day, currentDate) ? 'other-month' : ''
                    } ${isToday(day) ? 'today' : ''} ${
                      snapshot.isDraggingOver ? 'drag-over' : ''
                    }`}
                  >
                    <div className="day-number">{format(day, 'd')}</div>
                    <div className="day-events">
                      {getEventsForDay(events, day).map(event => 
                        renderEvent(event)
                      )}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="calendar-view">
        <CalendarHeader 
          currentDate={currentDate}
          view={view}
          onNavigate={handleNavigate}
          onViewChange={setView}
        />
        
        {view === 'month' && <MonthView />}
        {view === 'week' && <WeekView />}
        {view === 'day' && <DayView />}
        
        <UnscheduledEvents 
          events={events.filter(e => !e.date)}
        />
      </div>
    </DragDropContext>
  );
};
```

## 7. 同期・コラボレーション

### 7.1 CRDTベースの同期アーキテクチャ

```typescript
// 同期サービスの実装
class SyncService {
  private websocket: WebSocket;
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private retryCount: number = 0;

  constructor(private userId: string, private workspaceId: string) {
    this.setupWebSocket();
    this.setupOfflineHandling();
  }

  private setupWebSocket() {
    const wsUrl = `${process.env.REACT_APP_WS_URL}/sync`;
    this.websocket = new WebSocket(wsUrl);

    this.websocket.onopen = () => {
      console.log('WebSocket connected');
      this.authenticate();
      this.syncPendingOperations();
    };

    this.websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleSyncMessage(message);
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleConnectionError();
    };

    this.websocket.onclose = () => {
      console.log('WebSocket disconnected');
      this.scheduleReconnect();
    };
  }

  private authenticate() {
    this.send({
      type: 'auth',
      token: localStorage.getItem('accessToken'),
      workspaceId: this.workspaceId
    });
  }

  private handleSyncMessage(message: SyncMessage) {
    switch (message.type) {
      case 'state-vector':
        this.handleStateVector(message.data);
        break;
      case 'update':
        this.handleUpdate(message.data);
        break;
      case 'awareness':
        this.handleAwareness(message.data);
        break;
      case 'ack':
        this.handleAck(message.data);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  // オフライン対応
  private setupOfflineHandling() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.reconnect();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // ローカルファーストの更新
  async applyLocalUpdate(
    objectId: string, 
    objectType: 'document' | 'database',
    update: Uint8Array
  ) {
    // 1. ローカルストレージに保存
    await this.saveToLocalStorage(objectId, update);
    
    // 2. ローカル状態を更新
    this.applyUpdateToLocalState(objectId, update);
    
    // 3. 同期キューに追加
    const operation: SyncOperation = {
      id: generateId(),
      objectId,
      objectType,
      update,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    this.syncQueue.push(operation);
    
    // 4. オンラインなら即座に同期
    if (this.isOnline && this.websocket.readyState === WebSocket.OPEN) {
      this.syncOperation(operation);
    }
  }

  private async syncOperation(operation: SyncOperation) {
    try {
      this.send({
        type: 'update',
        objectId: operation.objectId,
        objectType: operation.objectType,
        update: Array.from(operation.update),
        operationId: operation.id
      });
      
      operation.status = 'syncing';
    } catch (error) {
      console.error('Sync error:', error);
      operation.status = 'failed';
      operation.retryCount = (operation.retryCount || 0) + 1;
    }
  }

  // 競合解決
  private async resolveConflict(
    localUpdate: Uint8Array,
    remoteUpdate: Uint8Array
  ): Promise<Uint8Array> {
    // YjsのCRDT特性により自動的に競合解決
    const doc = new Y.Doc();
    Y.applyUpdate(doc, localUpdate);
    Y.applyUpdate(doc, remoteUpdate);
    return Y.encodeStateAsUpdate(doc);
  }
}
```

### 7.2 プレゼンス機能

```typescript
// ユーザープレゼンスの管理
interface UserPresence {
  userId: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: CursorPosition;
  selection?: Selection;
  status: 'active' | 'idle' | 'offline';
  lastSeen: Date;
}

class PresenceService {
  private awareness: awarenessProtocol.Awareness;
  private presenceMap: Map<string, UserPresence> = new Map();

  constructor(private doc: Y.Doc) {
    this.awareness = new awarenessProtocol.Awareness(doc);
    this.setupPresence();
  }

  private setupPresence() {
    // 自分のプレゼンス情報を設定
    const localUser = this.getCurrentUser();
    this.awareness.setLocalState({
      user: {
        id: localUser.id,
        name: localUser.name,
        avatar: localUser.avatar,
        color: this.generateUserColor(localUser.id)
      },
      cursor: null,
      selection: null
    });

    // 他のユーザーのプレゼンス変更を監視
    this.awareness.on('change', ({ added, updated, removed }: any) => {
      const allClientIds = [...added, ...updated, ...removed];
      
      allClientIds.forEach(clientId => {
        const state = this.awareness.getStates().get(clientId);
        
        if (state) {
          this.updateUserPresence(clientId, state);
        } else {
          this.removeUserPresence(clientId);
        }
      });
      
      this.notifyPresenceChange();
    });
  }

  // カーソル位置の更新
  updateCursor(position: CursorPosition | null) {
    const currentState = this.awareness.getLocalState();
    this.awareness.setLocalState({
      ...currentState,
      cursor: position
    });
  }

  // 選択範囲の更新
  updateSelection(selection: Selection | null) {
    const currentState = this.awareness.getLocalState();
    this.awareness.setLocalState({
      ...currentState,
      selection
    });
  }

  // アクティブユーザーの取得
  getActiveUsers(): UserPresence[] {
    return Array.from(this.presenceMap.values())
      .filter(user => user.status === 'active');
  }

  // カーソルレンダリング用のコンポーネント
  renderRemoteCursors() {
    return this.getActiveUsers()
      .filter(user => user.cursor)
      .map(user => (
        <RemoteCursor
          key={user.userId}
          position={user.cursor!}
          color={user.color}
          name={user.name}
        />
      ));
  }
}

// リモートカーソルコンポーネント
const RemoteCursor: React.FC<{
  position: CursorPosition;
  color: string;
  name: string;
}> = ({ position, color, name }) => {
  return (
    <div
      className="remote-cursor"
      style={{
        left: position.x,
        top: position.y,
        borderColor: color
      }}
    >
      <div 
        className="cursor-label" 
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  );
};
```

## 8. 実装手順

### 8.1 フェーズ1: 基盤構築（1-2ヶ月）

1. **環境セットアップ**
   ```bash
   # バックエンド
   npx create-nest-app notion-clone-api
   cd notion-clone-api
   npm install @prisma/client prisma bcrypt jsonwebtoken
   npm install @types/bcrypt @types/jsonwebtoken
   
   # フロントエンド
   npx create-react-app notion-clone-web --template typescript
   cd notion-clone-web
   npm install slate slate-react yjs y-websocket
   npm install @dnd-kit/sortable @dnd-kit/core
   ```

2. **データベース設計とマイグレーション**
   ```bash
   npx prisma init
   # schema.prismaを編集
   npx prisma migrate dev --name init
   ```

3. **認証システムの実装**
   - JWT認証の基本実装
   - ユーザー登録/ログイン
   - セッション管理

4. **基本的なワークスペース機能**
   - ワークスペース作成
   - メンバー招待
   - 権限管理

### 8.2 フェーズ2: コア機能（2-3ヶ月）

1. **ドキュメントエディタ**
   - ブロックベースエディタの基本実装
   - 基本的なブロックタイプ（段落、見出し、リスト）
   - インライン装飾（太字、斜体、下線）
   - スラッシュコマンド

2. **階層構造とナビゲーション**
   - ページツリーの実装
   - ドラッグ&ドロップでの並べ替え
   - パンくずナビゲーション
   - サイドバー

3. **基本的なデータベース機能**
   - テーブルビューの実装
   - 基本的なフィールドタイプ（テキスト、数値、選択）
   - インラインセル編集

### 8.3 フェーズ3: 高度な機能（2-3ヶ月）

1. **高度なエディタ機能**
   - メディアブロック（画像、動画）
   - コードブロック（シンタックスハイライト）
   - 数式ブロック
   - インラインメンション

2. **データベースビューの拡張**
   - カンバンビュー
   - カレンダービュー
   - フィルター、ソート機能
   - 高度なフィールドタイプ

3. **リアルタイムコラボレーション**
   - WebSocket接続の実装
   - CRDT同期
   - プレゼンス機能
   - カーソル共有

### 8.4 フェーズ4: 最適化と拡張（1-2ヶ月）

1. **パフォーマンス最適化**
   - 仮想スクロール
   - 遅延読み込み
   - キャッシング戦略
   - バンドルサイズ最適化

2. **検索機能**
   - 全文検索の実装
   - ファジー検索
   - フィルターとファセット

3. **エクスポート/インポート**
   - Markdown エクスポート
   - PDF エクスポート
   - データのインポート

4. **モバイル対応**
   - レスポンシブデザイン
   - タッチ操作の最適化
   - モバイルアプリ（Flutter）

## 9. デプロイメント

### 9.1 Docker化

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: notion
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: notion_clone
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://notion:secret@postgres:5432/notion_clone
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key
    ports:
      - "3000:3000"

  frontend:
    build: ./frontend
    environment:
      REACT_APP_API_URL: http://localhost:3000
      REACT_APP_WS_URL: ws://localhost:3000
    ports:
      - "80:80"

volumes:
  postgres_data:
  redis_data:
```

### 9.2 Kubernetes デプロイメント

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notion-clone-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: notion-clone-api
  template:
    metadata:
      labels:
        app: notion-clone-api
    spec:
      containers:
      - name: api
        image: your-registry/notion-clone-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: notion-clone-api
spec:
  selector:
    app: notion-clone-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

### 9.3 監視とロギング

```typescript
// 監視の実装例
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      controllers: true,
      providers: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: (req, res) => ({
          context: 'HTTP',
        }),
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
  ],
})
export class AppModule {}

// カスタムメトリクス
@Injectable()
export class MetricsService {
  private readonly documentCreatedCounter = new Counter({
    name: 'documents_created_total',
    help: 'Total number of documents created',
    labelNames: ['workspace_id'],
  });

  private readonly apiResponseTime = new Histogram({
    name: 'api_response_time_seconds',
    help: 'API response time in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
  });

  recordDocumentCreated(workspaceId: string) {
    this.documentCreatedCounter.inc({ workspace_id: workspaceId });
  }

  recordApiResponseTime(method: string, route: string, status: number, duration: number) {
    this.apiResponseTime.observe({ method, route, status: status.toString() }, duration);
  }
}
```

## まとめ

このガイドに従って実装することで、Notionのような高機能なコラボレーションツールを構築できます。重要なポイント：

1. **ローカルファースト**: オフラインでも完全に動作し、オンライン時に同期
2. **リアルタイムコラボレーション**: CRDTによる競合のない同時編集
3. **拡張可能な設計**: プラグインシステムによる機能拡張
4. **スケーラブル**: 水平スケーリングに対応した設計
5. **パフォーマンス**: 仮想化と遅延読み込みによる高速化

段階的に実装を進め、各フェーズでテストとフィードバックを重ねることが成功の鍵です。