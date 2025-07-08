import { Router } from 'express';
import { BlocksController } from '../controllers/blocks.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const blocksController = new BlocksController();

// POST /api/blocks - Create new block
router.post('/', asyncHandler(blocksController.createBlock.bind(blocksController)));

// PUT /api/blocks/:id - Update block
router.put('/:id', asyncHandler(blocksController.updateBlock.bind(blocksController)));

// DELETE /api/blocks/:id - Delete block
router.delete('/:id', asyncHandler(blocksController.deleteBlock.bind(blocksController)));

export default router;