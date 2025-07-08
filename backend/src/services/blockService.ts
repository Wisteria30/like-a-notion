import { prisma } from '../config/database';
import { Block, Prisma } from '@prisma/client';

export interface CreateBlockData {
  pageId: string;
  type: string;
  properties: Record<string, any>;
  parentBlockId?: string;
  afterBlockId?: string;
  createdById: string;
}

export interface UpdateBlockData {
  properties?: Record<string, any>;
  sortIndex?: number;
}

export class BlockService {

  // Create a new block
  async createBlock(data: CreateBlockData) {
    // Verify page exists and is not deleted
    const page = await prisma.page.findUnique({
      where: { 
        id: data.pageId,
        deletedAt: null 
      },
    });

    if (!page) {
      throw new Error('Page not found');
    }

    // Calculate sort index
    let sortIndex = 0;
    
    if (data.afterBlockId) {
      // Insert after specific block
      const afterBlock = await prisma.block.findUnique({
        where: { 
          id: data.afterBlockId,
          deletedAt: null
        },
      });

      if (!afterBlock) {
        throw new Error('Reference block not found');
      }

      // Set new block's sortIndex to be after the reference block
      sortIndex = afterBlock.sortIndex + 1;

      // Increment sort indices of all subsequent blocks
      await prisma.block.updateMany({
        where: {
          pageId: data.pageId,
          parentBlockId: data.parentBlockId || null,
          deletedAt: null,
          sortIndex: {
            gte: sortIndex,
          },
        },
        data: {
          sortIndex: {
            increment: 1,
          },
        },
      });
    } else {
      // Add to the end
      const lastBlock = await prisma.block.findFirst({
        where: {
          pageId: data.pageId,
          parentBlockId: data.parentBlockId ?? null,
          deletedAt: null,
        },
        orderBy: {
          sortIndex: 'desc',
        },
      });
      sortIndex = (lastBlock?.sortIndex ?? -1) + 1;
    }

    return prisma.block.create({
      data: {
        pageId: data.pageId,
        type: data.type,
        properties: data.properties,
        parentBlockId: data.parentBlockId,
        sortIndex,
        createdById: data.createdById,
        lastEditedById: data.createdById,
      },
    });
  }

  // Get block by ID
  async getBlockById(id: string) {
    const block = await prisma.block.findUnique({
      where: { 
        id,
        deletedAt: null 
      },
      include: {
        childBlocks: {
          where: { deletedAt: null },
          orderBy: { sortIndex: 'asc' },
        },
      },
    });

    if (!block) {
      throw new Error('Block not found');
    }

    return block;
  }

  // Update a block
  async updateBlock(id: string, data: UpdateBlockData, userId: string) {
    const block = await prisma.block.findUnique({
      where: { 
        id,
        deletedAt: null 
      },
    });

    if (!block) {
      throw new Error('Block not found');
    }

    return prisma.block.update({
      where: { id },
      data: {
        ...data,
        lastEditedById: userId,
        updatedAt: new Date(),
      },
    });
  }

  // Soft delete a block and all its children
  async deleteBlock(id: string) {
    const block = await prisma.block.findUnique({
      where: { 
        id,
        deletedAt: null 
      },
      include: {
        childBlocks: {
          where: { deletedAt: null }
        },
      },
    });

    if (!block) {
      throw new Error('Block not found');
    }

    const now = new Date();

    return prisma.$transaction(async (tx) => {
      // Soft delete all child blocks recursively
      await this.deleteBlockRecursive(tx, id, now);

      // Update sort indices of subsequent blocks
      await tx.block.updateMany({
        where: {
          pageId: block.pageId,
          parentBlockId: block.parentBlockId,
          deletedAt: null,
          sortIndex: {
            gt: block.sortIndex,
          },
        },
        data: {
          sortIndex: {
            decrement: 1,
          },
        },
      });

      return { id };
    });
  }

  // Recursive helper for soft deleting blocks
  private async deleteBlockRecursive(
    tx: Prisma.TransactionClient,
    blockId: string,
    deletedAt: Date
  ) {
    // Get all child blocks
    const childBlocks = await tx.block.findMany({
      where: { 
        parentBlockId: blockId,
        deletedAt: null
      },
      select: { id: true },
    });

    // Recursively delete child blocks
    for (const child of childBlocks) {
      await this.deleteBlockRecursive(tx, child.id, deletedAt);
    }

    // Soft delete all child blocks
    if (childBlocks.length > 0) {
      await tx.block.updateMany({
        where: { 
          parentBlockId: blockId,
          deletedAt: null
        },
        data: { deletedAt },
      });
    }

    // Soft delete the block itself
    await tx.block.update({
      where: { id: blockId },
      data: { deletedAt },
    });
  }

