import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { resetDatabase } from './setup';

const app = createApp();

describe('Blocks API', () => {
  let testPage: any;

  beforeEach(async () => {
    await resetDatabase();
    
    // Verify default user exists
    const user = await prisma.user.findUnique({
      where: { id: 'default-user-id' }
    });
    
    if (!user) {
      throw new Error('Default user not found after resetDatabase');
    }
    
    testPage = await prisma.page.create({
      data: {
        title: 'Test Page',
        createdById: 'default-user-id',
      },
    });
  });

  describe('POST /api/blocks', () => {
    it('should create a new block', async () => {
      expect(testPage).toBeDefined();
      expect(testPage.id).toBeDefined();
      
      const blockData = {
        pageId: testPage.id,
        type: 'paragraph',
        properties: {
          text: 'Hello World',
        },
      };

      const response = await request(app)
        .post('/api/blocks')
        .send(blockData);
      
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        pageId: testPage.id,
        type: 'paragraph',
        properties: {
          text: 'Hello World',
        },
      });
    });

    it('should create a block after another block', async () => {
      const firstBlockResponse = await request(app)
        .post('/api/blocks')
        .send({
          pageId: testPage.id,
          type: 'paragraph',
          properties: { text: 'First' },
        });
      
      const firstBlock = firstBlockResponse.body.data;

      const secondBlockResponse = await request(app)
        .post('/api/blocks')
        .send({
          pageId: testPage.id,
          type: 'paragraph',
          properties: { text: 'Second' },
        });
      
      const secondBlock = secondBlockResponse.body.data;

      const response = await request(app)
        .post('/api/blocks')
        .send({
          pageId: testPage.id,
          type: 'paragraph',
          properties: { text: 'Inserted' },
          afterBlockId: firstBlock.id,
        });
      
      expect(response.status).toBe(201);
      expect(response.body.data.sortIndex).toBe(1); // Inserted after first block

      // 2番目のブロックは元々sortIndex=1だったので、挿入後は2になる
      const updatedBlocks = await prisma.block.findMany({
        where: { pageId: testPage.id },
        orderBy: { sortIndex: 'asc' },
      });
      
      expect(updatedBlocks).toHaveLength(3);
      expect(updatedBlocks[0].id).toBe(firstBlock.id);
      expect(updatedBlocks[1].id).toBe(response.body.data.id);
      expect(updatedBlocks[2].id).toBe(secondBlock.id);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/blocks')
        .send({
          type: 'paragraph',
          properties: { text: 'Test' },
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent page', async () => {
      const response = await request(app)
        .post('/api/blocks')
        .send({
          pageId: 'non-existent-id',
          type: 'paragraph',
          properties: { text: 'Test' },
        });
      
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Page not found');
    });
  });

  describe('PUT /api/blocks/:id', () => {
    it('should update block properties', async () => {
      const createResponse = await request(app)
        .post('/api/blocks')
        .send({
          pageId: testPage.id,
          type: 'paragraph',
          properties: { text: 'Original' },
        });
      
      const block = createResponse.body.data;

      const response = await request(app)
        .put(`/api/blocks/${block.id}`)
        .send({
          properties: { text: 'Updated' },
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data.properties.text).toBe('Updated');
    });

    it('should return 404 for non-existent block', async () => {
      const response = await request(app)
        .put('/api/blocks/non-existent-id')
        .send({
          properties: { text: 'Test' },
        });
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Block not found');
    });
  });

  describe('DELETE /api/blocks/:id', () => {
    it('should delete a block', async () => {
      const createResponse = await request(app)
        .post('/api/blocks')
        .send({
          pageId: testPage.id,
          type: 'paragraph',
          properties: { text: 'To Delete' },
        });
      
      const block = createResponse.body.data;

      const response = await request(app).delete(`/api/blocks/${block.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(block.id);

      const deletedBlock = await prisma.block.findUnique({
        where: { id: block.id },
      });
      expect(deletedBlock).not.toBeNull();
      expect(deletedBlock!.deletedAt).not.toBeNull();
    });

    it('should update sort indices after deletion', async () => {
      // Create blocks via API
      const block1Response = await request(app)
        .post('/api/blocks')
        .send({
          pageId: testPage.id,
          type: 'paragraph',
          properties: { text: '1' },
        });
      
      const block2Response = await request(app)
        .post('/api/blocks')
        .send({
          pageId: testPage.id,
          type: 'paragraph',
          properties: { text: '2' },
        });
      
      const block3Response = await request(app)
        .post('/api/blocks')
        .send({
          pageId: testPage.id,
          type: 'paragraph',
          properties: { text: '3' },
        });
      
      const blocks = [
        block1Response.body.data,
        block2Response.body.data,
        block3Response.body.data,
      ];

      
      const deleteResponse = await request(app).delete(`/api/blocks/${blocks[1].id}`);
      expect(deleteResponse.status).toBe(200);

      const remainingBlocks = await prisma.block.findMany({
        where: { pageId: testPage.id, deletedAt: null },
        orderBy: { sortIndex: 'asc' },
      });
      
      expect(remainingBlocks).toHaveLength(2);
      expect(remainingBlocks[0].id).toBe(blocks[0].id);
      expect(remainingBlocks[0].sortIndex).toBe(0);
      expect(remainingBlocks[1].id).toBe(blocks[2].id);
      expect(remainingBlocks[1].sortIndex).toBe(1);
    });
  });
});