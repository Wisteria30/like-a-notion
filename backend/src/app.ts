import express from 'express';
import helmet from 'helmet';
import corsMiddleware from './middlewares/cors';
import { errorHandler } from './middlewares/errorHandler';
import pagesRouter from './routes/pages';
import blocksRouter from './routes/blocks';

export const createApp = () => {
  const app = express();

  // Middlewares
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mock WebSocket service for testing
  if (process.env.NODE_ENV === 'test') {
    const mockWsService = {
      broadcastPageUpdate: () => {},
      broadcastBlockCreated: () => {},
      broadcastBlockUpdated: () => {},
      broadcastBlockDeleted: () => {},
    };
    app.set('wsService', mockWsService);
  }

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/pages', pagesRouter);
  app.use('/api/blocks', blocksRouter);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};