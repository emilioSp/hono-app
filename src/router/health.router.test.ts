import { describe, expect, it } from 'vitest';
import { app } from '#app';
import '#router/health.router.ts';

describe('Health Router', () => {
  describe('GET /health', () => {
    it('returns status OK', async () => {
      const response = await app.request('/health');

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ status: 'OK' });
    });
  });
});
