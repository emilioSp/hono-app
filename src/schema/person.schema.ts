import { z } from 'zod';

export const createPersonInputSchema = z.object({
  name: z.string().min(1),
  surname: z.string().min(1),
  age: z.number().int().min(0).max(120).optional(),
});

export const personIdSchema = z.object({
  id: z.uuidv7(),
});

export const personSchema = createPersonInputSchema.extend({
  id: z.uuidv7(),
  createdAt: z.iso.datetime(),
  age: z.number().int().min(0).max(120).nullable(),
});

export const personResponseSchema = z.object({ data: personSchema });
export const peopleResponseSchema = z.object({ data: z.array(personSchema) });

export type CreatePersonInput = z.infer<typeof createPersonInputSchema>;
export type PersonSchema = z.infer<typeof personSchema>;
