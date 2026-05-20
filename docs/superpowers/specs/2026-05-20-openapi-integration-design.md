# OpenAPI Integration Design

**Date:** 2026-05-20
**Goal:** Automatically generate and serve an OpenAPI 3.1 spec from existing Zod schemas using `@hono/zod-openapi`.

---

## Context

The app has well-defined Zod schemas for all person endpoints but no API documentation. We want to expose a `GET /openapi.json` endpoint that returns a machine-readable OpenAPI spec, derived automatically from those schemas — with no manual duplication.

---

## Approach

Use `@hono/zod-openapi` (built on `@asteasolutions/zod-to-openapi`). It provides:

- `OpenAPIHono` — a drop-in replacement for `Hono` that tracks registered routes
- `createRoute()` — wraps a route definition with OpenAPI metadata (method, path, request/response schemas)
- `app.openapi(route, handler)` — registers a route and its metadata together
- `app.doc(path, config)` — registers a `GET /openapi.json` endpoint that generates the spec on demand

---

## Changes by File

### `package.json`
- Add `@hono/zod-openapi` (verify it supports Zod v4; latest versions of `@asteasolutions/zod-to-openapi` v7+ target Zod v4)

### `src/schema/person.schema.ts`
- Schemas remain structurally identical
- Add `.openapi('ComponentName')` to named schemas (`personSchema`, `personResponseSchema`, `peopleResponseSchema`) so they appear as reusable `$ref` components in the spec rather than being inlined everywhere

```ts
export const personSchema = createPersonInputSchema.extend({
  id: z.uuidv7(),
  createdAt: z.iso.datetime(),
  age: z.number().int().min(0).max(120).nullable(),
}).openapi('Person');
```

### `src/app.ts`
- Replace `new Hono()` with `new OpenAPIHono()`
- Add `app.doc('/openapi.json', { openapi: '3.1.0', info: { title: '...', version: '1.0.0' } })`
- All existing middleware (request tracking, response time, error handler) stays untouched

### `src/router/person.router.ts`
- Each of the 3 routes (`POST /person`, `GET /people`, `GET /person/:id`) refactored from `app.post/get(path, ...)` to `app.openapi(createRoute({ ... }), handler)`
- Handler bodies are untouched — `c.req.valid('json')`, `c.json(...)`, error throwing all stay identical
- Route metadata (method, path, tags, summary, request/response schemas) declared in `createRoute()`

```ts
const createPersonRoute = createRoute({
  method: 'post',
  path: '/person',
  tags: ['Person'],
  summary: 'Create a person',
  request: {
    body: { content: { 'application/json': { schema: createPersonInputSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: personResponseSchema } },
      description: 'Person created',
    },
  },
});

app.openapi(createPersonRoute, async (c) => {
  // exactly as before
});
```

### `src/router/health.router.ts`
- Left as-is. `OpenAPIHono` is backward-compatible with plain `.get()`/`.post()`. Health endpoint will simply be absent from the spec (acceptable).

---

## Spec Endpoint

`GET /openapi.json` — registered automatically via `app.doc()`. Returns the full OpenAPI 3.1 JSON spec, with all schemas as `$ref` components and all `app.openapi()` routes as paths.

---

## Compatibility Risk

The project uses Zod v4 (`4.4.3`). `@hono/zod-openapi` historically targets Zod v3. During install, verify the installed version's peer dependency. If incompatible, the fallback is to use `@asteasolutions/zod-to-openapi` v7 directly (which supports Zod v4) and wire up a manual spec endpoint.

---

## Verification

1. `npm install` — confirm no peer dependency conflicts
2. `npm run build` — TypeScript must pass with no new errors
3. `npm run dev` then `curl http://localhost:3000/openapi.json` — confirm valid JSON with correct paths and schemas
4. `npm test` — existing tests must continue to pass (route handlers are unchanged)
