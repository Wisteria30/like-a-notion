import { Router } from 'express';
import { PagesController } from '../controllers/pages.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const pagesController = new PagesController();

// GET /api/pages - Get all top-level pages
router.get('/', asyncHandler(pagesController.getPages.bind(pagesController)));

// GET /api/pages/:id - Get page by ID
router.get('/:id', asyncHandler(pagesController.getPageById.bind(pagesController)));

// POST /api/pages - Create new page
router.post('/', asyncHandler(pagesController.createPage.bind(pagesController)));

// PUT /api/pages/:id - Update page
router.put('/:id', asyncHandler(pagesController.updatePage.bind(pagesController)));

// DELETE /api/pages/:id - Delete page
router.delete('/:id', asyncHandler(pagesController.deletePage.bind(pagesController)));

// GET /api/pages/:id/blocks - Get all blocks in a page
router.get('/:id/blocks', asyncHandler(pagesController.getPageBlocks.bind(pagesController)));

export default router;