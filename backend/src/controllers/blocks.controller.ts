import { Request, Response } from 'express';
import { CreateBlockSchema, UpdateBlockSchema } from '../types/api';
import { ApiError } from '../middlewares/errorHandler';
import { BlockService } from '../services/blockService';
import { WebSocketService } from '../services/websocketService';

export class BlocksController {
  private blockService = new BlockService();

  // POST /api/blocks - Create new block
  async createBlock(req: Request, res: Response): Promise<void> {
    const data = CreateBlockSchema.parse(req.body);

    try {
      const block = await this.blockService.createBlock({
        ...data,
        createdById: 'default-user-id', // M1: Still using fixed user
      });

      // Broadcast block creation via WebSocket
      const wsService = req.app.get('wsService') as WebSocketService;
      if (wsService) {
        wsService.broadcastBlockCreated(data.pageId, block, 'default-user-id');
      }

      res.status(201).json({
        success: true,
        data: block,
      });
    } catch (error) {
      const apiError: ApiError = new Error((error as Error).message);
      apiError.statusCode = 404;
      throw apiError;
    }
  }

  // PUT /api/blocks/:id - Update block
  async updateBlock(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const data = UpdateBlockSchema.parse(req.body);

    try {
      const updatedBlock = await this.blockService.updateBlock(id, data, 'default-user-id');

      // Get page ID for WebSocket broadcast
      const block = await this.blockService.getBlockById(id);
      
      // Broadcast block update via WebSocket
      const wsService = req.app.get('wsService') as WebSocketService;
      if (wsService) {
        wsService.broadcastBlockUpdated(block.pageId, updatedBlock, 'default-user-id');
      }

      res.json({
        success: true,
        data: updatedBlock,
      });
    } catch (error) {
      const apiError: ApiError = new Error('Block not found');
      apiError.statusCode = 404;
      throw apiError;
    }
  }

  // DELETE /api/blocks/:id - Delete block
  async deleteBlock(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      // Get block info before deletion for WebSocket broadcast
      const block = await this.blockService.getBlockById(id);
      const pageId = block.pageId;

      const result = await this.blockService.deleteBlock(id);

      // Broadcast block deletion via WebSocket
      const wsService = req.app.get('wsService') as WebSocketService;
      if (wsService) {
        wsService.broadcastBlockDeleted(pageId, id, 'default-user-id');
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const apiError: ApiError = new Error('Block not found');
      apiError.statusCode = 404;
      throw apiError;
    }
  }
}