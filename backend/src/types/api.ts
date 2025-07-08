// API Request/Response types
import { z } from 'zod';

// Validation schemas
export const CreatePageSchema = z.object({
  title: z.string().min(1).max(200),
  parentPageId: z.string().optional(),
  icon: z.string().optional(),
  coverImage: z.string().url().optional(),
});

export const UpdatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  icon: z.string().optional(),
  coverImage: z.string().url().optional(),
});

export const CreateBlockSchema = z.object({
  pageId: z.string(),
  type: z.string(),
  properties: z.record(z.any()),
  parentBlockId: z.string().optional(),
  afterBlockId: z.string().optional(), // For positioning
});

export const UpdateBlockSchema = z.object({
  properties: z.record(z.any()).optional(),
  sortIndex: z.number().optional(),
});

// Type exports
export type CreatePageRequest = z.infer<typeof CreatePageSchema>;
export type UpdatePageRequest = z.infer<typeof UpdatePageSchema>;
export type CreateBlockRequest = z.infer<typeof CreateBlockSchema>;
export type UpdateBlockRequest = z.infer<typeof UpdateBlockSchema>;