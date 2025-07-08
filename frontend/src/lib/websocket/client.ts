import { io, Socket } from 'socket.io-client';
import { WSMessage, ConnectedUser, CursorUpdate } from '@shared/api-types';

export interface WebSocketEventHandlers {
  onPageUpdated?: (message: WSMessage) => void;
  onBlockCreated?: (message: WSMessage) => void;
  onBlockUpdated?: (message: WSMessage) => void;
  onBlockDeleted?: (message: WSMessage) => void;
  onUserJoined?: (data: { user: ConnectedUser; usersInPage: number }) => void;
  onUserLeft?: (data: { user: ConnectedUser; usersInPage: number }) => void;
  onPageUsers?: (data: { users: ConnectedUser[] }) => void;
  onCursorUpdate?: (data: CursorUpdate) => void;
  onError?: (error: { message: string }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private currentPageId: string | null = null;
  private userId: string;
  private userName: string;
  private handlers: WebSocketEventHandlers = {};

  constructor(userId: string, userName: string) {
    this.userId = userId;
    this.userName = userName;
  }

  connect(serverUrl?: string): void {
    if (this.socket?.connected) {
      // WebSocket already connected
      return;
    }

    const url = serverUrl || process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      // WebSocket connected
      this.authenticate();
      this.handlers.onConnect?.();
    });

    this.socket.on('disconnect', () => {
      // WebSocket disconnected
      this.handlers.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Page events
    this.socket.on('page_updated', (message: WSMessage) => {
      this.handlers.onPageUpdated?.(message);
    });

    // Block events
    this.socket.on('block_created', (message: WSMessage) => {
      this.handlers.onBlockCreated?.(message);
    });

    this.socket.on('block_updated', (message: WSMessage) => {
      this.handlers.onBlockUpdated?.(message);
    });

    this.socket.on('block_deleted', (message: WSMessage) => {
      this.handlers.onBlockDeleted?.(message);
    });

    // User events
    this.socket.on('user_joined', (data: { user: ConnectedUser; usersInPage: number }) => {
      this.handlers.onUserJoined?.(data);
    });

    this.socket.on('user_left', (data: { user: ConnectedUser; usersInPage: number }) => {
      this.handlers.onUserLeft?.(data);
    });

    this.socket.on('page_users', (data: { users: ConnectedUser[] }) => {
      this.handlers.onPageUsers?.(data);
    });

    // Cursor events
    this.socket.on('cursor_update', (data: CursorUpdate) => {
      this.handlers.onCursorUpdate?.(data);
    });

    // Error events
    this.socket.on('error', (error: { message: string }) => {
      console.error('WebSocket error:', error);
      this.handlers.onError?.(error);
    });
  }

  private authenticate(): void {
    if (!this.socket) return;

    this.socket.emit('authenticate', {
      userId: this.userId,
      name: this.userName,
    });
  }

  joinPage(pageId: string): void {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.currentPageId = pageId;
    this.socket.emit('join_page', pageId);
  }

  leavePage(pageId: string): void {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.emit('leave_page', pageId);
    if (this.currentPageId === pageId) {
      this.currentPageId = null;
    }
  }

  sendBlockOperation(operation: { type: string; data: unknown }): void {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    if (!this.currentPageId) {
      console.error('Must join a page first');
      return;
    }

    this.socket.emit('block_operation', operation);
  }

  updateCursor(blockId?: string, position?: number): void {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    if (!this.currentPageId) {
      console.error('Must join a page first');
      return;
    }

    this.socket.emit('cursor_update', {
      pageId: this.currentPageId,
      blockId,
      position,
    });
  }

  setHandlers(handlers: WebSocketEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentPageId = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getCurrentPageId(): string | null {
    return this.currentPageId;
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(userId?: string, userName?: string): WebSocketClient {
  if (!wsClient && userId && userName) {
    wsClient = new WebSocketClient(userId, userName);
  }
  
  if (!wsClient) {
    throw new Error('WebSocket client not initialized. Please provide userId and userName.');
  }
  
  return wsClient;
}

export function resetWebSocketClient(): void {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
}