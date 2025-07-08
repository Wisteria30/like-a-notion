import { Request, Response } from 'express';
import { CreatePageSchema, UpdatePageSchema } from '../types/api';
import { ApiError } from '../middlewares/errorHandler';
import { PageService } from '../services/pageService';
import { WebSocketService } from '../services/websocketService';

export class PagesController {
  private pageService = new PageService();

  // GET /api/pages - Get all top-level pages
  async getPages(req: Request, res: Response): Promise<void> {
    const pages = await this.pageService.getTopLevelPages();

    res.json({
      success: true,
      data: pages,
    });
  }

  // GET /api/pages/:id - Get page by ID
  async getPageById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const page = await this.pageService.getPageById(id);
      
      res.json({
        success: true,
        data: page,
      });
    } catch (error) {
      const apiError: ApiError = new Error('Page not found');
      apiError.statusCode = 404;
      throw apiError;
    }
  }

  // POST /api/pages - Create new page
  async createPage(req: Request, res: Response): Promise<void> {
    const data = CreatePageSchema.parse(req.body);
    
    const page = await this.pageService.createPage({
      ...data,
      createdById: 'default-user-id', // M1: Still using fixed user
    });

    // Get WebSocket service and broadcast page creation
    const wsService = req.app.get('wsService') as WebSocketService;
    if (wsService && data.parentPageId) {
      wsService.broadcastPageUpdate(data.parentPageId, {
        type: 'child_page_created',
        page
      });
    }

    res.status(201).json({
      success: true,
      data: page,
    });
  }

  // PUT /api/pages/:id - Update page
  async updatePage(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const data = UpdatePageSchema.parse(req.body);

    try {
      const page = await this.pageService.updatePage(id, data);

      // Broadcast page update via WebSocket
      const wsService = req.app.get('wsService') as WebSocketService;
      if (wsService) {
        wsService.broadcastPageUpdate(id, {
          type: 'page_updated',
          page
        });
      }

      res.json({
        success: true,
        data: page,
      });
    } catch (error) {
      const apiError: ApiError = new Error('Page not found');
      apiError.statusCode = 404;
      throw apiError;
    }
  }

  // DELETE /api/pages/:id - Delete page
  async deletePage(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      await this.pageService.deletePage(id);

      // Broadcast page deletion via WebSocket
      const wsService = req.app.get('wsService') as WebSocketService;
      if (wsService) {
        wsService.broadcastPageUpdate(id, {
          type: 'page_deleted',
          pageId: id
        });
      }

      res.json({
        success: true,
        data: { id },
      });
    } catch (error) {
      const apiError: ApiError = new Error('Page not found');
      apiError.statusCode = 404;
      throw apiError;
    }
  }

  // GET /api/pages/:id/blocks - Get all blocks in a page
  async getPageBlocks(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const blocks = await this.pageService.getPageBlocks(id);

      res.json({
        success: true,
        data: blocks,
      });
    } catch (error) {
      const apiError: ApiError = new Error('Page not found');
      apiError.statusCode = 404;
      throw apiError;
    }
  }
}