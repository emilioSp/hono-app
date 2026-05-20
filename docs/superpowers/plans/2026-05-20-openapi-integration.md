# OpenAPI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose a `GET /openapi.json` endpoint that auto-generates an OpenAPI 3.1 spec from existing Zod schemas using `@hono/zod-openapi` (already installed at v1.4.0, Zod v4 compatible).

**Architecture:** Replace `Hono` with `OpenAPIHono` (drop-in replacement), move validation error handling to `defaultHook`, refactor person routes from `app.post/get()` to `app.openapi(createRoute(...), handler)`. The spec endpoint is registered via `app.doc31('/openapi.json', ...)` — no custom handler needed.

**Tech Stack:** `@hono/zod-openapi` v1.4.0, `zod` v4.4.3, `hono` v4.12.21, `vitest` v4.1.7

---

## Files Changed

- Modify: `src/schema/person.schema.ts` — add `.openapi()` component names to named schemas
- Modify: `src/app.ts` — swap `Hono` → `OpenAPIHono`, add `defaultHook`, register `/openapi.json`
- Modify: `src/router/person.router.ts` — refactor 3 routes to `createRoute` + `app.openapi()`
- Modify: `src/router/person.router.test.ts` — add test for `GET /openapi.json`

---

## Task 1: Add `.openapi()` component names to schemas

**Files:**
- Modify: `src/schema/person.schema.ts`

- [ ] **Step 1: Change the `z` import source**

`@hono/zod-openapi` re-exports Zod's `z` extended with the `.openapi()` method. Swap the import so schemas can call `.openapi()`.

In `src/schema/person.schema.ts`, replace line 1:

```ts
import { z } from '@hono/zod-openapi';
```

- [ ] **Step 2: Register named schemas as OpenAPI components**

Add `.openapi('ComponentName')` to the schemas that should appear as reusable `$ref` components in the spec. Structural logic is untouched.

Replace the contents of `src/schema/person.schema.ts` with:

```ts
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
});

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
```

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/schema/person.schema.ts
git commit -m "feat: register person schemas as OpenAPI components"
```

---

## Task 2: Upgrade app to OpenAPIHono with defaultHook and spec endpoint

**Files:**
- Modify: `src/app.ts`

- [ ] **Step 1: Replace `src/app.ts` with the updated version**

Key changes:
- `Hono` → `OpenAPIHono` (extends Hono, fully backward-compatible)
- `defaultHook` throws `BadRequestError` for all failed validations (preserves existing 400 error behavior)
- `app.doc31('/openapi.json', ...)` registers the spec endpoint

```ts
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { AppError } from '#error/app.error.ts';
import { BadRequestError } from '#error/bad-request.error.ts';
import { asyncLocalStorage, logger } from '#logger';

const errorManager = (err: Error, c: Context) => {
  const requestId = asyncLocalStorage.getStore()?.requestId;

  logger.error({
    message: 'Request failed',
    error: err,
    data: { requestId },
  });

  if (err instanceof AppError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          requestId,
        },
      },
      err.status,
    );
  }

  return c.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        requestId,
      },
    },
    500,
  );
};

export const app = new OpenAPIHono({
  // Runs only when @hono/zod-openapi fails request validation (body, params, query).
  // Thrown errors are caught by app.onError(errorManager) below.
  defaultHook: (result, c) => {
    if (!result.success) {
      throw new BadRequestError({
        message: 'Validation failed',
        error: result.error,
        context: { path: c.req.path },
      });
    }
  },
});

app.use(async (c, next) => {
  const startTime = performance.now();
  const requestId = randomUUID();

  await asyncLocalStorage.run(
    {
      startTime,
      requestId,
      path: c.req.path,
      method: c.req.method,
    },
    async () => {
      await next();
      const duration = performance.now() - startTime;
      c.header('X-Response-Time', `${duration.toFixed(2)}ms`);

      logger.info({
        message: 'Request completed',
        data: {
          status: c.res.status,
          duration: `${duration.toFixed(2)}ms`,
          slow: duration > 3_000,
        },
      });
    },
  );
});

app.onError(errorManager);

app.doc31('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Hono App API',
    version: '1.0.0',
  },
});

export default app;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app.ts
git commit -m "feat: upgrade to OpenAPIHono with validation defaultHook and /openapi.json endpoint"
```

---

## Task 3: Refactor person routes to app.openapi()

**Files:**
- Modify: `src/router/person.router.ts`

- [ ] **Step 1: Replace `src/router/person.router.ts`**

`app.openapi(createRoute(...), handler)` handles validation automatically via `defaultHook`. Remove the `zValidator` middleware and `BadRequestError` import — they are no longer needed in this file.

Note: OpenAPI paths use `{id}` syntax; `app.openapi()` converts them to Hono's `:id` format internally.

```ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/router/person.router.ts
git commit -m "feat: refactor person routes to app.openapi() with createRoute"
```

---

## Task 4: Add test for GET /openapi.json and run full suite

**Files:**
- Modify: `src/router/person.router.test.ts`

- [ ] **Step 1: Add the openapi.json test**

Append a new `describe` block at the end of `src/router/person.router.test.ts` (before the final closing `}`):

```ts
  describe('GET /openapi.json', () => {
    it('returns a valid OpenAPI 3.1 document', async () => {
      const response = await app.request('/openapi.json');

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.openapi).toBe('3.1.0');
      expect(body.info.title).toBe('Hono App API');
      expect(body.paths['/person']).toBeDefined();
      expect(body.paths['/people']).toBeDefined();
      expect(body.paths['/person/{id}']).toBeDefined();
    });
  });
```

- [ ] **Step 2: Run the full test suite**

```bash
npm run test:db:up && npm run migrate && npm run test
```

Expected: all tests pass, including the new openapi.json test.

- [ ] **Step 3: Commit**

```bash
git add src/router/person.router.test.ts
git commit -m "test: add GET /openapi.json integration test"
```

---

## Verification

Manual end-to-end check after all tasks complete:

```bash
npm run dev
# In another terminal:
curl http://localhost:3000/openapi.json | jq .
```

Expected output structure:
```json
{
  "openapi": "3.1.0",
  "info": { "title": "Hono App API", "version": "1.0.0" },
  "components": {
    "schemas": {
      "CreatePersonInput": { ... },
      "Person": { ... },
      "PersonResponse": { ... },
      "PeopleResponse": { ... }
    }
  },
  "paths": {
    "/person": { "post": { ... } },
    "/people": { "get": { ... } },
    "/person/{id}": { "get": { ... } }
  }
}
```