import { z } from '@hono/zod-openapi';

export const createPersonInputSchema = z
  .object({
    name: z.string().min(1),
    surname: z.string().min(1),
    age: z.number().int().min(0).max(120).optional(),
  })
  .openapi('CreatePersonInput');

export const personIdSchema = z.object({
  id: z.uuidv7(),
}).openapi('PersonId');

export const personSchema = createPersonInputSchema
  .extend({
    id: z.uuidv7(),
    createdAt: z.iso.datetime(),
    age: z.number().int().min(0).max(120).nullable(),
  })
  .openapi('Person');

export const personResponseSchema = z
  .object({ data: personSchema })
  .openapi('PersonResponse');

export const peopleResponseSchema = z
  .object({ data: z.array(personSchema) })
  .openapi('PeopleResponse');

export type CreatePersonInput = z.infer<typeof createPersonInputSchema>;
export type PersonSchema = z.infer<typeof personSchema>;
