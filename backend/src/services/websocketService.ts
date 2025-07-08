import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

export interface WSMessage {
  type: 'page_updated' | 'block_created' | 'block_updated' | 'block_deleted' | 'user_joined' | 'user_left';
  pageId: string;
  data: any;
  userId?: string;
  timestamp: number;
}

export interface ConnectedUser {
  id: string;
  name: string;
  socketId: string;
  pageId?: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, ConnectedUser>();
  private pageRooms = new Map<string, Set<string>>();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupEventHandlers();
    logger.info('WebSocket server initialized');
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Handle user authentication/identification
      socket.on('authenticate', (userData: { userId: string; name: string }) => {
        this.handleUserAuthentication(socket, userData);
      });

      // Handle joining a page room
      socket.on('join_page', (pageId: string) => {
        this.handleJoinPage(socket, pageId);
      });

      // Handle leaving a page room
      socket.on('leave_page', (pageId: string) => {
        this.handleLeavePage(socket, pageId);
      });

      // Handle real-time block operations
      socket.on('block_operation', (operation: any) => {
        this.handleBlockOperation(socket, operation);
      });

      // Handle cursor position updates
      socket.on('cursor_update', (data: { pageId: string; blockId?: string; position?: number }) => {
        this.handleCursorUpdate(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleUserAuthentication(socket: Socket, userData: { userId: string; name: string }) {
    const user: ConnectedUser = {
      id: userData.userId,
      name: userData.name,
      socketId: socket.id
    };

    this.connectedUsers.set(socket.id, user);
    socket.data.user = user;

    logger.info(`User authenticated: ${userData.name} (${userData.userId})`);
  }

  private handleJoinPage(socket: Socket, pageId: string) {
    if (!socket.data.user) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    // Leave previous page if any
    if (socket.data.user.pageId) {
      this.handleLeavePage(socket, socket.data.user.pageId);
    }

    // Join new page room
    socket.join(`page:${pageId}`);
    socket.data.user.pageId = pageId;

    // Track users in this page
    if (!this.pageRooms.has(pageId)) {
      this.pageRooms.set(pageId, new Set());
    }
    this.pageRooms.get(pageId)!.add(socket.id);

    // Get current users in the page
    const usersInPage = this.getUsersInPage(pageId);

    // Notify other users that this user joined
    socket.to(`page:${pageId}`).emit('user_joined', {
      user: socket.data.user,
      usersInPage: usersInPage.length
    });

    // Send current users to the newly joined user
    socket.emit('page_users', { users: usersInPage });

    logger.info(`User ${socket.data.user.name} joined page ${pageId}`);
  }

  private handleLeavePage(socket: Socket, pageId: string) {
    if (!socket.data.user) return;

    socket.leave(`page:${pageId}`);
    
    // Remove from page users tracking
    if (this.pageRooms.has(pageId)) {
      this.pageRooms.get(pageId)!.delete(socket.id);
      
      // Clean up empty page rooms
      if (this.pageRooms.get(pageId)!.size === 0) {
        this.pageRooms.delete(pageId);
      }
    }

    // Notify other users that this user left
    socket.to(`page:${pageId}`).emit('user_left', {
      user: socket.data.user,
      usersInPage: this.getUsersInPage(pageId).length
    });

    socket.data.user.pageId = undefined;
    logger.info(`User ${socket.data.user.name} left page ${pageId}`);
  }

  private handleBlockOperation(socket: Socket, operation: any) {
    if (!socket.data.user || !socket.data.user.pageId) {
      socket.emit('error', { message: 'Must join a page first' });
      return;
    }

    const pageId = socket.data.user.pageId;
    
    // Create standardized message
    const message: WSMessage = {
      type: operation.type,
      pageId,
      data: operation.data,
      userId: socket.data.user.id,
      timestamp: Date.now()
    };

    // Broadcast to all other users in the same page
    socket.to(`page:${pageId}`).emit('block_operation', message);

    logger.info(`Block operation ${operation.type} in page ${pageId} by user ${socket.data.user.name}`);
  }

  private handleCursorUpdate(socket: Socket, data: { pageId: string; blockId?: string; position?: number }) {
    if (!socket.data.user) return;

    // Broadcast cursor position to other users in the same page
    socket.to(`page:${data.pageId}`).emit('cursor_update', {
      userId: socket.data.user.id,
      userName: socket.data.user.name,
      blockId: data.blockId,
      position: data.position,
      timestamp: Date.now()
    });
  }

  private handleDisconnect(socket: Socket) {
    const user = socket.data.user;
    if (!user) return;

    // Leave current page if any
    if (user.pageId) {
      this.handleLeavePage(socket, user.pageId);
    }

    // Remove from connected users
    this.connectedUsers.delete(socket.id);

    logger.info(`User ${user.name} disconnected`);
  }

  private getUsersInPage(pageId: string): ConnectedUser[] {
    const userSockets = this.pageRooms.get(pageId) || new Set();
    const users: ConnectedUser[] = [];

    for (const socketId of userSockets) {
      const user = this.connectedUsers.get(socketId);
      if (user) {
        users.push(user);
      }
    }

    return users;
  }

  // Public methods for broadcasting from API endpoints

  public broadcastPageUpdate(pageId: string, data: any, excludeUserId?: string) {
    const message: WSMessage = {
      type: 'page_updated',
      pageId,
      data,
      userId: excludeUserId,
      timestamp: Date.now()
    };

    this.io.to(`page:${pageId}`).emit('page_updated', message);
  }

  public broadcastBlockCreated(pageId: string, block: any, userId?: string) {
    const message: WSMessage = {
      type: 'block_created',
      pageId,
      data: block,
      userId,
      timestamp: Date.now()
    };

    this.io.to(`page:${pageId}`).emit('block_created', message);
  }

  public broadcastBlockUpdated(pageId: string, block: any, userId?: string) {
    const message: WSMessage = {
      type: 'block_updated',
      pageId,
      data: block,
      userId,
      timestamp: Date.now()
    };

    this.io.to(`page:${pageId}`).emit('block_updated', message);
  }

  public broadcastBlockDeleted(pageId: string, blockId: string, userId?: string) {
    const message: WSMessage = {
      type: 'block_deleted',
      pageId,
      data: { id: blockId },
      userId,
      timestamp: Date.now()
    };

    this.io.to(`page:${pageId}`).emit('block_deleted', message);
  }

  // Get statistics
  public getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      activePages: this.pageRooms.size,
      pageRooms: Array.from(this.pageRooms.entries()).map(([pageId, users]) => ({
        pageId,
        userCount: users.size
      }))
    };
  }

  // Cleanup method
  public close() {
    this.io.close();
    this.connectedUsers.clear();
    this.pageRooms.clear();
    logger.info('WebSocket server closed');
  }
}