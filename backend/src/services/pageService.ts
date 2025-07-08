import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export interface CreatePageData {
  title: string;
  parentPageId?: string;
  icon?: string;
  coverImage?: string;
  createdById: string;
}

export interface UpdatePageData {
  title?: string;
  icon?: string;
  coverImage?: string;
}

export class PageService {
  
  // Get all top-level pages (not deleted)
  async getTopLevelPages() {
    return prisma.page.findMany({
      where: {
        parentPageId: null,
        deletedAt: null,
      },
      orderBy: {
        sortIndex: 'asc',
      },
      include: {
        _count: {
          select: {
            childPages: {
              where: { deletedAt: null }
            },
            blocks: {
              where: { deletedAt: null }
            },
          },
        },
      },
    });
  }

  // Get page by ID with child pages and block count
  async getPageById(id: string) {
    const page = await prisma.page.findUnique({
      where: { 
        id,
        deletedAt: null 
      },
      include: {
        childPages: {
          where: { deletedAt: null },
          orderBy: {
            sortIndex: 'asc',
          },
        },
        _count: {
          select: {
            blocks: {
              where: { deletedAt: null }
            },
          },
        },
      },
    });

    if (!page) {
      throw new Error('Page not found');
    }

    return page;
  }

  // Create a new page
  async createPage(data: CreatePageData) {
    // Calculate sort index for new page
    let sortIndex = 0;
    
    if (data.parentPageId) {
      const lastSibling = await prisma.page.findFirst({
        where: { 
          parentPageId: data.parentPageId,
          deletedAt: null
        },
        orderBy: { sortIndex: 'desc' },
      });
      sortIndex = (lastSibling?.sortIndex ?? -1) + 1;
    } else {
      const lastTopLevel = await prisma.page.findFirst({
        where: { 
          parentPageId: null,
          deletedAt: null
        },
        orderBy: { sortIndex: 'desc' },
      });
      sortIndex = (lastTopLevel?.sortIndex ?? -1) + 1;
    }

    return prisma.page.create({
      data: {
        ...data,
        sortIndex,
      },
      include: {
        _count: {
          select: {
            childPages: {
              where: { deletedAt: null }
            },
            blocks: {
              where: { deletedAt: null }
            },
          },
        },
      },
    });
  }

  // Update a page
  async updatePage(id: string, data: UpdatePageData) {
    // Check if page exists and is not deleted
    const existingPage = await prisma.page.findUnique({
      where: { 
        id,
        deletedAt: null 
      },
    });

    if (!existingPage) {
      throw new Error('Page not found');
    }

    return prisma.page.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            childPages: {
              where: { deletedAt: null }
            },
            blocks: {
              where: { deletedAt: null }
            },
          },
        },
      },
    });
  }

  // Soft delete a page and all its children/blocks
  async deletePage(id: string) {
    // Check if page exists
    const page = await prisma.page.findUnique({
      where: { 
        id,
        deletedAt: null 
      },
    });

    if (!page) {
      throw new Error('Page not found');
    }

    const now = new Date();

    // Use transaction to ensure consistency
    return prisma.$transaction(async (tx) => {
      // Soft delete all child pages recursively
      await this.deletePageRecursive(tx, id, now);
      
      // Soft delete all blocks in this page
      await tx.block.updateMany({
        where: { 
          pageId: id,
          deletedAt: null
        },
        data: { deletedAt: now },
      });

      // Soft delete the page itself
      await tx.page.update({
        where: { id },
        data: { deletedAt: now },
      });
    });
  }

  // Recursive helper for soft deleting pages
  private async deletePageRecursive(
    tx: Prisma.TransactionClient, 
    pageId: string, 
    deletedAt: Date
  ) {
    // Get all child pages
    const childPages = await tx.page.findMany({
      where: { 
        parentPageId: pageId,
        deletedAt: null
      },
      select: { id: true },
    });

    // Recursively delete child pages
    for (const child of childPages) {
      await this.deletePageRecursive(tx, child.id, deletedAt);
      
      // Soft delete blocks in child page
      await tx.block.updateMany({
        where: { 
          pageId: child.id,
          deletedAt: null
        },
        data: { deletedAt },
      });
    }

    // Soft delete all child pages
    if (childPages.length > 0) {
      await tx.page.updateMany({
        where: { 
          parentPageId: pageId,
          deletedAt: null
        },
        data: { deletedAt },
      });
    }
  }

  // Get page blocks with hierarchy
  async getPageBlocks(pageId: string) {
    // Verify page exists and is not deleted
    const page = await prisma.page.findUnique({
      where: { 
        id: pageId,
        deletedAt: null 
      },
    });

    if (!page) {
      throw new Error('Page not found');
    }

    // Get all blocks in the page (only top-level, non-deleted)
    return prisma.block.findMany({
      where: {
        pageId,
        parentBlockId: null,
        deletedAt: null,
      },
      orderBy: {
        sortIndex: 'asc',
      },
      include: {
        childBlocks: {
          where: { deletedAt: null },
          orderBy: {
            sortIndex: 'asc',
          },
        },
      },
    });
  }

  // Move page to different parent or reorder
  async movePage(pageId: string, newParentId: string | null, afterPageId?: string) {
    const page = await prisma.page.findUnique({
      where: { 
        id: pageId,
        deletedAt: null 
      },
    });

    if (!page) {
      throw new Error('Page not found');
    }

    // Get siblings in the new parent context
    const siblings = await prisma.page.findMany({
      where: {
        parentPageId: newParentId,
        deletedAt: null,
        NOT: { id: pageId },
      },
      orderBy: { sortIndex: 'asc' },
    });

    // Calculate new sort index
    let newSortIndex = 0;
    if (afterPageId) {
      const afterIndex = siblings.findIndex(s => s.id === afterPageId);
      if (afterIndex === -1) {
        throw new Error('Reference page not found');
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

    return prisma.page.update({
      where: { id: pageId },
      data: {
        parentPageId: newParentId,
        sortIndex: newSortIndex,
      },
    });
  }
}