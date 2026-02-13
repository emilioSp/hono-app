import { beforeEach } from 'vitest';
import { db } from '#repository/db.ts';

beforeEach(async () => {
  await db.raw('TRUNCATE TABLE people CASCADE');
});
