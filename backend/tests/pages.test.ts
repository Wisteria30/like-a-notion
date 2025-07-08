import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { resetDatabase } from './setup';

const app = createApp();

describe('Pages API', () => {
  beforeEach(async () => {
    // Delete in order to respect foreign key constraints
    await prisma.block.deleteMany({});
    await prisma.page.deleteMany({});
    
    // Ensure default user exists
    await prisma.user.upsert({
      where: { id: 'default-user-id' },
      update: {},
      create: {
        id: 'default-user-id',
        email: 'default@example.com',
        name: 'Default User',
      },
    });
  });
  describe('GET /api/pages', () => {
    it('should return empty array when no pages exist', async () => {
      const response = await request(app).get('/api/pages');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: [],
      });
    });

    it('should return only top-level pages', async () => {
      const parentPage = await prisma.page.create({
        data: {
          title: 'Parent Page',
          createdById: 'default-user-id',
        },
      });

      const childPage = await prisma.page.create({
        data: {
          title: 'Child Page',
          parentPageId: parentPage.id,
          createdById: 'default-user-id',
        },
      });

      const response = await request(app).get('/api/pages');
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Parent Page');
    });
  });

  describe('POST /api/pages', () => {
    it('should create a new page', async () => {
      const pageData = {
        title: 'Test Page',
        icon: '📄',
      };

      const response = await request(app)
        .post('/api/pages')
        .send(pageData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        title: 'Test Page',
        icon: '📄',
        createdById: 'default-user-id',
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/pages')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    it('should create a child page', async () => {
      const parentPage = await prisma.page.create({
        data: {
          title: 'Parent Page',
          createdById: 'default-user-id',
        },
      });

      const response = await request(app)
        .post('/api/pages')
        .send({
          title: 'Child Page',
          parentPageId: parentPage.id,
        });
      
      expect(response.status).toBe(201);
      expect(response.body.data.parentPageId).toBe(parentPage.id);
    });
  });

  describe('GET /api/pages/:id', () => {
    it('should return a page by ID', async () => {
      const page = await prisma.page.create({
        data: {
          title: 'Test Page',
          createdById: 'default-user-id',
        },
      });

      const response = await request(app).get(`/api/pages/${page.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(page.id);
      expect(response.body.data.title).toBe('Test Page');
    });

    it('should return 404 for non-existent page', async () => {
      const response = await request(app).get('/api/pages/non-existent-id');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/pages/:id', () => {
    it('should update a page', async () => {
      const page = await prisma.page.create({
        data: {
          title: 'Original Title',
          createdById: 'default-user-id',
        },
      });

      const response = await request(app)
        .put(`/api/pages/${page.id}`)
        .send({
          title: 'Updated Title',
          icon: '✏️',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.icon).toBe('✏️');
    });
  });

  describe('DELETE /api/pages/:id', () => {
    it('should delete a page', async () => {
      const page = await prisma.page.create({
        data: {
          title: 'To Delete',
          createdById: 'default-user-id',
        },
      });

      const response = await request(app).delete(`/api/pages/${page.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(page.id);

      const deletedPage = await prisma.page.findUnique({
        where: { id: page.id },
      });
      expect(deletedPage).not.toBeNull();
      expect(deletedPage!.deletedAt).not.toBeNull();
    });
  });

  describe('GET /api/pages/:id/blocks', () => {
    it('should return blocks for a page', async () => {
      const page = await prisma.page.create({
        data: {
          title: 'Page with Blocks',
          createdById: 'default-user-id',
        },
      });

      await prisma.block.createMany({
        data: [
          {
            pageId: page.id,
            type: 'heading_1',
            properties: { text: 'Heading' },
            sortIndex: 0,
            createdById: 'default-user-id',
            lastEditedById: 'default-user-id',
          },
          {
            pageId: page.id,
            type: 'paragraph',
            properties: { text: 'Content' },
            sortIndex: 1,
            createdById: 'default-user-id',
            lastEditedById: 'default-user-id',
          },
        ],
      });

      const response = await request(app).get(`/api/pages/${page.id}/blocks`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].properties.text).toBe('Heading');
      expect(response.body.data[1].properties.text).toBe('Content');
    });
  });
});