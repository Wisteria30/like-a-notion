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

// ブロックモデル
export interface Block {
  id: string; // UUID
  type: BlockType;
  properties: Record<string, any>; // JSONプロパティ
  content: string[]; // 子ブロックIDの配列
  parentId: string | null; // 親ブロックID
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // ユーザーID
  lastEditedBy: string; // ユーザーID
}

// ページモデル（Blockの拡張）
export interface Page extends Block {
  type: 'page';
  title: string;
  icon?: string;
  coverImage?: string;
  isPublic: boolean;
  permissions: PagePermission[];
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
  avatarUrl?: string;
  workspaceRole: 'owner' | 'member' | 'guest';
  createdAt: Date;
}

// WebSocketイベント型
export interface WSMessage {
  type: 'block:update' | 'block:delete' | 'cursor:update' | 'presence:update';
  payload: any;
  userId: string;
  timestamp: Date;
}

// API レスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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