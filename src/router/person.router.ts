import { createRoute } from '@hono/zod-openapi';
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

const createPersonRoute = createRoute({
  method: 'post',
  path: '/person',
  tags: ['Person'],
  summary: 'Create a person',
  request: {
    body: {
      content: { 'application/json': { schema: createPersonInputSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: personResponseSchema } },
      description: 'Person created',
    },
  },
});

const listPeopleRoute = createRoute({
  method: 'get',
  path: '/people',
  tags: ['Person'],
  summary: 'List all people',
  responses: {
    200: {
      content: { 'application/json': { schema: peopleResponseSchema } },
      description: 'List of people',
    },
  },
});

const getPersonRoute = createRoute({
  method: 'get',
  path: '/person/{id}',
  tags: ['Person'],
  summary: 'Get a person by ID',
  request: {
    params: personIdSchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: personResponseSchema } },
      description: 'Person found',
    },
    404: {
      description: 'Person not found',
    },
  },
});

app.openapi(createPersonRoute, async (c) => {
  const input = c.req.valid('json');
  const person = await createPerson(input);
  const response = personResponseSchema.parse({ data: person });
  return c.json(response, 201);
});

app.openapi(listPeopleRoute, async (c) => {
  const people = await listPeople();
  const response = peopleResponseSchema.parse({ data: people });
  return c.json(response, 200);
});

app.openapi(getPersonRoute, async (c) => {
  const { id } = c.req.valid('param');
  const person = await getPerson(id);
  const response = personResponseSchema.parse({ data: person });
  return c.json(response, 200);
});