  // Move block to different parent or reorder
  async moveBlock(
    blockId: string, 
    newParentBlockId: string | null, 
    afterBlockId?: string
  ) {
    const block = await prisma.block.findUnique({
      where: { 
        id: blockId,
        deletedAt: null 
      },
    });

    if (!block) {
      throw new Error('Block not found');
    }

    // Get siblings in the new parent context
    const siblings = await prisma.block.findMany({
      where: {
        pageId: block.pageId,
        parentBlockId: newParentBlockId,
        deletedAt: null,
        NOT: { id: blockId },
      },
      orderBy: { sortIndex: 'asc' },
    });

    // Calculate new sort index
    let newSortIndex = 0;
    if (afterBlockId) {
      const afterIndex = siblings.findIndex(s => s.id === afterBlockId);
      if (afterIndex === -1) {
        throw new Error('Reference block not found');
      }
      
      const nextSibling = siblings[afterIndex + 1];
      if (nextSibling) {
        newSortIndex = (siblings[afterIndex].sortIndex + nextSibling.sortIndex) / 2;
      } else {
        newSortIndex = siblings[afterIndex].sortIndex + 1000;
      }
    } else if (siblings.length > 0) {
      newSortIndex = siblings[0].sortIndex / 2;
    }

    return prisma.block.update({
      where: { id: blockId },
      data: {
        parentBlockId: newParentBlockId,
        sortIndex: newSortIndex,
      },
    });
  }

  // Get block tree for a page
  async getBlockTree(pageId: string): Promise<Block[]> {
    const blocks = await prisma.block.findMany({
      where: {
        pageId,
        deletedAt: null,
      },
      orderBy: {
        sortIndex: 'asc',
      },
    });

    // Build tree structure
    const blockMap = new Map(blocks.map(b => [b.id, { ...b, childBlocks: [] as any[] }]));
    const rootBlocks: any[] = [];

    blocks.forEach(block => {
      const blockWithChildren = blockMap.get(block.id)!;
      
      if (block.parentBlockId) {
        const parent = blockMap.get(block.parentBlockId);
        if (parent) {
          parent.childBlocks.push(blockWithChildren);
        }
      } else {
        rootBlocks.push(blockWithChildren);
      }
    });

    return rootBlocks;
  }

  // Duplicate a block (and optionally its children)
  async duplicateBlock(blockId: string, includeChildren = true) {
    const block = await prisma.block.findUnique({
      where: { 
        id: blockId,
        deletedAt: null 
      },
      include: {
        childBlocks: includeChildren ? {
          where: { deletedAt: null },
          orderBy: { sortIndex: 'asc' },
        } : false,
      },
    });

    if (!block) {
      throw new Error('Block not found');
    }

    return prisma.$transaction(async (tx) => {
      // Create duplicate of the main block
      const duplicatedBlock = await tx.block.create({
        data: {
          pageId: block.pageId,
          parentBlockId: block.parentBlockId,
          type: block.type,
          properties: block.properties as Prisma.InputJsonValue,
          sortIndex: block.sortIndex + 1,
          createdById: block.createdById,
          lastEditedById: block.lastEditedById,
        },
      });

      // Update sort indices of subsequent blocks
      await tx.block.updateMany({
        where: {
          pageId: block.pageId,
          parentBlockId: block.parentBlockId,
          deletedAt: null,
          sortIndex: {
            gt: block.sortIndex,
          },
          NOT: {
            id: duplicatedBlock.id,
          },
        },
        data: {
          sortIndex: {
            increment: 1,
          },
        },
      });

      // Duplicate child blocks if requested
      if (includeChildren && 'childBlocks' in block && block.childBlocks.length > 0) {
        await this.duplicateChildBlocks(tx, block.childBlocks, duplicatedBlock.id, block.pageId);
      }

      return duplicatedBlock;
    });
  }

  // Helper method to recursively duplicate child blocks
  private async duplicateChildBlocks(
    tx: Prisma.TransactionClient,
    childBlocks: any[],
    newParentId: string,
    pageId: string
  ) {
    for (const child of childBlocks) {
      const duplicatedChild = await tx.block.create({
        data: {
          pageId,
          parentBlockId: newParentId,
          type: child.type,
          properties: child.properties as Prisma.InputJsonValue,
          sortIndex: child.sortIndex,
          createdById: child.createdById,
          lastEditedById: child.lastEditedById,
        },
      });

      // Recursively duplicate grandchildren
      if (child.childBlocks && child.childBlocks.length > 0) {
        await this.duplicateChildBlocks(tx, child.childBlocks, duplicatedChild.id, pageId);
      }
    }
  }
}