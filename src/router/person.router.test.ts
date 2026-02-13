import { afterAll, describe, expect, it } from 'vitest';
import { app } from '#app';
import '#router/person.router.ts';
import { db } from '#repository/db.ts';

describe('Person Router', () => {
  afterAll(async () => {
    await db.destroy();
  });

  describe('POST /person', () => {
    it('creates a person with all fields', async () => {
      const response = await app.request('/person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John',
          surname: 'Doe',
          age: 30,
        }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.data).toMatchObject({
        name: 'John',
        surname: 'Doe',
        age: 30,
      });
      expect(body.data.id).toBeDefined();
      expect(body.data.createdAt).toBeDefined();
    });

    it('creates a person without age', async () => {
      const response = await app.request('/person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane',
          surname: 'Smith',
        }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.data).toMatchObject({
        name: 'Jane',
        surname: 'Smith',
        age: null,
      });
    });

    it('returns 400 when name is empty', async () => {
      const response = await app.request('/person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          surname: 'Doe',
        }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 400 when surname is missing', async () => {
      const response = await app.request('/person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John',
        }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 400 when age is negative', async () => {
      const response = await app.request('/person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John',
          surname: 'Doe',
          age: -1,
        }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 400 when age exceeds 120', async () => {
      const response = await app.request('/person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John',
          surname: 'Doe',
          age: 121,
        }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('BAD_REQUEST');
    });
  });

  describe('GET /people', () => {
    it('returns empty array when no people exist', async () => {
      const response = await app.request('/people');

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toEqual([]);
    });

    it('returns all people ordered by createdAt desc', async () => {
      await app.request('/person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'First', surname: 'Person' }),
      });

      await app.request('/person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Second', surname: 'Person' }),
      });

      const response = await app.request('/people');

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toHaveLength(2);
      expect(body.data[0].name).toBe('Second');
      expect(body.data[1].name).toBe('First');
    });
  });

  describe('GET /person/:id', () => {
    it('returns a person by id', async () => {
      const createResponse = await app.request('/person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John',
          surname: 'Doe',
          age: 25,
        }),
      });

      const { data: createdPerson } = await createResponse.json();

      const response = await app.request(`/person/${createdPerson.id}`);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toMatchObject({
        id: createdPerson.id,
        name: 'John',
        surname: 'Doe',
        age: 25,
      });
    });

    it('returns 404 when person not found', async () => {
      const nonExistentId = '01956789-abcd-7000-8000-123456789abc';
      const response = await app.request(`/person/${nonExistentId}`);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 when id is not a valid uuid', async () => {
      const response = await app.request('/person/invalid-id');

      expect(response.status).toBe(400);
    });
  });
});
