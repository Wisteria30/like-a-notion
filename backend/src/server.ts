import dotenv from 'dotenv';
import { createServer } from 'http';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { WebSocketService } from './services/websocketService';

// Load environment variables
dotenv.config();

// Start server
async function startServer() {
  try {
    await connectDatabase();
    
    // Create Express app
    const app = createApp();
    
    // Create HTTP server
    const httpServer = createServer(app);
    
    // Initialize WebSocket service
    const wsService = new WebSocketService(httpServer);
    
    // Make WebSocket service available to the app
    app.set('wsService', wsService);
    
    const PORT = process.env.PORT || 3001;
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket server ready`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const shutdownHandler = () => {
      console.log('Shutdown signal received, closing gracefully');
      wsService.close();
      httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdownHandler);
    process.on('SIGINT', shutdownHandler);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();