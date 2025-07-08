export type BlockType = 'paragraph' | 'heading_1' | 'heading_2' | 'heading_3' | 'bullet_list' | 'numbered_list' | 'todo' | 'quote' | 'code' | 'image' | 'page' | 'database';
export interface BlockProperties {
    text?: string;
    title?: string;
    checked?: boolean;
    url?: string;
    caption?: string;
    language?: string;
    level?: number;
}
export interface Block {
    id: string;
    type: BlockType;
    properties: BlockProperties;
    content: string[];
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    lastEditedBy: string;
    indent?: number;
}
export interface Page extends Block {
    type: 'page';
    title: string;
    icon?: string;
    coverImage?: string;
    isPublic: boolean;
    permissions: PagePermission[];
}
export interface PagePermission {
    userId?: string;
    role: 'owner' | 'editor' | 'commenter' | 'viewer';
    grantedAt: Date;
}
export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    workspaceRole: 'owner' | 'member' | 'guest';
    createdAt: Date;
}
export interface WSMessage {
    type: 'block:update' | 'block:delete' | 'cursor:update' | 'presence:update';
    payload: any;
    userId: string;
    timestamp: Date;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
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
export type BlockOperation = {
    type: 'add';
    block: Partial<Block>;
    afterId?: string;
} | {
    type: 'update';
    id: string;
    properties: Partial<BlockProperties>;
} | {
    type: 'delete';
    id: string;
} | {
    type: 'move';
    id: string;
    afterId: string | null;
    parentId: string | null;
} | {
    type: 'indent';
    id: string;
    direction: 'increase' | 'decrease';
} | {
    type: 'turnInto';
    id: string;
    newType: BlockType;
};
export interface Transaction {
    id: string;
    operations: BlockOperation[];
    timestamp: Date;
    userId: string;
}
export interface MockStore {
    pages: Map<string, Page>;
    blocks: Map<string, Block>;
    transactions: Transaction[];
}
//# sourceMappingURL=api-types.d.ts.map