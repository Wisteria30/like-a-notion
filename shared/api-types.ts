// API共通型定義
// フロントエンドとバックエンドの両方から参照される

// ブロックタイプ
export type BlockType = 
  | 'paragraph' 
  | 'heading_1' 
  | 'heading_2' 
  | 'heading_3'
  | 'bullet_list'
  | 'numbered_list'
  | 'todo'
  | 'quote'
  | 'code'
  | 'image'
  | 'page'
  | 'database';

// ブロックプロパティ型定義
export interface BlockProperties {
  text?: string;
  title?: string;
  checked?: boolean;
  url?: string;
  caption?: string;
  language?: string;
  level?: number;
}

// ブロックモデル（Prismaスキーマと同期）
export interface Block {
  id: string; // UUID
  pageId: string; // 所属ページID
  parentBlockId: string | null; // 親ブロックID
  type: BlockType;
  properties: BlockProperties; // 型定義されたプロパティ
  sortIndex: number; // 並び順
  createdAt: Date;
  updatedAt: Date;
  createdById: string; // ユーザーID
  lastEditedById: string; // ユーザーID
  deletedAt?: Date | null; // 論理削除日時
  childBlocks?: Block[]; // 子ブロック（APIレスポンス用）
}

// ページモデル（Prismaスキーマと同期）
export interface Page {
  id: string; // UUID
  parentPageId: string | null; // 親ページID
  title: string;
  icon?: string | null;
  coverImage?: string | null;
  isDatabase: boolean;
  sortIndex: number; // 並び順
  createdAt: Date;
  updatedAt: Date;
  createdById: string; // ユーザーID
  deletedAt?: Date | null; // 論理削除日時
  childPages?: Page[]; // 子ページ（APIレスポンス用）
  blocks?: Block[]; // ページ内のブロック（APIレスポンス用）
  _count?: {
    childPages?: number;
    blocks?: number;
  };
}

// 権限モデル
export interface PagePermission {
  userId?: string;
  role: 'owner' | 'editor' | 'commenter' | 'viewer';
  grantedAt: Date;
}

// ユーザーモデル
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// WebSocketイベント型
export interface WSMessage {
  type: 'page_updated' | 'block_created' | 'block_updated' | 'block_deleted' | 'user_joined' | 'user_left';
  pageId: string;
  data: any;
  userId?: string;
  timestamp: number;
}

// WebSocketユーザー情報
export interface ConnectedUser {
  id: string;
  name: string;
  socketId: string;
  pageId?: string;
}

// Cursor位置更新
export interface CursorUpdate {
  userId: string;
  userName: string;
  blockId?: string;
  position?: number;
  timestamp: number;
}

// API レスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any; // Zodエラーの詳細
}

// API リクエスト型
export interface CreatePageRequest {
  title: string;
  parentPageId?: string;
  icon?: string;
  coverImage?: string;
}

export interface UpdatePageRequest {
  title?: string;
  icon?: string;
  coverImage?: string;
}

export interface CreateBlockRequest {
  pageId: string;
  type: BlockType;
  properties: BlockProperties;
  parentBlockId?: string;
  afterBlockId?: string;
}

export interface UpdateBlockRequest {
  properties?: BlockProperties;
  sortIndex?: number;
}

// 認証関連
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest extends LoginRequest {
  name: string;
}

// エディタ操作関連
export type BlockOperation = 
  | { type: 'add'; block: Partial<Block>; afterId?: string }
  | { type: 'update'; id: string; properties: Partial<BlockProperties> }
  | { type: 'delete'; id: string }
  | { type: 'move'; id: string; afterId: string | null; parentId: string | null }
  | { type: 'indent'; id: string; direction: 'increase' | 'decrease' }
  | { type: 'turnInto'; id: string; newType: BlockType };

// トランザクション
export interface Transaction {
  id: string;
  operations: BlockOperation[];
  timestamp: Date;
  userId: string;
}

// モックAPI用
export interface MockStore {
  pages: Map<string, Page>;
  blocks: Map<string, Block>;
  transactions: Transaction[];
}