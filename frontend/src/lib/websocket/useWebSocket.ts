import { useEffect, useRef, useCallback } from 'react';
import { WebSocketClient, WebSocketEventHandlers, getWebSocketClient } from './client';

export interface UseWebSocketOptions {
  userId: string;
  userName: string;
  pageId?: string;
  serverUrl?: string;
  autoConnect?: boolean;
  handlers?: WebSocketEventHandlers;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  joinPage: (pageId: string) => void;
  leavePage: (pageId: string) => void;
  sendBlockOperation: (operation: { type: string; data: unknown }) => void;
  updateCursor: (blockId?: string, position?: number) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { 
    userId, 
    userName, 
    pageId, 
    serverUrl,
    autoConnect = true,
    handlers = {}
  } = options;

  const clientRef = useRef<WebSocketClient | null>(null);
  const isConnectedRef = useRef(false);

  // Initialize client
  useEffect(() => {
    if (!userId || !userName) return;

    try {
      const client = getWebSocketClient(userId, userName);
      clientRef.current = client;

      // Set handlers
      client.setHandlers({
        ...handlers,
        onConnect: () => {
          isConnectedRef.current = true;
          handlers.onConnect?.();
        },
        onDisconnect: () => {
          isConnectedRef.current = false;
          handlers.onDisconnect?.();
        },
      });

      // Auto connect if enabled
      if (autoConnect && !client.isConnected()) {
        client.connect(serverUrl);
      }
    } catch (error) {
      console.error('Failed to initialize WebSocket client:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userName, serverUrl, autoConnect]);

  // Update handlers when they change
  useEffect(() => {
    if (clientRef.current) {
      clientRef.current.setHandlers({
        ...handlers,
        onConnect: () => {
          isConnectedRef.current = true;
          handlers.onConnect?.();
        },
        onDisconnect: () => {
          isConnectedRef.current = false;
          handlers.onDisconnect?.();
        },
      });
    }
  }, [handlers]);

  // Auto join/leave page
  useEffect(() => {
    if (pageId && clientRef.current?.isConnected()) {
      clientRef.current.joinPage(pageId);
      
      return () => {
        clientRef.current?.leavePage(pageId);
      };
    }
  }, [pageId]);

  // API methods
  const joinPage = useCallback((pageId: string) => {
    clientRef.current?.joinPage(pageId);
  }, []);

  const leavePage = useCallback((pageId: string) => {
    clientRef.current?.leavePage(pageId);
  }, []);

  const sendBlockOperation = useCallback((operation: { type: string; data: unknown }) => {
    clientRef.current?.sendBlockOperation(operation);
  }, []);

  const updateCursor = useCallback((blockId?: string, position?: number) => {
    clientRef.current?.updateCursor(blockId, position);
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  const reconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current.connect(serverUrl);
    }
  }, [serverUrl]);

  return {
    isConnected: clientRef.current?.isConnected() ?? false,
    joinPage,
    leavePage,
    sendBlockOperation,
    updateCursor,
    disconnect,
    reconnect,
  };
}