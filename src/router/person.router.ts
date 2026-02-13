import { zValidator } from '@hono/zod-validator';
import { app } from '#app';
import {
  createPersonInputSchema,
  peopleResponseSchema,
  personIdSchema,
  personResponseSchema,
} from '#schema/person.schema.ts';
import {
  createPerson,
  getPerson,
  listPeople,
} from '#service/person.service.ts';
import { BadRequestError } from '../error/bad-request.error.ts';

app.post(
  '/person',
  zValidator('json', createPersonInputSchema, (result, c) => {
    if (!result.success) {
      throw new BadRequestError({
        message: 'Invalid person payload',
        error: result.error,
        context: { path: c.req.path },
      });
    }
  }),
  async (c) => {
    const input = c.req.valid('json');
    const person = await createPerson(input);
    const response = personResponseSchema.parse({ data: person });
    return c.json(response, 201);
  },
);

app.get('/people', async (c) => {
  const people = await listPeople();
  const response = peopleResponseSchema.parse({ data: people });
  return c.json(response);
});

app.get('person/:id', zValidator('param', personIdSchema), async (c) => {
  const { id } = c.req.param();
  const person = await getPerson(id);
  const response = personResponseSchema.parse({ data: person });
  return c.json(response, 200);
});
