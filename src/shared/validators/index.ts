import { z } from 'zod/v4';

export const uuidSchema = z.string().uuid();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const idParamSchema = z.object({
  id: uuidSchema,
});

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
